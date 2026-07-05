import express from 'express';
import authRouter from './auth.js';
import usersRouter from './users.js';
import coursesRouter from './courses.js';
import quizzesRouter from './quizzes.js';
import assignmentsRouter from './assignments.js';
import messagesRouter from './messages.js';
import notificationsRouter from './notifications.js';
import attendanceRouter from './attendance.js';
import announcementsRouter from './announcements.js';
import aiRouter from './ai.js';
import auditRouter from './audit.js';
import { dbService } from '../services/dbService.js';
import { authMiddleware, requireRole } from '../utils/auth.js';
import { logAction } from '../utils/auditLogger.js';
import { auditMiddleware } from '../middlewares/auditMiddleware.js';

const router = express.Router();

// Intercept and automatically audit sensitive actions
router.use(auditMiddleware as any);

// Mount individual resources
router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/courses', coursesRouter);
router.use('/quizzes', quizzesRouter);
router.use('/assignments', assignmentsRouter);
router.use('/messages', messagesRouter);
router.use('/notifications', notificationsRouter);
router.use('/attendance', attendanceRouter);
router.use('/announcements', announcementsRouter);
router.use('/ai', aiRouter);
router.use('/audit-logs', auditRouter);

// Directly map submission endpoints requested by front-end with JWT security
router.get('/submissions', authMiddleware as any, async (req: any, res, next) => {
  try {
    let submissions;
    if (req.user.role === 'teacher' || req.user.role === 'admin') {
      submissions = await dbService.getSubmissions();
    } else {
      const allSubmissions = await dbService.getSubmissions();
      submissions = allSubmissions.filter((sub: any) => sub.studentId === req.user.id);
    }
    res.json(submissions);
  } catch (error) {
    next(error);
  }
});

router.post('/submissions/:id/grade', authMiddleware as any, requireRole(['teacher', 'admin']) as any, async (req: any, res, next) => {
  try {
    const { id } = req.params;
    const { grade, feedback } = req.body;
    const updated = await dbService.updateSubmission(id, { grade: Number(grade), feedback });

    await logAction(req.user.id, 'SUBMISSION_GRADE', `Graded submission ID ${id} with grade ${grade}`, req);

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

export default router;
