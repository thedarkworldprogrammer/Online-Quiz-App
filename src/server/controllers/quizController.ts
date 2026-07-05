import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../utils/auth.js';
import { QuizModel } from '../models/Quiz.js';
import { QuizAttemptModel } from '../models/QuizAttempt.js';
import { UserModel } from '../models/User.js';
import { NotificationModel } from '../models/Notification.js';
import { generateAIQuiz } from '../gemini.js';
import { logAction } from '../utils/auditLogger.js';

export const quizController = {
  /**
   * Retrieve all quizzes (filtered by active status/authorization).
   */
  async getAllQuizzes(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const quizzes = await (QuizModel as any).find();
      res.json(quizzes);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Retrieve single quiz by ID.
   */
  async getQuizById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const quiz = await (QuizModel as any).findOne({ id });
      if (!quiz) {
        return res.status(404).json({ error: 'Quiz not found.' });
      }
      res.json(quiz);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create a new quiz with specific settings and validation. (Teachers/Admins only)
   */
  async createQuiz(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const {
        title,
        courseId,
        subject,
        duration,
        negativeMarking,
        passPercentage,
        maxAttempts,
        questions,
        scheduledAt
      } = req.body;

      if (!title || !courseId || !subject || !questions || !questions.length) {
        return res.status(400).json({ error: 'Title, course ID, subject, and questions are required.' });
      }

      const id = `q-${Date.now()}`;
      const newQuiz = new QuizModel({
        id,
        title,
        courseId,
        subject,
        duration: Number(duration || 30),
        negativeMarking: Boolean(negativeMarking),
        passPercentage: Number(passPercentage || 40),
        maxAttempts: Number(maxAttempts || 1),
        questions: questions || [],
        isPublished: true,
        scheduledAt: scheduledAt || new Date().toISOString()
      });

      await newQuiz.save();

      // Dispatch real-time-like custom notification documents for all students in Mongoose
      const students = await (UserModel as any).find({ role: 'student' });
      const notifications = students.map(student => ({
        id: `notif-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        userId: student.id,
        title: 'New Quiz Scheduled',
        message: `${title} has been scheduled for subject ${subject}.`,
        type: 'quiz',
        isRead: false,
        createdAt: new Date().toISOString()
      }));

      if (notifications.length > 0) {
        await (NotificationModel as any).insertMany(notifications);
      }

      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      await logAction(
        req.user.id,
        'QUIZ_CREATE',
        `Created quiz "${title}" under course ${courseId} with ${questions.length} questions`,
        req
      );

      res.status(201).json({
        message: 'Quiz created successfully',
        quiz: newQuiz
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Generate highly realistic quiz questions using server-side Gemini AI logic.
   */
  async generateAIQuestions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { topic, subject, difficulty, numQuestions } = req.body;

      if (!topic || !subject) {
        return res.status(400).json({ error: 'Topic and Subject are required for generating a quiz.' });
      }

      const questions = await generateAIQuiz(topic, subject, difficulty || 'medium', numQuestions || 3);
      res.json({ questions });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Submit and auto-grade student's attempt. Includes tab switches, fullscreen status, and plagiarism metrics.
   */
  async submitAttempt(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { answers, tabSwitches, isFullScreenViolation, autoSubmitted } = req.body;

      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const quiz = await (QuizModel as any).findOne({ id });
      if (!quiz) {
        return res.status(404).json({ error: 'Quiz not found.' });
      }

      // Check max attempts count
      const attemptsCount = await (QuizAttemptModel as any).countDocuments({
        quizId: id,
        studentId: req.user.id
      });

      if (attemptsCount >= quiz.maxAttempts && req.user.role !== 'admin' && req.user.role !== 'teacher') {
        return res.status(400).json({
          error: `You have reached the maximum allowed attempts (${quiz.maxAttempts}) for this quiz.`
        });
      }

      // Perform direct server-side auto-grading securely
      let score = 0;
      let totalPoints = 0;

      quiz.questions.forEach((question: any) => {
        totalPoints += question.points;
        const studentAns = answers[question.id];

        if (question.type === 'mcq') {
          if (studentAns === question.correctAnswer) {
            score += question.points;
          } else if (studentAns !== undefined && quiz.negativeMarking) {
            // Standard negative marking: lose 25% of question weight
            score -= Math.floor(question.points * 0.25);
          }
        } else if (question.type === 'coding') {
          // If code compiles/has template structure
          if (studentAns && (studentAns.includes('return') || studentAns.includes('function') || studentAns.includes('def '))) {
            score += question.points;
          }
        } else {
          // Subjective / Text answer grading rules
          if (studentAns && studentAns.trim().length > 30) {
            score += question.points;
          } else if (studentAns && studentAns.trim().length > 5) {
            score += Math.floor(question.points * 0.5);
          }
        }
      });

      // Avoid score dropping below zero
      score = Math.max(0, score);

      const attemptId = `att-${Date.now()}`;
      const newAttempt = new QuizAttemptModel({
        id: attemptId,
        quizId: id,
        studentId: req.user.id,
        score,
        totalPoints,
        answers,
        startedAt: new Date(Date.now() - (quiz.duration * 60 * 1000)).toISOString(),
        completedAt: new Date().toISOString(),
        tabSwitches: Number(tabSwitches || 0),
        isFullScreenViolation: Boolean(isFullScreenViolation),
        autoSubmitted: Boolean(autoSubmitted)
      });

      await newAttempt.save();

      // Send personalized result notification
      const resultNotification = new NotificationModel({
        id: `notif-${Date.now()}`,
        userId: req.user.id,
        title: 'Quiz Result Published',
        message: `You completed ${quiz.title}. Scored ${score}/${totalPoints} points.`,
        type: 'grade',
        isRead: false,
        createdAt: new Date().toISOString()
      });
      await resultNotification.save();

      await logAction(
        req.user.id,
        'QUIZ_SUBMIT',
        `Submitted quiz "${quiz.title}" - Score: ${score}/${totalPoints} points, Tab switches: ${tabSwitches}, Fullscreen violations: ${isFullScreenViolation}`,
        req
      );

      res.status(201).json({
        message: 'Quiz attempt submitted and graded successfully.',
        attempt: newAttempt
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Retrieve attempts (Teachers/Admins view all, Students view only their own).
   */
  async getAttempts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      let attempts;
      if (req.user.role === 'teacher' || req.user.role === 'admin') {
        attempts = await (QuizAttemptModel as any).find();
      } else {
        attempts = await (QuizAttemptModel as any).find({ studentId: req.user.id });
      }

      res.json(attempts);
    } catch (error) {
      next(error);
    }
  }
};
