import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BookOpen, 
  Users, 
  Award, 
  Sparkles, 
  Send, 
  Bell, 
  MessageSquare, 
  Clock, 
  Plus, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Trash2, 
  FileText, 
  Upload, 
  Calendar, 
  Code, 
  HelpCircle,
  Eye, 
  ShieldAlert, 
  Check, 
  UserPlus, 
  Lock, 
  Download,
  Volume2,
  RefreshCw,
  Search,
  Activity,
  Menu,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  TrendingDown,
  ChevronDown,
  History,
  Percent,
  X,
  Flag,
  Trophy,
  Grid,
  EyeOff,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Course, Quiz, QuizAttempt, Assignment, Submission, Message, Notification, Attendance, Announcement, AIRecommendation, AuditLog } from './types';
import Achievements from './components/Achievements';
import QuizLeaderboard from './components/QuizLeaderboard';
import KanbanBoard from './components/KanbanBoard';
import AuditLogTable from './components/AuditLogTable';
import AttendanceChart from './components/AttendanceChart';

const statsContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const statsTileVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: 'spring', 
      stiffness: 100, 
      damping: 15 
    } 
  },
};

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<'admin' | 'teacher' | 'student'>('student');
  const [loadingUser, setLoadingUser] = useState(true);

  // App global state
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [aiRec, setAiRec] = useState<AIRecommendation | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assessments' | 'assignments' | 'ai-insights' | 'messages' | 'users' | 'courses' | 'audit-logs'>('dashboard');
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [auditRoleFilter, setAuditRoleFilter] = useState('all');
  const [auditActionFilter, setAuditActionFilter] = useState('all');

  const [auditStartDate, setAuditStartDate] = useState('');
  const [auditEndDate, setAuditEndDate] = useState('');

  // Memoized audit logs computation to prevent heavy re-filtering/re-rendering
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const query = searchQuery.toLowerCase();
      const matchQuery = searchQuery === '' ||
        log.userName.toLowerCase().includes(query) ||
        log.userEmail.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        log.details.toLowerCase().includes(query);

      const matchRole = auditRoleFilter === 'all' || log.userRole === auditRoleFilter;
      const matchAction = auditActionFilter === 'all' || log.action === auditActionFilter;

      let matchDate = true;
      if (log.timestamp) {
        const logDate = new Date(log.timestamp);
        if (auditStartDate) {
          const start = new Date(auditStartDate);
          start.setHours(0, 0, 0, 0);
          if (logDate < start) matchDate = false;
        }
        if (auditEndDate) {
          const end = new Date(auditEndDate);
          end.setHours(23, 59, 59, 999);
          if (logDate > end) matchDate = false;
        }
      }

      return matchQuery && matchRole && matchAction && matchDate;
    });
  }, [auditLogs, searchQuery, auditRoleFilter, auditActionFilter, auditStartDate, auditEndDate]);

  // Assessment Player State
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizTimer, setQuizTimer] = useState(0); // seconds remaining
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showProctorAlert, setShowProctorAlert] = useState(false);
  const [isReviewingQuiz, setIsReviewingQuiz] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'unanswered' | 'flagged'>('all');
  const [lastJumpedQuestionId, setLastJumpedQuestionId] = useState<string | null>(null);
  const [collapsedReviewQuestions, setCollapsedReviewQuestions] = useState<Record<string, boolean>>({});
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [selectedAttemptForReview, setSelectedAttemptForReview] = useState<QuizAttempt | null>(null);
  const [justFinishedAttempt, setJustFinishedAttempt] = useState<QuizAttempt | null>(null);
  const [highlightedAttemptId, setHighlightedAttemptId] = useState<string | null>(null);
  const [showQuestionPalette, setShowQuestionPalette] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Quiz Attendance Confirmation state
  const [quizToConfirm, setQuizToConfirm] = useState<Quiz | null>(null);
  const [confirmAttendanceChecked, setConfirmAttendanceChecked] = useState(false);
  const [isConfirmingAttendanceLoading, setIsConfirmingAttendanceLoading] = useState(false);

  // Creation Modals & Forms
  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);

  // Form Fields
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizSubject, setNewQuizSubject] = useState('');
  const [newQuizDuration, setNewQuizDuration] = useState('15');
  const [newQuizNegative, setNewQuizNegative] = useState(false);
  const [newQuizPass, setNewQuizPass] = useState('50');
  const [newQuizQuestions, setNewQuizQuestions] = useState<any[]>([
    { type: 'mcq', text: '', options: ['', '', '', ''], correctAnswer: '0', points: 5, difficulty: 'medium' }
  ]);
  const [aiTopic, setAiTopic] = useState('');
  const [aiNumQ, setAiNumQ] = useState('3');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const [newAsgTitle, setNewAsgTitle] = useState('');
  const [newAsgDesc, setNewAsgDesc] = useState('');
  const [newAsgSubject, setNewAsgSubject] = useState('');
  const [newAsgDeadline, setNewAsgDeadline] = useState('');
  const [newAsgPoints, setNewAsgPoints] = useState('100');
  const [newAsgAllowLate, setNewAsgAllowLate] = useState(true);

  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseSemester, setNewCourseSemester] = useState('4th Semester');
  const [newCourseBatch, setNewCourseBatch] = useState('Batch A');
  const [newCourseSubjects, setNewCourseSubjects] = useState('');

  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'teacher' | 'student'>('student');

  // Interactive Message State
  const [activeChatUser, setActiveChatUser] = useState<User | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [typingSim, setTypingSim] = useState(false);

  // Submission Viewer/Grader
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [manualGrade, setManualGrade] = useState('');
  const [manualFeedback, setManualFeedback] = useState('');

  // Local notifications & feedback triggers
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-saving state & Ref
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const prevAnswersRef = useRef<Record<string, string>>({});

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger temporary toasts
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch all initial data
  const fetchData = async (roleOverride?: string) => {
    try {
      const targetRole = roleOverride || currentRole;
      // Fetch user profile
      const userRes = await fetch('/api/auth/me', {
        headers: { 'x-user-id': targetRole === 'admin' ? 'usr-admin-1' : targetRole === 'teacher' ? 'usr-teacher-1' : 'usr-student-1' }
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        setCurrentUser(userData);
      }

      // Fetch static system collections
      const [coursesR, quizzesR, attemptsR, assignmentsR, submissionsR, messagesR, notificationsR, attendanceR, announcementsR, usersR] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/quizzes'),
        fetch('/api/quizzes/attempts'),
        fetch('/api/assignments'),
        fetch('/api/submissions'),
        fetch('/api/messages', { headers: { 'x-user-id': targetRole === 'admin' ? 'usr-admin-1' : targetRole === 'teacher' ? 'usr-teacher-1' : 'usr-student-1' } }),
        fetch('/api/notifications', { headers: { 'x-user-id': targetRole === 'admin' ? 'usr-admin-1' : targetRole === 'teacher' ? 'usr-teacher-1' : 'usr-student-1' } }),
        fetch('/api/attendance'),
        fetch('/api/announcements'),
        fetch('/api/users')
      ]);

      if (coursesR.ok) setCourses(await coursesR.json());
      if (quizzesR.ok) setQuizzes(await quizzesR.json());
      if (attemptsR.ok) setAttempts(await attemptsR.json());
      if (assignmentsR.ok) setAssignments(await assignmentsR.json());
      if (submissionsR.ok) setSubmissions(await submissionsR.json());
      if (messagesR.ok) setMessages(await messagesR.json());
      if (notificationsR.ok) setNotifications(await notificationsR.json());
      if (attendanceR.ok) setAttendance(await attendanceR.json());
      if (announcementsR.ok) setAnnouncements(await announcementsR.json());
      if (usersR.ok) setUsersList(await usersR.json());

      // Fetch AI Study Recommendation if Student
      if (targetRole === 'student') {
        const aiRes = await fetch('/api/ai/recommendations', {
          headers: { 'x-user-id': 'usr-student-1' }
        });
        if (aiRes.ok) {
          setAiRec(await aiRes.json());
        }
      }
    } catch (error) {
      console.error('Failed fetching core dataset:', error);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentRole]);

  const fetchAuditLogs = async () => {
    if (currentRole !== 'admin') return;
    try {
      setLoadingAuditLogs(true);
      const res = await fetch('/api/audit-logs', {
        headers: { 'x-user-id': currentUser?.id || 'usr-admin-1' }
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error("Error fetching audit logs", err);
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit-logs') {
      fetchAuditLogs();
    }
  }, [activeTab, currentRole, currentUser]);

  // Handle Role Switch
  const switchRole = async (role: 'admin' | 'teacher' | 'student') => {
    setLoadingUser(true);
    setCurrentRole(role);
    setActiveTab('dashboard');
    triggerToast(`Switched user context to: ${role.toUpperCase()}`);
    await fetchData(role);
  };

  // Proctor / Anti-Cheat tab-switch detector
  useEffect(() => {
    if (!activeQuiz) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const updated = prev + 1;
          setShowProctorAlert(true);
          triggerToast(`Anti-Cheat Alert: Browser window switch detected (${updated} violations)`);
          return updated;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeQuiz]);

  // Quiz Timer loop
  useEffect(() => {
    if (activeQuiz && quizTimer > 0) {
      timerRef.current = setInterval(() => {
        setQuizTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleAutoSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeQuiz, quizTimer]);

  // Auto-saving progress indicator effect
  useEffect(() => {
    if (!activeQuiz) {
      prevAnswersRef.current = {};
      return;
    }
    const answersChanged = JSON.stringify(quizAnswers) !== JSON.stringify(prevAnswersRef.current);
    if (answersChanged && Object.keys(quizAnswers).length > 0) {
      setIsAutoSaving(true);
      const timer = setTimeout(() => {
        setIsAutoSaving(false);
      }, 1200);
      prevAnswersRef.current = quizAnswers;
      return () => clearTimeout(timer);
    }
    prevAnswersRef.current = quizAnswers;
  }, [quizAnswers, activeQuiz]);

  // Clear highlighted attempt after 5 seconds to end the soft pulse transition gracefully
  useEffect(() => {
    if (highlightedAttemptId) {
      const timer = setTimeout(() => {
        setHighlightedAttemptId(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [highlightedAttemptId]);

  // Jump to Next Flagged Question logic
  const handleJumpToNextFlagged = () => {
    if (!activeQuiz) return;
    
    const flaggedList = activeQuiz.questions.filter(q => flaggedQuestions[q.id]);
    if (flaggedList.length === 0) {
      triggerToast("No flagged questions to jump to. Please flag a question first using the 'Flag Question' button.");
      return;
    }

    // Cycle through flagged questions based on lastJumpedQuestionId
    let nextIndex = 0;
    if (lastJumpedQuestionId) {
      const lastIdx = flaggedList.findIndex(q => q.id === lastJumpedQuestionId);
      if (lastIdx !== -1) {
        nextIndex = (lastIdx + 1) % flaggedList.length;
      }
    }

    const nextQ = flaggedList[nextIndex];
    setLastJumpedQuestionId(nextQ.id);

    // Scroll to the targeted card
    const element = document.getElementById(`question-card-${nextQ.id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Find the absolute position index of this question in the quiz
      const originalIdx = activeQuiz.questions.findIndex(q => q.id === nextQ.id);
      triggerToast(`Jumping to flagged Question ${originalIdx + 1}`);
    } else {
      triggerToast("Could not locate the targeted question element.");
    }
  };

  // Jump to a specific question
  const jumpToQuestion = (qId: string, idx: number) => {
    // 1. Clear filters that might hide the question
    setReviewFilter('all');
    // 2. Expand the question if it's currently collapsed
    setCollapsedReviewQuestions(prev => {
      const updated = { ...prev };
      delete updated[qId];
      return updated;
    });
    // 3. Highlight/flash
    setLastJumpedQuestionId(qId);
    // 4. Scroll to card
    setTimeout(() => {
      const element = document.getElementById(`question-card-${qId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        triggerToast(`Jumped to Question ${idx + 1}`);
      } else {
        triggerToast("Could not locate the question element.");
      }
    }, 150);
  };

  // Launch Assessment Attempt
  const startQuiz = (quiz: Quiz) => {
    // Check if max attempts reached
    const priorAttempts = attempts.filter(a => a.quizId === quiz.id && a.studentId === currentUser?.id);
    if (priorAttempts.length >= quiz.maxAttempts) {
      triggerToast(`Error: Maximum attempt count (${quiz.maxAttempts}) reached for this assessment.`);
      return;
    }

    setActiveQuiz(quiz);
    setQuizTimer(quiz.duration * 60);
    setQuizAnswers({});
    setFlaggedQuestions({});
    setTabSwitchCount(0);
    setShowProctorAlert(false);
    setIsReviewingQuiz(false);
    setReviewFilter('all');
    setLastJumpedQuestionId(null);
    setCollapsedReviewQuestions({});
    setShowSubmitConfirm(false);
    setIsFocusMode(false);
    triggerToast(`Quiz started! Secure Mode activated. Refrain from switching tabs.`);
  };

  const handleInitiateQuiz = (quiz: Quiz) => {
    // Check if max attempts reached
    const priorAttempts = attempts.filter(a => a.quizId === quiz.id && a.studentId === currentUser?.id);
    if (priorAttempts.length >= quiz.maxAttempts) {
      triggerToast(`Error: Maximum attempt count (${quiz.maxAttempts}) reached for this assessment.`);
      return;
    }

    if (currentRole === 'student') {
      setQuizToConfirm(quiz);
      setConfirmAttendanceChecked(false);
    } else {
      startQuiz(quiz);
    }
  };

  const handleConfirmAttendanceAndStart = async () => {
    if (!quizToConfirm || !currentUser) return;
    if (!confirmAttendanceChecked) {
      triggerToast("Please check the confirmation box to proceed.");
      return;
    }

    try {
      setIsConfirmingAttendanceLoading(true);

      // 1. Post to attendance API
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          studentId: currentUser.id,
          courseId: quizToConfirm.courseId,
          status: 'present',
          date: new Date().toISOString().split('T')[0]
        })
      });

      if (!response.ok) {
        throw new Error("Failed to record attendance.");
      }

      // 2. Trigger Toast
      triggerToast(`Attendance confirmed successfully! Opening assessment...`);

      // 3. Reload data so the chart/dashboard is updated with the new attendance record!
      await fetchData();

      // 4. Start the quiz
      const quiz = quizToConfirm;
      setQuizToConfirm(null);
      setConfirmAttendanceChecked(false);
      startQuiz(quiz);

    } catch (err: any) {
      triggerToast(`Error: ${err.message || 'Could not verify attendance.'}`);
    } finally {
      setIsConfirmingAttendanceLoading(false);
    }
  };

  // Submit assessment attempt
  const submitQuizAttempt = async (autoSub = false) => {
    if (!activeQuiz) return;
    try {
      const response = await fetch(`/api/quizzes/${activeQuiz.id}/attempt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'usr-student-1'
        },
        body: JSON.stringify({
          studentId: currentUser?.id,
          answers: quizAnswers,
          tabSwitches: tabSwitchCount,
          isFullScreenViolation: tabSwitchCount > 1,
          autoSubmitted: autoSub
        })
      });

      if (response.ok) {
        const data = await response.json();
        triggerToast("Assessment submitted & graded instantly. Check your updated performance report.");
        setActiveQuiz(null);
        setShowSubmitConfirm(false);
        if (data && data.attempt) {
          setJustFinishedAttempt(data.attempt);
          setHighlightedAttemptId(data.attempt.id);
        }
        fetchData();
      }
    } catch (e) {
      console.error(e);
      triggerToast("Submission connection error.");
    }
  };

  const handleAutoSubmitQuiz = () => {
    triggerToast("Time is up! Autocompleting assessment and grading responses.");
    submitQuizAttempt(true);
  };

  const handleDoneAndExit = () => {
    setJustFinishedAttempt(null);
    if (highlightedAttemptId) {
      setActiveTab('dashboard');
      setTimeout(() => {
        const element = document.getElementById(`attempt-card-${highlightedAttemptId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    }
  };

  const closeReviewModalAndReturn = () => {
    setSelectedAttemptForReview(null);
    if (highlightedAttemptId) {
      setActiveTab('dashboard');
      setTimeout(() => {
        const element = document.getElementById(`attempt-card-${highlightedAttemptId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    }
  };

  // AI Quiz Generator call
  const generateAIQuizQuestions = async () => {
    if (!aiTopic) {
      triggerToast("Please provide a topic descriptor first.");
      return;
    }
    setIsAiGenerating(true);
    triggerToast("Contacting Gemini cognitive engine to draft high-fidelity questions...");
    try {
      const res = await fetch('/api/quizzes/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          subject: newQuizSubject || 'Computer Science',
          difficulty: aiDifficulty,
          numQuestions: Number(aiNumQ)
        })
      });
      if (res.ok) {
        const data = await res.json();
        setNewQuizQuestions(data.questions);
        triggerToast(`Gemini successfully generated ${data.questions.length} questions! Review below.`);
      }
    } catch (e) {
      console.error(e);
      triggerToast("Failed AI Generation. Please check your token limits.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Save manually created/edited quiz
  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuizTitle || !newQuizSubject) {
      triggerToast("Please fill all required quiz configurations.");
      return;
    }
    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newQuizTitle,
          courseId: 'crs-1',
          subject: newQuizSubject,
          duration: newQuizDuration,
          negativeMarking: newQuizNegative,
          passPercentage: newQuizPass,
          maxAttempts: 1,
          questions: newQuizQuestions
        })
      });
      if (res.ok) {
        triggerToast("Quiz scheduled & successfully distributed to learners.");
        setShowCreateQuiz(false);
        // Reset state
        setNewQuizTitle('');
        setNewQuizSubject('');
        setNewQuizQuestions([{ type: 'mcq', text: '', options: ['', '', '', ''], correctAnswer: '0', points: 5, difficulty: 'medium' }]);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit an Assignment File and Auto Grade via AI
  const handleAssignmentSubmit = async (assignmentId: string, textContent: string) => {
    if (!textContent.trim()) {
      triggerToast("Please paste your response code/text to evaluate.");
      return;
    }
    triggerToast("Analyzing response structures & evaluating with Gemini AI assistant...");
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser?.id || 'usr-student-1' },
        body: JSON.stringify({
          studentId: currentUser?.id,
          fileName: 'AVL_Tree_Solution_Tiwary.txt',
          textContent: textContent
        })
      });
      if (res.ok) {
        triggerToast("Assignment submitted! Instant AI assisted feedback & grading complete.");
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save new Assignment
  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsgTitle || !newAsgDeadline) {
      triggerToast("Required fields missing.");
      return;
    }
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newAsgTitle,
          description: newAsgDesc,
          courseId: 'crs-1',
          subject: newAsgSubject || 'General',
          deadline: newAsgDeadline,
          points: newAsgPoints,
          allowLate: newAsgAllowLate
        })
      });
      if (res.ok) {
        triggerToast("New assignment rubric published.");
        setShowCreateAssignment(false);
        setNewAsgTitle('');
        setNewAsgDesc('');
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save new Course
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCourseName,
          code: newCourseCode,
          semester: newCourseSemester,
          batch: newCourseBatch,
          session: '2025-2026',
          subjects: newCourseSubjects.split(',').map(s => s.trim())
        })
      });
      if (res.ok) {
        triggerToast("New course structure successfully provisioned.");
        setShowCreateCourse(false);
        setNewCourseName('');
        setNewCourseCode('');
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save new User
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          role: newUserRole
        })
      });
      if (res.ok) {
        triggerToast("User account registered.");
        setShowCreateUser(false);
        setNewUserName('');
        setNewUserEmail('');
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Suspend User
  const toggleUserSuspend = async (userId: string, isSuspended: boolean) => {
    try {
      const res = await fetch(`/api/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspend: !isSuspended })
      });
      if (res.ok) {
        triggerToast(isSuspended ? "User restored successfully." : "User account suspended.");
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Interactive Message sending
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatUser) return;

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'usr-student-1'
        },
        body: JSON.stringify({
          receiverId: activeChatUser.id,
          content: chatInput
        })
      });
      if (res.ok) {
        setChatInput('');
        fetchData();

        // Simulate interactive AI typing reply from active context user
        setTypingSim(true);
        setTimeout(() => {
          setTypingSim(false);
          dbReplySimulator();
        }, 1500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Message Replies simulator
  const dbReplySimulator = async () => {
    if (!activeChatUser) return;
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activeChatUser.id
        },
        body: JSON.stringify({
          receiverId: currentUser?.id || 'usr-student-1',
          content: `Hi, thank you for checking in. I have acknowledged your comment and will update our records accordingly.`
        })
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Custom grade & feedback submission
  const handleSaveGradeFeedback = async () => {
    if (!selectedSubmission) return;
    try {
      const res = await fetch(`/api/submissions/${selectedSubmission.id}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: manualGrade,
          feedback: manualFeedback
        })
      });
      if (res.ok) {
        triggerToast("Evaluation metrics finalized and pushed to student.");
        setSelectedSubmission(null);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Helper helper formatting
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div id="eduassess-app-root" className="flex h-screen w-full overflow-hidden bg-[#F8FAFC] font-sans text-slate-800 antialiased">
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform flex-col border-r border-slate-200 bg-white p-6 transition-transform duration-300 md:static md:translate-x-0 flex ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 block leading-tight">EduAssess AI</span>
              <span className="text-[10px] text-slate-400 font-mono">v1.2 Enterprise</span>
            </div>
          </div>
        </div>

        {/* User Context Switcher for sandbox presentation */}
        <div className="mb-6 rounded-xl border border-slate-100 bg-slate-50 p-3">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Simulate Role View</label>
          <div className="grid grid-cols-3 gap-1">
            {(['student', 'teacher', 'admin'] as const).map((r) => (
              <button
                key={r}
                onClick={() => switchRole(r)}
                className={`rounded px-1.5 py-1 text-xs font-semibold capitalize transition-all ${
                  currentRole === r 
                    ? 'bg-indigo-600 text-white shadow-xs' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex flex-col gap-1.5 flex-1">
          <button
            onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
            className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Activity className="h-4.5 w-4.5" />
            Dashboard
          </button>

          <button
            onClick={() => { setActiveTab('assessments'); setMobileMenuOpen(false); }}
            className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === 'assessments' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Award className="h-4.5 w-4.5" />
            Quizzes & Live Tests
          </button>

          <button
            onClick={() => { setActiveTab('assignments'); setMobileMenuOpen(false); }}
            className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === 'assignments' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <FileText className="h-4.5 w-4.5" />
            Assignments
          </button>

          {currentRole === 'student' && (
            <button
              onClick={() => { setActiveTab('ai-insights'); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                activeTab === 'ai-insights' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="h-4.5 w-4.5" />
              AI Study Plan
            </button>
          )}

          <button
            onClick={() => { setActiveTab('messages'); setMobileMenuOpen(false); }}
            className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === 'messages' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <MessageSquare className="h-4.5 w-4.5" />
            Messages
            {messages.filter(m => !m.isRead && m.receiverId === currentUser?.id).length > 0 && (
              <span className="ml-auto flex h-2 w-2 rounded-full bg-rose-500" />
            )}
          </button>

          {currentRole === 'admin' && (
            <>
              <button
                onClick={() => { setActiveTab('users'); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                  activeTab === 'users' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Users className="h-4.5 w-4.5" />
                User Directory
              </button>

              <button
                onClick={() => { setActiveTab('audit-logs'); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                  activeTab === 'audit-logs' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <History className="h-4.5 w-4.5" />
                Audit Logs
              </button>
            </>
          )}

          <button
            onClick={() => { setActiveTab('courses'); setMobileMenuOpen(false); }}
            className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === 'courses' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="h-4.5 w-4.5" />
            Courses
          </button>
        </nav>

        {/* Dynamic Learner Gamification Card (Only for Student) */}
        {currentRole === 'student' && currentUser?.academicDetails && (
          <div className="mt-auto rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-85">XP Level Progress</span>
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-bold">Lvl {currentUser.academicDetails.level}</span>
            </div>
            <div className="text-2xl font-bold tracking-tight">{currentUser.academicDetails.xp} XP</div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-white/20">
              <div 
                className="h-1.5 rounded-full bg-emerald-400 transition-all duration-500" 
                style={{ width: `${(currentUser.academicDetails.xp % 200) / 2}%` }}
              />
            </div>
            <p className="mt-2 text-[10px] opacity-75">🔥 {currentUser.academicDetails.streak} Day streak active!</p>
          </div>
        )}

        {currentRole === 'teacher' && (
          <div className="mt-auto rounded-xl bg-slate-900 p-4 text-white">
            <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider">AI Evaluation Helper</span>
            <p className="mt-1.5 text-xs text-slate-300">Automated submission grading assist is ready with plagiarism scan.</p>
          </div>
        )}
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 md:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-slate-500 hover:text-slate-800">
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-slate-800 capitalize flex items-center gap-2">
                {currentRole} Console
              </h2>
              <span className="hidden md:inline-flex rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700 tracking-wider">
                ● Live Environment
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <div className="relative hidden sm:block">
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 lg:w-64 rounded-full bg-slate-100 py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <Search className="absolute left-3.5 top-2 h-3.5 w-3.5 text-slate-400" />
            </div>

            {/* Notification Badge */}
            <div className="relative">
              <button 
                onClick={() => setNotificationOpen(!notificationOpen)} 
                className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <Bell className="h-4.5 w-4.5" />
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                )}
              </button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {notificationOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50 max-h-96 overflow-y-auto"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                      <span className="text-xs font-bold text-slate-700">Recent Alerts</span>
                      <button 
                        onClick={async () => {
                          await fetch('/api/notifications/read', { method: 'POST' });
                          fetchData();
                        }}
                        className="text-[10px] text-indigo-600 hover:underline font-bold"
                      >
                        Mark all read
                      </button>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No alerts recorded.</p>
                    ) : (
                      <div className="space-y-2">
                        {notifications.map((n) => (
                          <div key={n.id} className={`p-2.5 rounded-xl border ${n.isRead ? 'bg-white border-slate-100' : 'bg-slate-50/80 border-indigo-100'}`}>
                            <p className="text-xs font-bold text-slate-800">{n.title}</p>
                            <p className="text-[11px] text-slate-500 mt-1">{n.message}</p>
                            <span className="text-[9px] text-slate-400 mt-1 block font-mono">{new Date(n.createdAt).toLocaleTimeString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile context summary */}
            {currentUser && (
              <div className="flex items-center gap-3">
                <div className="text-right hidden xs:block">
                  <p className="text-xs font-bold text-slate-800 leading-none">{currentUser.name}</p>
                  <p className="text-[10px] text-indigo-600 font-semibold uppercase mt-0.5 tracking-wide">{currentUser.email}</p>
                </div>
                <img 
                  src={currentUser.avatar || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80"} 
                  alt="avatar" 
                  className="h-9 w-9 rounded-full border border-slate-200"
                />
              </div>
            )}
          </div>
        </header>

        {/* Global Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-xl max-w-sm">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Dynamic Workspace Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          
          {/* SECURE ASSESSMENT ENVIRONMENT OVERLAY */}
          {activeQuiz && (
            <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex flex-col overflow-hidden text-white">
              {/* Header */}
              <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-indigo-600 p-2">
                    <ShieldAlert className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{activeQuiz.title}</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">{activeQuiz.subject} • Secure Examination</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Circular Progress Gauge */}
                  {(() => {
                    const answeredCount = activeQuiz.questions.filter(q => quizAnswers[q.id]).length;
                    const totalCount = activeQuiz.questions.length;
                    const percentage = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;
                    const radius = 12;
                    const strokeWidth = 2.5;
                    const circumference = 2 * Math.PI * radius;
                    const strokeDashoffset = circumference - (percentage / 100) * circumference;

                    return (
                      <div className="flex items-center gap-2 bg-slate-800/40 border border-slate-700/30 px-3 py-1 rounded-full">
                        <div className="relative flex items-center justify-center h-7 w-7">
                          <svg className="w-7 h-7 transform -rotate-90">
                            <circle
                              cx="14"
                              cy="14"
                              r={radius}
                              className="text-slate-800"
                              strokeWidth={strokeWidth}
                              stroke="currentColor"
                              fill="transparent"
                            />
                            <circle
                              cx="14"
                              cy="14"
                              r={radius}
                              className="text-indigo-400 transition-all duration-300 ease-out"
                              strokeWidth={strokeWidth}
                              strokeDasharray={circumference}
                              strokeDashoffset={strokeDashoffset}
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="transparent"
                            />
                          </svg>
                          <span className="absolute text-[8px] font-black font-mono text-white">
                            {percentage}%
                          </span>
                        </div>
                        <div className="text-left leading-none">
                          <p className="text-[9px] font-bold text-slate-300">Attempted</p>
                          <p className="text-[9px] text-indigo-400 font-bold font-mono mt-0.5">{answeredCount}/{totalCount}</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Progress Auto-save status */}
                  <div>
                    {isAutoSaving ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 animate-pulse">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Auto-saving...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-800/40 border border-slate-700/30 text-slate-400">
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        Saved
                      </span>
                    )}
                  </div>

                  {/* Anti-Cheat indicators */}
                  <div className="flex items-center gap-2 bg-rose-950/50 border border-rose-800/40 px-3 py-1.5 rounded-full text-xs text-rose-200">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                    <span>Tab switch count: <strong className="text-white font-mono">{tabSwitchCount}</strong></span>
                  </div>

                  {/* Countdown Timer */}
                  <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-mono text-sm transition-all duration-300 ${
                    quizTimer < 300 
                      ? 'bg-rose-950/60 border border-rose-500 text-rose-400 animate-pulse font-bold' 
                      : 'bg-slate-800 border border-slate-700 text-slate-200'
                  }`}>
                    <Clock className={`h-4 w-4 ${quizTimer < 300 ? 'text-rose-400 animate-bounce' : 'text-emerald-400 animate-pulse'}`} />
                    <span>Time Remaining: <strong className={quizTimer < 300 ? 'text-rose-400 font-extrabold' : 'text-white'}>{formatTime(quizTimer)}</strong></span>
                  </div>

                  {/* Jump to next flagged button */}
                  {!isReviewingQuiz && (
                    <button
                      onClick={handleJumpToNextFlagged}
                      className={`rounded-full px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeQuiz.questions.some(q => flaggedQuestions[q.id])
                          ? 'bg-amber-600/25 hover:bg-amber-600/35 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-500 border border-slate-700/50 hover:text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <Flag className={`h-3.5 w-3.5 ${activeQuiz.questions.some(q => flaggedQuestions[q.id]) ? 'text-amber-400 fill-amber-400/20 animate-pulse' : 'text-slate-500'}`} />
                      <span>Jump to Next Flagged</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                        activeQuiz.questions.some(q => flaggedQuestions[q.id])
                          ? 'bg-amber-500/25 text-amber-200 font-bold'
                          : 'bg-slate-700 text-slate-500'
                      }`}>
                        {activeQuiz.questions.filter(q => flaggedQuestions[q.id]).length}
                      </span>
                    </button>
                  )}

                  {!isReviewingQuiz && !isFocusMode && (
                    <button
                      onClick={() => setShowQuestionPalette(true)}
                      className="rounded-full px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-500/30 hover:text-white cursor-pointer"
                    >
                      <Grid className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Question Palette</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/25 text-indigo-200 font-bold">
                        {activeQuiz.questions.length}
                      </span>
                    </button>
                  )}

                  {!isReviewingQuiz && (
                    <button
                      onClick={() => {
                        const newFocus = !isFocusMode;
                        setIsFocusMode(newFocus);
                        triggerToast(newFocus ? "Focus Mode activated! Enjoy your distraction-free assessment." : "Focus Mode deactivated.");
                      }}
                      className={`rounded-full px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        isFocusMode 
                          ? 'bg-rose-950/65 border-rose-500 text-rose-300 hover:bg-rose-900/60 hover:text-white' 
                          : 'bg-indigo-950/30 border-slate-700/65 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {isFocusMode ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5 text-rose-400" />
                          <span>Focus Mode Active</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="h-3.5 w-3.5 text-slate-400" />
                          <span>Focus Mode</span>
                        </>
                      )}
                    </button>
                  )}

                  <button 
                    onClick={() => {
                      setShowSubmitConfirm(true);
                    }}
                    className={`rounded-full px-5 py-2 text-xs font-bold text-white transition-all shadow-sm flex items-center gap-1.5 ${
                      isReviewingQuiz 
                        ? 'bg-emerald-600 hover:bg-emerald-500' 
                        : 'bg-indigo-600 hover:bg-indigo-500'
                    }`}
                  >
                    {isReviewingQuiz ? (
                      <>
                        <Send className="h-3.5 w-3.5" /> Confirm Submission
                      </>
                    ) : (
                      'Finish'
                    )}
                  </button>
                </div>
              </header>

              {/* Proctor Notice */}
              {showProctorAlert && (
                <div className="bg-rose-600 text-white py-2 px-6 text-xs font-semibold text-center flex items-center justify-center gap-2 animate-bounce">
                  <AlertTriangle className="h-4.5 w-4.5" />
                  <span>WARNING: Tab change detected! This activity is flagged as an attempt violation in the system audit logs.</span>
                </div>
              )}

              {/* Main test workspace */}
              <div className="flex-1 flex overflow-hidden">
                {isReviewingQuiz ? (
                  /* Review Answers View */
                  <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                      <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <Eye className="h-5 w-5 text-indigo-400" /> Review Your Answers
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">Please inspect your responses carefully before finalizing. Tab switches, full-screen violations, and answer states are audited in real time.</p>
                      </div>
                      <button
                        onClick={() => setIsReviewingQuiz(false)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" /> Back to Questions
                      </button>
                    </div>

                    {/* Stats summary banner */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Answered</span>
                          <p className="text-lg font-bold text-white font-mono">
                            {activeQuiz.questions.filter(q => quizAnswers[q.id]).length} / {activeQuiz.questions.length}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-amber-400" />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Flagged</span>
                          <p className="text-lg font-bold text-white font-mono">
                            {activeQuiz.questions.filter(q => flaggedQuestions[q.id]).length} Questions
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center gap-3">
                        <div className="p-2 bg-rose-500/10 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-rose-400" />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Unanswered</span>
                          <p className="text-lg font-bold text-white font-mono">
                            {activeQuiz.questions.filter(q => !quizAnswers[q.id]).length} Questions
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Filter Toggle Controls */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Filter Review Questions</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setReviewFilter('all')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                              reviewFilter === 'all'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            All ({activeQuiz.questions.length})
                          </button>
                          <button
                            onClick={() => setReviewFilter('unanswered')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                              reviewFilter === 'unanswered'
                                ? 'bg-rose-600 text-white shadow-sm'
                                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            Unanswered ({activeQuiz.questions.filter(q => !quizAnswers[q.id]).length})
                          </button>
                          <button
                            onClick={() => setReviewFilter('flagged')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                              reviewFilter === 'flagged'
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            Flagged ({activeQuiz.questions.filter(q => flaggedQuestions[q.id]).length})
                          </button>
                        </div>
                      </div>

                      {/* Collapse / Expand batch controls */}
                      <div className="flex items-center gap-2 border-t md:border-t-0 border-slate-800/65 pt-2 md:pt-0">
                        <button
                          onClick={() => {
                            const newCollapsed: Record<string, boolean> = {};
                            activeQuiz.questions.forEach(q => {
                              newCollapsed[q.id] = true;
                            });
                            setCollapsedReviewQuestions(newCollapsed);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                        >
                          Collapse All
                        </button>
                        <button
                          onClick={() => {
                            setCollapsedReviewQuestions({});
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                        >
                          Expand All
                        </button>
                      </div>
                    </div>

                    {/* Detailed questions overview */}
                    <div className="space-y-4 pt-2">
                      {(() => {
                        const filteredQuestions = activeQuiz.questions.map((q, idx) => ({ q, idx })).filter(({ q }) => {
                          const answer = quizAnswers[q.id];
                          const isAnswered = !!answer;
                          const isFlagged = flaggedQuestions[q.id];
                          if (reviewFilter === 'unanswered') return !isAnswered;
                          if (reviewFilter === 'flagged') return isFlagged;
                          return true;
                        });

                        if (filteredQuestions.length === 0) {
                          return (
                            <div className="p-8 rounded-xl border border-dashed border-slate-800 bg-slate-900/20 text-center space-y-3">
                              <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto animate-bounce" />
                              <p className="text-sm font-medium text-slate-300">
                                {reviewFilter === 'unanswered' 
                                  ? "All caught up! No unanswered questions remaining." 
                                  : "No flagged questions to display."}
                              </p>
                              <button
                                onClick={() => setReviewFilter('all')}
                                className="px-4 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
                              >
                                Show All Questions
                              </button>
                            </div>
                          );
                        }

                        return filteredQuestions.map(({ q, idx }) => {
                          const answer = quizAnswers[q.id];
                          const isAnswered = !!answer;
                          const isFlagged = flaggedQuestions[q.id];
                          const isCollapsed = collapsedReviewQuestions[q.id] === true;

                          return (
                            <div key={q.id} className={`p-5 rounded-xl border transition-all ${
                              isFlagged 
                                ? 'bg-amber-950/20 border-amber-850/40' 
                                : isAnswered 
                                  ? 'bg-slate-900/60 border-slate-800' 
                                  : 'bg-rose-950/20 border-rose-900/40 animate-pulse shadow-sm shadow-rose-950/50'
                            }`}>
                              <div 
                                onClick={() => setCollapsedReviewQuestions(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                                className={`flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/20 rounded p-1.5 transition-colors select-none ${
                                  !isCollapsed ? 'border-b border-slate-800/50 pb-2.5 mb-3' : ''
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isCollapsed ? (
                                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-indigo-400 shrink-0" />
                                  )}
                                  <span className="text-xs font-bold text-indigo-400 font-mono">Question {idx + 1}</span>
                                  {isCollapsed && (
                                    <span className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-md hidden sm:inline ml-2 font-normal">
                                      — {q.text.length > 55 ? `${q.text.slice(0, 55)}...` : q.text}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  {isFlagged && (
                                    <span className="bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">
                                      FLAGGED
                                    </span>
                                  )}
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isAnswered 
                                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                                      : 'bg-rose-950 text-rose-400 border border-rose-900'
                                  }`}>
                                    {isAnswered ? 'ANSWERED' : 'UNANSWERED'}
                                  </span>
                                </div>
                              </div>

                              {!isCollapsed && (
                                <>
                                  <p className="text-sm font-medium text-slate-100 mb-3">{q.text}</p>

                                  {/* Render state of answer */}
                                  <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-900 text-xs text-slate-300">
                                    {q.type === 'mcq' && q.options && (
                                      <div>
                                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest block mb-1.5">Your Choice:</span>
                                        {isAnswered ? (
                                          <div className="flex items-center gap-2 font-medium text-white">
                                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                                            <span>{q.options[Number(answer)] || `Option ${answer}`}</span>
                                          </div>
                                        ) : (
                                          <span className="text-rose-400 italic">No option selected yet.</span>
                                        )}
                                      </div>
                                    )}

                                    {q.type === 'coding' && (
                                      <div>
                                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest block mb-1.5">Submitted Sandbox Code:</span>
                                        {isAnswered ? (
                                          <pre className="font-mono text-[11px] bg-slate-900 p-2.5 rounded border border-slate-800 overflow-x-auto text-slate-300 max-h-40 whitespace-pre">
                                            {answer}
                                          </pre>
                                        ) : (
                                          <span className="text-rose-400 italic">No code submitted for this sandbox question.</span>
                                        )}
                                      </div>
                                    )}

                                    {q.type === 'subjective' && (
                                      <div>
                                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest block mb-1.5">Submitted Explanation:</span>
                                        {isAnswered ? (
                                          <p className="text-slate-200 italic leading-relaxed whitespace-pre-wrap">
                                            "{answer}"
                                          </p>
                                        ) : (
                                          <span className="text-rose-400 italic">No explanation drafted for this academic question.</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* Completion Statistics Banner */}
                    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 mt-8">
                      <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
                        <Activity className="h-5 w-5 text-indigo-400" />
                        <h4 className="font-bold text-white text-xs uppercase tracking-wider font-mono">Completion Statistics</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Answered Questions */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-widest block">Answered Questions</span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-emerald-400 font-mono">
                              {activeQuiz.questions.filter(q => quizAnswers[q.id]).length}
                            </span>
                            <span className="text-xs text-slate-500">of {activeQuiz.questions.length} total</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                              style={{ 
                                width: `${activeQuiz.questions.length > 0 
                                  ? Math.round((activeQuiz.questions.filter(q => quizAnswers[q.id]).length / activeQuiz.questions.length) * 100) 
                                  : 0}%` 
                              }}
                            />
                          </div>
                        </div>

                        {/* Unanswered Questions */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-widest block">Unanswered Remaining</span>
                          <div className="flex items-baseline gap-2">
                            <span className={`text-2xl font-bold font-mono ${activeQuiz.questions.filter(q => !quizAnswers[q.id]).length > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                              {activeQuiz.questions.filter(q => !quizAnswers[q.id]).length}
                            </span>
                            <span className="text-xs text-slate-500">remaining</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-rose-500 h-1.5 rounded-full transition-all duration-500" 
                              style={{ 
                                width: `${activeQuiz.questions.length > 0 
                                  ? Math.round((activeQuiz.questions.filter(q => !quizAnswers[q.id]).length / activeQuiz.questions.length) * 100) 
                                  : 0}%` 
                              }}
                            />
                          </div>
                        </div>

                        {/* Time Elapsed */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-widest block">Time Elapsed</span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-indigo-400 font-mono">
                              {formatTime(Math.max(0, (activeQuiz.duration * 60) - quizTimer))}
                            </span>
                            <span className="text-xs text-slate-500">/ {activeQuiz.duration} mins limit</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" 
                              style={{ 
                                width: `${activeQuiz.duration > 0 
                                  ? Math.min(100, Math.round((Math.max(0, (activeQuiz.duration * 60) - quizTimer) / (activeQuiz.duration * 60)) * 100)) 
                                  : 0}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Submit Confirmation Bar */}
                    <div className="p-6 rounded-2xl bg-indigo-950/40 border border-indigo-900/50 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
                      <div>
                        <h4 className="font-bold text-white text-base">Ready to submit?</h4>
                        <p className="text-xs text-slate-300 mt-1">This will finalize your attempt and calculate your grade instantly. You cannot undo this action.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setIsReviewingQuiz(false)}
                          className="px-5 py-2.5 rounded-full bg-slate-850 hover:bg-slate-800 text-xs font-bold text-white transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => setShowSubmitConfirm(true)}
                          className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all shadow-md flex items-center gap-2 cursor-pointer"
                        >
                          <Send className="h-4 w-4" /> Confirm Submission
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Questions Navigation Sidebar */}
                    {!isFocusMode && (
                      <aside className="w-64 border-r border-slate-800 p-6 overflow-y-auto hidden md:block bg-slate-950/30">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Question Progress</h4>
                        <div className="grid grid-cols-4 gap-2">
                          {activeQuiz.questions.map((q, idx) => (
                            <button
                              key={q.id}
                              onClick={() => jumpToQuestion(q.id, idx)}
                              className={`h-10 rounded-lg flex items-center justify-center font-bold text-xs transition-colors cursor-pointer hover:scale-105 ${
                                flaggedQuestions[q.id]
                                  ? 'bg-amber-600 text-white'
                                  : quizAnswers[q.id]
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              {idx + 1}
                            </button>
                          ))}
                        </div>

                        <div className="mt-8 border-t border-slate-800 pt-6 space-y-4">
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="h-3 w-3 rounded bg-indigo-600 block" /> Answered
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="h-3 w-3 rounded bg-amber-600 block" /> Flagged for review
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="h-3 w-3 rounded bg-slate-800 block" /> Unanswered
                          </div>
                        </div>
                      </aside>
                    )}

                    {/* Exam questions details */}
                    <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto space-y-8">
                      {activeQuiz.questions.map((q, idx) => (
                        <div key={q.id} id={`question-card-${q.id}`} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
                          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">Question {idx + 1} of {activeQuiz.questions.length}</span>
                            <div className="flex gap-2">
                              <span className="rounded bg-slate-800 text-slate-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">{q.difficulty}</span>
                              <span className="rounded bg-slate-800 text-emerald-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">+{q.points} pts</span>
                              <button
                                onClick={() => setFlaggedQuestions(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                                className={`rounded px-2.5 py-0.5 text-[10px] font-bold uppercase transition-colors ${
                                  flaggedQuestions[q.id] ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                Flag Question
                              </button>
                              <button
                                onClick={() => {
                                  setQuizAnswers(prev => {
                                    const updated = { ...prev };
                                    delete updated[q.id];
                                    return updated;
                                  });
                                }}
                                disabled={!quizAnswers[q.id]}
                                className={`rounded px-2.5 py-0.5 text-[10px] font-bold uppercase transition-colors flex items-center gap-1 border ${
                                  quizAnswers[q.id]
                                    ? 'bg-rose-950/40 border-rose-900/40 hover:bg-rose-900/40 text-rose-300 hover:text-white cursor-pointer'
                                    : 'bg-slate-800/40 text-slate-500 border-slate-800/20 cursor-not-allowed'
                                }`}
                                title="Reset answer for this question"
                              >
                                <RefreshCw className="h-2.5 w-2.5" />
                                Reset
                              </button>
                            </div>
                          </div>

                          <p className="text-base font-medium">{q.text}</p>

                          {/* Render Question Answer Area depending on Type */}
                          {q.type === 'mcq' && q.options && (
                            <div className="grid grid-cols-1 gap-2.5 pt-2">
                              {q.options.map((opt, oIdx) => (
                                <button
                                  key={oIdx}
                                  onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: String(oIdx) }))}
                                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left text-sm transition-all ${
                                    quizAnswers[q.id] === String(oIdx)
                                      ? 'bg-indigo-600/25 border-indigo-500 text-white'
                                      : 'bg-slate-950/20 border-slate-800 text-slate-300 hover:bg-slate-800/30'
                                  }`}
                                >
                                  <span>{opt}</span>
                                  {quizAnswers[q.id] === String(oIdx) && <CheckCircle className="h-4.5 w-4.5 text-indigo-400" />}
                                </button>
                              ))}
                            </div>
                          )}

                          {q.type === 'coding' && (
                            <div className="space-y-3 pt-2">
                              <span className="text-xs text-slate-400 font-mono flex items-center gap-1"><Code className="h-3 w-3" /> TypeScript Code Sandbox Editor</span>
                              <textarea
                                value={quizAnswers[q.id] || q.codingTemplate || ''}
                                onChange={(e) => setQuizAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                className="w-full h-48 rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-300 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Write your code solution here..."
                              />
                            </div>
                          )}

                          {q.type === 'subjective' && (
                            <div className="space-y-2 pt-2">
                              <textarea
                                value={quizAnswers[q.id] || ''}
                                onChange={(e) => setQuizAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                className="w-full h-28 rounded-xl bg-slate-950 p-4 text-sm text-slate-300 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Type your explanation answer in full academic detail..."
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Custom Submission Confirmation Dialog */}
              <AnimatePresence>
                {showSubmitConfirm && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowSubmitConfirm(false)}
                      className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                    />
                    
                    {/* Content Card */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-white space-y-6 overflow-hidden"
                    >
                      {/* Close button */}
                      <button 
                        onClick={() => setShowSubmitConfirm(false)}
                        className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer animate-none"
                      >
                        <X className="h-4 w-4" />
                      </button>

                      {/* Header */}
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${activeQuiz.questions.filter(q => !quizAnswers[q.id]).length > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {activeQuiz.questions.filter(q => !quizAnswers[q.id]).length > 0 ? (
                            <AlertTriangle className="h-6 w-6" />
                          ) : (
                            <CheckCircle className="h-6 w-6" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white">
                            {activeQuiz.questions.filter(q => !quizAnswers[q.id]).length > 0 ? 'Review Unanswered Questions' : 'Confirm Submission'}
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">
                            {activeQuiz.questions.filter(q => !quizAnswers[q.id]).length > 0 
                              ? 'You have unattempted questions in your assessment. Please review before finalizing.' 
                              : 'Excellent job! All questions have been attempted. You are ready to submit.'}
                          </p>
                        </div>
                      </div>

                      {/* Stats Section */}
                      <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/50 border border-slate-800/60 text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block mb-1">Attempted</span>
                          <span className="text-xl font-bold font-mono text-emerald-400">
                            {activeQuiz.questions.filter(q => quizAnswers[q.id]).length}
                          </span>
                          <span className="text-xs text-slate-500"> / {activeQuiz.questions.length}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block mb-1">Unattempted</span>
                          <span className={`text-xl font-bold font-mono ${activeQuiz.questions.filter(q => !quizAnswers[q.id]).length > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                            {activeQuiz.questions.filter(q => !quizAnswers[q.id]).length}
                          </span>
                          <span className="text-xs text-slate-500"> remaining</span>
                        </div>
                      </div>

                      {/* Unattempted questions lists */}
                      {activeQuiz.questions.filter(q => !quizAnswers[q.id]).length > 0 ? (
                        <div className="space-y-2.5">
                          <span className="text-[10px] text-amber-400 font-mono font-bold uppercase tracking-wider block">Unattempted Questions List:</span>
                          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                            {activeQuiz.questions.map((q, idx) => {
                              if (!quizAnswers[q.id]) {
                                return (
                                  <button
                                    key={q.id}
                                    onClick={() => {
                                      setShowSubmitConfirm(false);
                                      setIsReviewingQuiz(false);
                                    }}
                                    className="px-2.5 py-1 rounded bg-rose-950/40 border border-rose-800/40 hover:border-rose-700 text-rose-300 hover:text-white font-mono text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                  >
                                    <HelpCircle className="h-3.5 w-3.5" />
                                    <span>Question {idx + 1}</span>
                                  </button>
                                );
                              }
                              return null;
                            })}
                          </div>
                          <p className="text-[10px] text-slate-500 italic">Click any unattempted question button above to close this dialog and focus on it.</p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-emerald-400 bg-emerald-950/20 border border-emerald-900/40 px-3.5 py-2.5 rounded-xl text-xs font-medium">
                          <Check className="h-4.5 w-4.5 shrink-0" />
                          <span>Perfect! Every single question has a drafted answer. Ready for immediate grading.</span>
                        </div>
                      )}

                      {/* Warning/Proctor reminder */}
                      <div className="text-[10px] text-slate-400 bg-slate-950/30 p-3 rounded-lg border border-slate-800/40 leading-relaxed flex items-start gap-2">
                        <ShieldAlert className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                        <span>Upon submission, your responses will be locked and compiled immediately. If Secure Proctor Mode flags any tab switching (current count: <strong>{tabSwitchCount}</strong>), they will be submitted as part of your persistent assessment profile.</span>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          onClick={() => setShowSubmitConfirm(false)}
                          className="px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer"
                        >
                          Go Back & Review
                        </button>
                        <button
                          onClick={() => submitQuizAttempt()}
                          className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md hover:shadow-emerald-900/20 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send className="h-3.5 w-3.5" /> Yes, Submit Attempt
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Question Palette Modal overlay */}
              <AnimatePresence>
                {showQuestionPalette && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowQuestionPalette(false)}
                      className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                    />
                    
                    {/* Content Card */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-white space-y-6 overflow-hidden flex flex-col max-h-[90vh]"
                    >
                      {/* Close button */}
                      <button 
                        onClick={() => setShowQuestionPalette(false)}
                        className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>

                      {/* Header */}
                      <div className="flex items-start gap-3">
                        <div className="p-3 rounded-xl bg-indigo-600/10 text-indigo-400">
                          <Grid className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">Question Palette</h3>
                          <p className="text-xs text-slate-400 mt-1">
                            Click any cell in the grid below to expand and jump directly to that specific question in your active assessment.
                          </p>
                        </div>
                      </div>

                      {/* Summary Status Badges */}
                      <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/60">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="h-3 w-3 rounded-full bg-indigo-600 block shrink-0" />
                          <span className="text-slate-400 font-medium">
                            Answered: <strong className="text-white font-mono">{activeQuiz.questions.filter(q => quizAnswers[q.id]).length}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="h-3 w-3 rounded-full bg-amber-600 block shrink-0" />
                          <span className="text-slate-400 font-medium">
                            Flagged: <strong className="text-white font-mono">{activeQuiz.questions.filter(q => flaggedQuestions[q.id]).length}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="h-3 w-3 rounded-full bg-rose-600 block shrink-0" />
                          <span className="text-slate-400 font-medium">
                            Unanswered: <strong className="text-white font-mono">{activeQuiz.questions.filter(q => !quizAnswers[q.id]).length}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Summary Grid of all questions */}
                      <div className="flex-1 overflow-y-auto pr-1">
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                          {activeQuiz.questions.map((q, idx) => {
                            const isAnswered = !!quizAnswers[q.id];
                            const isFlagged = !!flaggedQuestions[q.id];
                            
                            return (
                              <button
                                key={q.id}
                                onClick={() => {
                                  jumpToQuestion(q.id, idx);
                                  setShowQuestionPalette(false);
                                }}
                                className={`group relative h-14 rounded-xl flex flex-col items-center justify-center border font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                                  isFlagged
                                    ? 'bg-amber-650/30 border-amber-500/50 text-amber-200 hover:bg-amber-650/45'
                                    : isAnswered
                                      ? 'bg-indigo-650/30 border-indigo-500/50 text-indigo-200 hover:bg-indigo-650/45'
                                      : 'bg-rose-950/15 border-rose-900/30 text-rose-300 hover:bg-rose-950/25'
                                }`}
                              >
                                {/* Mini icon in the top right */}
                                <div className="absolute top-1 right-1">
                                  {isFlagged ? (
                                    <Flag className="h-2 w-2 text-amber-400 fill-amber-400" />
                                  ) : isAnswered ? (
                                    <Check className="h-2 w-2 text-indigo-400" />
                                  ) : null}
                                </div>
                                <span className="text-sm font-black font-mono leading-none">{idx + 1}</span>
                                <span className="text-[8px] font-medium tracking-wide uppercase text-slate-400 mt-1 block">
                                  {isFlagged ? 'Flag' : isAnswered ? 'Ans' : 'New'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-end border-t border-slate-800 pt-4">
                        <button
                          onClick={() => setShowQuestionPalette(false)}
                          className="px-5 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer"
                        >
                          Close Palette
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}


          {/* TAB 1: DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Dynamic Welcome Stats Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
                    Welcome back, {currentUser?.name || 'Academic User'}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Today is {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Here is the daily summary.
                  </p>
                </div>
              </div>

              {/* STATS TILES */}
              <motion.div 
                key={currentRole}
                variants={statsContainerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
              >
                {currentRole === 'student' ? (
                  <>
                    <motion.div variants={statsTileVariants} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Quiz Score</span>
                      <h4 className="text-2xl font-bold text-slate-950 mt-1 font-display">86.4%</h4>
                      <p className="text-emerald-600 text-[11px] font-bold mt-1 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> +3.2% vs last semester
                      </p>
                    </motion.div>

                    <motion.div variants={statsTileVariants} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed Quizzes</span>
                      <h4 className="text-2xl font-bold text-slate-950 mt-1 font-display">
                        {attempts.filter(a => a.studentId === currentUser?.id).length} Active
                      </h4>
                      <p className="text-slate-400 text-[11px] font-medium mt-1">Across computer science courses</p>
                    </motion.div>

                    <motion.div variants={statsTileVariants} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Evaluations Awaiting</span>
                      <h4 className="text-2xl font-bold text-slate-950 mt-1 font-display">
                        {assignments.length - submissions.filter(s => s.studentId === currentUser?.id).length} Pending
                      </h4>
                      <p className="text-amber-600 text-[11px] font-medium mt-1">Deadline check enabled</p>
                    </motion.div>

                    <motion.div variants={statsTileVariants} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attendance Rate</span>
                      <h4 className="text-2xl font-bold text-slate-950 mt-1 font-display">92.0%</h4>
                      <p className="text-emerald-600 text-[11px] font-medium mt-1">Excellent standing status</p>
                    </motion.div>
                  </>
                ) : currentRole === 'teacher' ? (
                  <>
                    <motion.div variants={statsTileVariants} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Courses</span>
                      <h4 className="text-2xl font-bold text-slate-950 mt-1 font-display">{courses.length} Active</h4>
                      <p className="text-indigo-600 text-[11px] font-medium mt-1">2 Academic cohorts</p>
                    </motion.div>

                    <motion.div variants={statsTileVariants} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Assessments</span>
                      <h4 className="text-2xl font-bold text-slate-950 mt-1 font-display">{quizzes.length} Quizzes</h4>
                      <p className="text-emerald-600 text-[11px] font-medium mt-1">Auto-evaluate active</p>
                    </motion.div>

                    <motion.div variants={statsTileVariants} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Submissions</span>
                      <h4 className="text-2xl font-bold text-slate-950 mt-1 font-display">
                        {submissions.filter(s => s.grade === undefined).length} Evaluations
                      </h4>
                      <p className="text-rose-600 text-[11px] font-bold mt-1">AI assistance enabled</p>
                    </motion.div>

                    <motion.div variants={statsTileVariants} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Course Avg Grade</span>
                      <h4 className="text-2xl font-bold text-slate-950 mt-1 font-display">82.5%</h4>
                      <p className="text-slate-400 text-[11px] font-medium mt-1">Steady class progress</p>
                    </motion.div>
                  </>
                ) : (
                  <>
                    <motion.div variants={statsTileVariants} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Learners</span>
                      <h4 className="text-2xl font-bold text-slate-950 mt-1 font-display">
                        {usersList.filter(u => u.role === 'student').length} Registered
                      </h4>
                      <p className="text-slate-400 text-[11px] font-medium mt-1">Across 2 batch divisions</p>
                    </motion.div>

                    <motion.div variants={statsTileVariants} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Faculty</span>
                      <h4 className="text-2xl font-bold text-slate-950 mt-1 font-display">
                        {usersList.filter(u => u.role === 'teacher').length} Members
                      </h4>
                      <p className="text-emerald-600 text-[11px] font-medium mt-1">Online access active</p>
                    </motion.div>

                    <motion.div variants={statsTileVariants} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Scheduled Quizzes</span>
                      <h4 className="text-2xl font-bold text-slate-950 mt-1 font-display">{quizzes.length} Scheduled</h4>
                      <p className="text-slate-400 text-[11px] mt-1 font-mono text-[9px]">Last check: Just now</p>
                    </motion.div>

                    <motion.div variants={statsTileVariants} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">System Health</span>
                      <h4 className="text-2xl font-bold text-slate-950 mt-1 font-display">99.98%</h4>
                      <p className="text-emerald-600 text-[11px] font-bold mt-1 flex items-center gap-1">
                        ● CPU Stable
                      </p>
                    </motion.div>
                  </>
                )}
              </motion.div>

              {/* BENTO GRID MAIN PANELS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Column 1 & 2: Dynamic Activity Matrices */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Attendance Trend Chart (Teacher and Admin Only) */}
                  {(currentRole === 'teacher' || currentRole === 'admin') && (
                    <AttendanceChart attendance={attendance} courses={courses} />
                  )}

                  {/* Announcements Board */}
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <Bell className="h-4.5 w-4.5 text-indigo-600" />
                        Announcement Board
                      </h4>
                      {currentRole === 'teacher' && (
                        <button 
                          onClick={async () => {
                            const title = prompt("Enter Announcement Title:");
                            const content = prompt("Enter announcement content details:");
                            if (title && content) {
                              await fetch('/api/announcements', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ title, content, courseId: 'crs-1', authorName: currentUser?.name })
                              });
                              fetchData();
                            }
                          }}
                          className="rounded-full border border-indigo-200 px-3 py-1 text-[10px] font-bold text-indigo-700 hover:bg-indigo-50"
                        >
                          Broadcast Info
                        </button>
                      )}
                    </div>

                    {announcements.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No recent circulars.</p>
                    ) : (
                      <div className="space-y-3">
                        {announcements.map((ann) => (
                          <div key={ann.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 relative">
                            <h5 className="text-xs font-bold text-slate-800">{ann.title}</h5>
                            <p className="text-xs text-slate-600 mt-1">{ann.content}</p>
                            <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                              <span>By: <strong>{ann.authorName}</strong></span>
                              <span>•</span>
                              <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dynamic Quiz Performance Statistics / Student Status list */}
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
                    <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="h-4.5 w-4.5 text-indigo-600" />
                      {currentRole === 'student' ? 'My Recent Assessment Scores' : 'Learner Performance Overview'}
                    </h4>

                    {currentRole === 'student' ? (
                      <div className="space-y-3">
                        {attempts.filter(a => a.studentId === currentUser?.id).map((att) => {
                          const quiz = quizzes.find(q => q.id === att.quizId);
                          const percentage = Math.round((att.score / att.totalPoints) * 100);
                          const isFailed = percentage < (quiz?.passPercentage || 50);
                          const quizAttempts = quiz ? attempts.filter(a => a.quizId === quiz.id && a.studentId === currentUser?.id) : [];
                          const remainingAttempts = quiz ? quiz.maxAttempts - attempts.filter(a => a.quizId === quiz.id && a.studentId === currentUser?.id).length : 0;
                          const hasRemainingAttempts = remainingAttempts > 0;
                          const isHighlighted = highlightedAttemptId === att.id;

                          return (
                            <div 
                              key={att.id} 
                              id={`attempt-card-${att.id}`}
                              className={`p-4 border rounded-xl transition-all space-y-3 shadow-xs ${
                                isHighlighted 
                                  ? 'border-indigo-400 bg-indigo-50/40 animate-pulse shadow-md shadow-indigo-100/50' 
                                  : 'border-slate-100 bg-white hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-xs font-bold text-slate-800">{quiz?.title || 'Unknown Quiz'}</p>
                                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Attempted on {new Date(att.completedAt).toLocaleDateString()}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs font-bold font-mono text-indigo-600 block">{att.score} / {att.totalPoints} pts</span>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    percentage >= (quiz?.passPercentage || 50) ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                  }`}>
                                    {percentage}% ({percentage >= (quiz?.passPercentage || 50) ? 'Passed' : 'At Risk'})
                                  </span>
                                </div>
                              </div>

                              {/* Badges and action buttons */}
                              <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100">
                                <div className="flex flex-wrap gap-2">
                                  {/* Remaining Attempts Badge */}
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                    remainingAttempts > 0 
                                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                                      : 'bg-slate-100 text-slate-500 border-slate-200'
                                  }`}>
                                    Remaining Attempts: {remainingAttempts} left
                                  </span>

                                  {/* Timing countdown / Duration Badge */}
                                  {activeQuiz?.id === quiz?.id ? (
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                                      quizTimer < 300 
                                        ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' 
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                      <Clock className={`h-3 w-3 ${quizTimer < 300 ? 'animate-bounce' : 'animate-spin'}`} />
                                      Live Timer: {formatTime(quizTimer)}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">
                                      <Clock className="h-3 w-3" />
                                      {quiz?.duration || 0} mins limit
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setSelectedAttemptForReview(att)}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="h-3 w-3" /> Review Results
                                  </button>
                                  {isFailed && hasRemainingAttempts && quiz && (
                                    <button
                                      onClick={() => handleInitiateQuiz(quiz)}
                                      className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 cursor-pointer shadow-xs animate-bounce"
                                    >
                                      <RefreshCw className="h-3 w-3 animate-spin" style={{ animationDuration: '3s' }} /> Retry Attempt
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {attempts.filter(a => a.studentId === currentUser?.id).length === 0 && (
                          <p className="text-xs text-slate-400 py-6 text-center">No assessments completed yet.</p>
                        )}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                              <th className="pb-3">Learner</th>
                              <th className="pb-3">Assessment Code</th>
                              <th className="pb-3">Points Recv</th>
                              <th className="pb-3">Tab Switches</th>
                              <th className="pb-3">Auto Submit</th>
                            </tr>
                          </thead>
                          <tbody className="text-xs">
                            {attempts.map((att) => {
                              const std = usersList.find(u => u.id === att.studentId);
                              const qz = quizzes.find(q => q.id === att.quizId);
                              return (
                                <tr key={att.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                  <td className="py-3 font-semibold text-slate-800">{std?.name || 'External Student'}</td>
                                  <td className="py-3 text-slate-500 font-mono">{qz?.title.slice(0, 24)}...</td>
                                  <td className="py-3 font-mono font-bold text-indigo-600">{att.score} / {att.totalPoints}</td>
                                  <td className="py-3">
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${att.tabSwitches > 1 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                                      {att.tabSwitches} Switches
                                    </span>
                                  </td>
                                  <td className="py-3 text-slate-400">{att.autoSubmitted ? 'Yes' : 'No'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {currentRole === 'student' && currentUser && (
                    <KanbanBoard
                      currentUser={currentUser}
                      quizzes={quizzes}
                      attempts={attempts}
                      assignments={assignments}
                      submissions={submissions}
                      setActiveTab={setActiveTab}
                      onReviewAttempt={setSelectedAttemptForReview}
                    />
                  )}

                  {currentRole === 'student' && currentUser && (
                    <Achievements 
                      currentUser={currentUser}
                      attempts={attempts}
                      quizzes={quizzes}
                      assignments={assignments}
                      submissions={submissions}
                    />
                  )}

                  {currentRole === 'student' && currentUser && (
                    <QuizLeaderboard
                      currentUser={currentUser}
                      quizzes={quizzes}
                      attempts={attempts}
                      usersList={usersList}
                    />
                  )}
                </div>

                {/* Column 3: Side widget controls (Calendar / Next tests / Plagiarism stats) */}
                <div className="space-y-6">
                  
                  {/* Dynamic Deadlines Sidebar */}
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
                    <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 text-xs uppercase tracking-wider">
                      Upcoming Deadlines
                    </h4>
                    <div className="space-y-4">
                      {assignments.map(asg => (
                        <div key={asg.id} className="flex gap-3">
                          <div className="flex h-11 w-11 flex-col items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-mono shrink-0">
                            <span className="text-[9px] font-bold uppercase">JUL</span>
                            <span className="text-sm font-bold leading-none">{new Date(asg.deadline).getDate()}</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{asg.title}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{asg.subject} • Awaiting Submission</p>
                          </div>
                        </div>
                      ))}
                      {assignments.length === 0 && (
                        <p className="text-xs text-slate-400 py-2 text-center">No deadlines scheduled.</p>
                      )}
                    </div>
                  </div>

                  {/* Active Proctor Monitor panel */}
                  {currentRole !== 'student' && (
                    <div className="rounded-xl bg-indigo-900 p-6 text-white">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-200">Anti-Cheat Live Monitor</h4>
                      </div>
                      <p className="text-xs text-slate-300">Continuous background proctor logs are tracking tab switches and fullscreen violations dynamically.</p>
                      <div className="mt-4 pt-3 border-t border-indigo-800 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="opacity-75">Student attempts detected:</span>
                          <strong className="font-mono">{attempts.length}</strong>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="opacity-75">Violations logged:</span>
                          <strong className="text-rose-400 font-mono">{attempts.filter(a => a.tabSwitches > 0).length}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Student Achievements / Leaderboard (Only for Students) */}
                  {currentRole === 'student' && (
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
                      <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="h-4 w-4 text-indigo-600" />
                        Achievements Leaderboard
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-lg font-bold text-indigo-600">🥇</span>
                          <div className="flex-1">
                            <p className="text-xs font-bold">Himanshu Tiwary</p>
                            <span className="text-[10px] text-slate-400">Level 12 • 2450 XP</span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Current</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-100">
                          <span className="text-lg font-bold text-slate-400">🥈</span>
                          <div className="flex-1">
                            <p className="text-xs font-bold">Jane Doe</p>
                            <span className="text-[10px] text-slate-400">Level 9 • 1890 XP</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

              </div>

            </div>
          )}


          {/* TAB 2: ASSESSMENTS / QUIZZES VIEW */}
          {activeTab === 'assessments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">Quizzes & Live Exams</h3>
                  <p className="text-xs text-slate-500">Schedule dynamic exams, MCQs, coding challenges, or execute live tests securely.</p>
                </div>
                {currentRole === 'teacher' && (
                  <button 
                    onClick={() => setShowCreateQuiz(true)}
                    className="flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-colors"
                  >
                    <Plus className="h-4 w-4" /> Assemble Assessment
                  </button>
                )}
              </div>

              {/* ASSEMBLE ASSESSMENT MODAL */}
              {showCreateQuiz && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-6 shadow-md max-w-4xl">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h4 className="font-bold text-slate-900">Configure New Assessment Paper</h4>
                    <button onClick={() => setShowCreateQuiz(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">Cancel</button>
                  </div>

                  {/* AI Smart Draft Option */}
                  <div className="p-4 rounded-xl bg-slate-900 text-white space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4.5 w-4.5 text-indigo-400" />
                      <span className="text-xs font-bold tracking-wider uppercase text-indigo-300">Draft Questions Instantly with Gemini AI</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-2">
                        <label className="text-[10px] text-slate-400 block mb-1">Topic description (e.g. AVL Balance, CSS Flexbox)</label>
                        <input 
                          type="text" 
                          placeholder="Type topic..." 
                          value={aiTopic}
                          onChange={(e) => setAiTopic(e.target.value)}
                          className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Difficulty level</label>
                        <select 
                          value={aiDifficulty}
                          onChange={(e) => setAiDifficulty(e.target.value as any)}
                          className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-white"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Number of questions</label>
                        <input 
                          type="number" 
                          value={aiNumQ}
                          onChange={(e) => setAiNumQ(e.target.value)}
                          className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isAiGenerating}
                      onClick={generateAIQuizQuestions}
                      className="rounded bg-indigo-500 hover:bg-indigo-400 text-xs font-bold px-4 py-2 transition-colors inline-flex items-center gap-2"
                    >
                      {isAiGenerating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      Generate Questions Draft
                    </button>
                  </div>

                  <form onSubmit={handleSaveQuiz} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">Assessment Paper Title</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Mid-term Exam" 
                          value={newQuizTitle}
                          onChange={(e) => setNewQuizTitle(e.target.value)}
                          className="w-full rounded border border-slate-200 px-3 py-2 text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">Course Subject Area</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Data Structures" 
                          value={newQuizSubject}
                          onChange={(e) => setNewQuizSubject(e.target.value)}
                          className="w-full rounded border border-slate-200 px-3 py-2 text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">Duration (Minutes)</label>
                        <input 
                          type="number" 
                          value={newQuizDuration}
                          onChange={(e) => setNewQuizDuration(e.target.value)}
                          className="w-full rounded border border-slate-200 px-3 py-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">Passing Percentage (%)</label>
                        <input 
                          type="number" 
                          value={newQuizPass}
                          onChange={(e) => setNewQuizPass(e.target.value)}
                          className="w-full rounded border border-slate-200 px-3 py-2 text-xs"
                        />
                      </div>
                      <div className="flex items-center pt-6">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={newQuizNegative} 
                            onChange={(e) => setNewQuizNegative(e.target.checked)}
                            className="rounded text-indigo-600"
                          />
                          Enable Negative Marking (25% penalty)
                        </label>
                      </div>
                    </div>

                    {/* Question details list */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-600">Configured Questions: ({newQuizQuestions.length})</span>
                        <button
                          type="button"
                          onClick={() => setNewQuizQuestions(prev => [...prev, { type: 'mcq', text: '', options: ['', '', '', ''], correctAnswer: '0', points: 5, difficulty: 'medium' }])}
                          className="text-xs text-indigo-600 hover:underline font-bold"
                        >
                          + Add MCQ Question manually
                        </button>
                      </div>

                      {newQuizQuestions.map((q, qIdx) => (
                        <div key={qIdx} className="p-4 rounded-xl border border-slate-100 bg-slate-50 relative space-y-3">
                          <button 
                            type="button"
                            onClick={() => setNewQuizQuestions(prev => prev.filter((_, idx) => idx !== qIdx))}
                            className="absolute right-3 top-3 text-rose-500 hover:text-rose-700 text-xs font-bold"
                          >
                            Remove
                          </button>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">Type</label>
                              <select 
                                value={q.type}
                                onChange={(e) => {
                                  const updated = [...newQuizQuestions];
                                  updated[qIdx].type = e.target.value;
                                  setNewQuizQuestions(updated);
                                }}
                                className="w-full rounded border border-slate-200 p-1 text-xs"
                              >
                                <option value="mcq">MCQ</option>
                                <option value="subjective">Subjective (Autograde limit)</option>
                                <option value="coding">Coding Sandbox</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">Points</label>
                              <input 
                                type="number" 
                                value={q.points}
                                onChange={(e) => {
                                  const updated = [...newQuizQuestions];
                                  updated[qIdx].points = Number(e.target.value);
                                  setNewQuizQuestions(updated);
                                }}
                                className="w-full rounded border border-slate-200 p-1 text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">Difficulty</label>
                              <select 
                                value={q.difficulty}
                                onChange={(e) => {
                                  const updated = [...newQuizQuestions];
                                  updated[qIdx].difficulty = e.target.value;
                                  setNewQuizQuestions(updated);
                                }}
                                className="w-full rounded border border-slate-200 p-1 text-xs"
                              >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Question Description Text</label>
                            <input 
                              type="text" 
                              value={q.text}
                              onChange={(e) => {
                                const updated = [...newQuizQuestions];
                                updated[qIdx].text = e.target.value;
                                setNewQuizQuestions(updated);
                              }}
                              className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                              placeholder="Type description..."
                              required
                            />
                          </div>

                          {q.type === 'mcq' && q.options && (
                            <div className="grid grid-cols-2 gap-2">
                              {q.options.map((opt: string, optIdx: number) => (
                                <div key={optIdx} className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-mono text-slate-400 font-bold">{optIdx + 1}:</span>
                                  <input 
                                    type="text" 
                                    value={opt}
                                    onChange={(e) => {
                                      const updated = [...newQuizQuestions];
                                      updated[qIdx].options[optIdx] = e.target.value;
                                      setNewQuizQuestions(updated);
                                    }}
                                    className="w-full rounded border border-slate-200 p-1 text-xs"
                                    placeholder={`Option ${optIdx + 1}`}
                                    required
                                  />
                                </div>
                              ))}
                              <div className="col-span-2">
                                <label className="text-[10px] text-indigo-600 font-bold block mb-1">Correct Option index (0 to 3)</label>
                                <input 
                                  type="text" 
                                  value={q.correctAnswer}
                                  onChange={(e) => {
                                    const updated = [...newQuizQuestions];
                                    updated[qIdx].correctAnswer = e.target.value;
                                    setNewQuizQuestions(updated);
                                  }}
                                  className="w-16 rounded border border-slate-200 p-1 text-xs font-mono"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                      <button 
                        type="button" 
                        onClick={() => setShowCreateQuiz(false)} 
                        className="rounded px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold"
                      >
                        Close
                      </button>
                      <button 
                        type="submit" 
                        className="rounded bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-xs font-bold text-white transition-colors"
                      >
                        Distribute Assessment Paper
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* LIST OF AVAILABLE ASSESSMENTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quizzes.map((qz) => {
                  const quizAttempts = attempts.filter(a => a.quizId === qz.id && a.studentId === currentUser?.id);
                  const latestAttempt = quizAttempts.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];
                  const hasRemainingAttempts = quizAttempts.length < qz.maxAttempts;
                  const remainingCount = qz.maxAttempts - quizAttempts.length;

                  let isFailed = false;
                  let scorePercentage = 0;
                  if (latestAttempt) {
                    scorePercentage = Math.round((latestAttempt.score / latestAttempt.totalPoints) * 100);
                    isFailed = scorePercentage < (qz.passPercentage || 50);
                  }

                  return (
                    <div key={qz.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 uppercase tracking-wide">{qz.subject}</span>
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {qz.duration} Mins
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 mt-2">{qz.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <p className="text-xs text-slate-500 font-mono">{qz.questions.length} Questions structured</p>
                          <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded font-mono">
                            Max Attempts: {qz.maxAttempts}
                          </span>
                        </div>

                        {currentRole === 'student' && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {/* Remaining Attempts Badge */}
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold border ${
                              remainingCount > 0 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              <Percent className="h-3.5 w-3.5" />
                              Remaining: {remainingCount} / {qz.maxAttempts}
                            </span>

                            {/* Dynamic Timing Countdown / Duration Info */}
                            {activeQuiz?.id === qz.id ? (
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold border transition-all ${
                                quizTimer < 300 
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' 
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                <Clock className={`h-3.5 w-3.5 ${quizTimer < 300 ? 'animate-bounce' : 'animate-spin'}`} />
                                Live Timer: {formatTime(quizTimer)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">
                                <Clock className="h-3.5 w-3.5" />
                                {qz.duration} Mins Limit
                              </span>
                            )}
                          </div>
                        )}
                        
                        {qz.negativeMarking && (
                          <span className="inline-block rounded bg-rose-50 border border-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-700 mt-2 uppercase tracking-widest">
                            Negative Marking Active
                          </span>
                        )}
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                        {latestAttempt ? (
                          <div className="text-left">
                            <span className="text-[10px] text-slate-400 block font-mono">Latest score ({quizAttempts.length} attempts):</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <strong className={`text-xs font-bold ${isFailed ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {latestAttempt.score} / {latestAttempt.totalPoints} pts
                              </strong>
                              <span className={`text-[9px] font-bold px-1 rounded ${isFailed ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                {scorePercentage}% ({isFailed ? 'Failed' : 'Passed'})
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Not attempted yet</span>
                        )}

                        {currentRole === 'student' ? (
                          <div className="flex items-center gap-2">
                            {latestAttempt && (
                              <button
                                onClick={() => setSelectedAttemptForReview(latestAttempt)}
                                className="rounded-full px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5" /> Review Results
                              </button>
                            )}
                            {isFailed && hasRemainingAttempts ? (
                              <button
                                onClick={() => handleInitiateQuiz(qz)}
                                className="rounded-full px-4 py-2 text-xs font-bold transition-colors bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1 cursor-pointer"
                              >
                                <RefreshCw className="h-3 w-3" /> Retry Assessment ({remainingCount} left)
                              </button>
                            ) : (
                              <button
                                disabled={!hasRemainingAttempts}
                                onClick={() => handleInitiateQuiz(qz)}
                                className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                                  !hasRemainingAttempts 
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                }`}
                              >
                                {!hasRemainingAttempts ? 'No Attempts Left' : latestAttempt ? 'Retake Assessment' : 'Begin Assessment'}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-indigo-600">Secure Live Mode</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          {/* TAB 3: ASSIGNMENTS VIEW */}
          {activeTab === 'assignments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">Course Assignments</h3>
                  <p className="text-xs text-slate-500">Submit homework and coding exercises. Teachers review with plagiarism & AI assistants.</p>
                </div>
                {currentRole === 'teacher' && (
                  <button 
                    onClick={() => setShowCreateAssignment(true)}
                    className="flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-colors"
                  >
                    <Plus className="h-4 w-4" /> Publish Rubric
                  </button>
                )}
              </div>

              {/* CREATE ASSIGNMENT MODAL */}
              {showCreateAssignment && (
                <form onSubmit={handleSaveAssignment} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-md max-w-2xl">
                  <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2">Publish New Assignment Rubric</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Assignment Title</label>
                      <input 
                        type="text" 
                        value={newAsgTitle}
                        onChange={(e) => setNewAsgTitle(e.target.value)}
                        placeholder="e.g. Tree Rotations" 
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Course Subject Area</label>
                      <input 
                        type="text" 
                        value={newAsgSubject}
                        onChange={(e) => setNewAsgSubject(e.target.value)}
                        placeholder="e.g. Data Structures" 
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Description / Instructions</label>
                    <textarea 
                      value={newAsgDesc}
                      onChange={(e) => setNewAsgDesc(e.target.value)}
                      placeholder="Specify deliverables, grading scales..."
                      className="w-full rounded border border-slate-200 px-3 py-2 text-xs h-24"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Max Grade Points</label>
                      <input 
                        type="number" 
                        value={newAsgPoints}
                        onChange={(e) => setNewAsgPoints(e.target.value)}
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Deadline Date & Time</label>
                      <input 
                        type="datetime-local" 
                        value={newAsgDeadline}
                        onChange={(e) => setNewAsgDeadline(e.target.value)}
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs"
                        required
                      />
                    </div>
                    <div className="flex items-center pt-6">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={newAsgAllowLate} 
                          onChange={(e) => setNewAsgAllowLate(e.target.checked)}
                          className="rounded text-indigo-600"
                        />
                        Allow late submission
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <button type="button" onClick={() => setShowCreateAssignment(false)} className="rounded px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold">Cancel</button>
                    <button type="submit" className="rounded bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-xs font-bold text-white transition-colors">Publish Rubric</button>
                  </div>
                </form>
              )}

              {/* LIST OF ASSIGNMENTS */}
              <div className="grid grid-cols-1 gap-6">
                {assignments.map((asg) => {
                  const subm = submissions.find(s => s.assignmentId === asg.id && s.studentId === currentUser?.id);
                  return (
                    <div key={asg.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs relative">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="rounded bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">{asg.subject}</span>
                          <h4 className="font-bold text-slate-900 mt-2">{asg.title}</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-500 block">Due: {new Date(asg.deadline).toLocaleDateString()}</span>
                          <span className="text-[10px] text-indigo-600 font-mono font-bold">{asg.points} Max Points</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 mt-3 line-clamp-3 leading-relaxed">{asg.description}</p>

                      {/* SUBMISSION / EVALUATION INTERACTION PANEL */}
                      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {currentRole === 'student' ? (
                          subm ? (
                            <div className="flex-1 p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                              <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Your Evaluation Summary</span>
                                <span className="text-xs font-bold font-mono text-emerald-600">{subm.grade} / {asg.points} pts</span>
                              </div>
                              <p className="text-xs text-slate-600"><strong>Teacher Critique:</strong> {subm.feedback || 'Awaiting manual adjustments'}</p>
                              {subm.aiAssistedFeedback && (
                                <div className="p-2.5 rounded bg-indigo-50/50 border border-indigo-100 text-[11px] text-slate-700">
                                  <span className="flex items-center gap-1.5 font-bold text-indigo-700 mb-1">
                                    <Sparkles className="h-3.5 w-3.5" /> Supportive AI Learning Suggestion
                                  </span>
                                  <p>{subm.aiAssistedFeedback}</p>
                                  <p className="text-[9px] text-slate-400 font-mono mt-1">Similarity Index: {subm.plagiarismScore}%</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex-1 space-y-3">
                              <label className="text-xs font-bold text-slate-700 block">Submit your code snippet or explanation text below for assessment:</label>
                              <textarea
                                placeholder="Paste your structured solution text or tree representation..."
                                id={`text-asg-${asg.id}`}
                                className="w-full h-24 rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                              <button
                                onClick={() => {
                                  const area = document.getElementById(`text-asg-${asg.id}`) as HTMLTextAreaElement;
                                  handleAssignmentSubmit(asg.id, area?.value || '');
                                }}
                                className="rounded bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-all inline-flex items-center gap-2"
                              >
                                <Upload className="h-3.5 w-3.5" /> Evaluate Solution with Gemini
                              </button>
                            </div>
                          )
                        ) : (
                          // Teacher views list of submissions for this assignment
                          <div className="flex-1">
                            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Student Submissions:</h5>
                            <div className="space-y-2">
                              {submissions.filter(s => s.assignmentId === asg.id).map((sub) => {
                                const student = usersList.find(u => u.id === sub.studentId);
                                return (
                                  <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                                    <div>
                                      <p className="text-xs font-bold text-slate-800">{student?.name || 'Himanshu Tiwary'}</p>
                                      <span className="text-[10px] text-slate-400">Similarity Scan: {sub.plagiarismScore}%</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="text-xs font-bold font-mono text-indigo-600">{sub.grade || 'Awaiting'} / {asg.points} pts</span>
                                      <button 
                                        onClick={() => {
                                          setSelectedSubmission(sub);
                                          setManualGrade(String(sub.grade || ''));
                                          setManualFeedback(sub.feedback || '');
                                        }}
                                        className="rounded bg-indigo-50 hover:bg-indigo-100 px-3 py-1 text-[10px] font-bold text-indigo-700 transition-colors"
                                      >
                                        Adjust Grade / Feedback
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                              {submissions.filter(s => s.assignmentId === asg.id).length === 0 && (
                                <p className="text-xs text-slate-400 italic">No submissions made yet.</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ADJUST GRADE AND FEEDBACK DIALOG */}
              {selectedSubmission && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full space-y-4 shadow-xl">
                    <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2">Adjust Grade Metrics</h4>
                    
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Assigned Score</label>
                      <input 
                        type="number" 
                        value={manualGrade}
                        onChange={(e) => setManualGrade(e.target.value)}
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Feedback Critique Comments</label>
                      <textarea 
                        value={manualFeedback}
                        onChange={(e) => setManualFeedback(e.target.value)}
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs h-24"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button onClick={() => setSelectedSubmission(null)} className="rounded px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold">Cancel</button>
                      <button onClick={handleSaveGradeFeedback} className="rounded bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-xs font-bold text-white transition-colors">Apply Metrics</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}


          {/* TAB 4: AI REVISION PLAN & INSIGHTS (Only for Student) */}
          {activeTab === 'ai-insights' && aiRec && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="rounded-lg bg-indigo-900 p-2 text-white shadow-sm">
                  <Sparkles className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">Personalized Smart Study Guide</h3>
                  <p className="text-xs text-slate-500">Continuous academic performance model matching active weaknesses and strengths.</p>
                </div>
              </div>

              {/* Smart feedback box */}
              <div className="rounded-xl bg-slate-900 p-6 text-white space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-600/10 rounded-full blur-xl pointer-events-none" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Cognitive Advice Summary</span>
                <p className="text-sm italic leading-relaxed text-slate-200">{aiRec.recommendationAdvice}</p>
              </div>

              {/* Weak and Strong Topics Bento grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 border border-slate-200 bg-white rounded-xl shadow-xs space-y-3">
                  <span className="text-xs font-bold uppercase text-rose-500 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" /> Focus Areas / Weak Concepts
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {aiRec.weakTopics.map((w, idx) => (
                      <span key={idx} className="rounded-full bg-rose-50 border border-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-5 border border-slate-200 bg-white rounded-xl shadow-xs space-y-3">
                  <span className="text-xs font-bold uppercase text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> Validated Strengths
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {aiRec.strongTopics.map((s, idx) => (
                      <span key={idx} className="rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actionable Study Steps List */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
                <h4 className="font-display font-bold text-slate-950 text-sm uppercase tracking-wider mb-5">
                  Chronological Step-by-Step Study Plan
                </h4>
                <div className="relative border-l-2 border-slate-100 pl-6 space-y-6">
                  {aiRec.studyPlanSteps.map((step, idx) => (
                    <div key={idx} className="relative">
                      {/* Step Indicator Dot */}
                      <span className="absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white font-mono text-[9px] font-bold">
                        {idx + 1}
                      </span>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h5 className="text-sm font-bold text-slate-800">{step.title}</h5>
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[9px] font-mono text-slate-500">{step.duration}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{step.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}


          {/* TAB 5: MESSAGES SYSTEM */}
          {activeTab === 'messages' && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-xs h-[500px] flex overflow-hidden">
              {/* User Selector List */}
              <aside className="w-64 border-r border-slate-100 p-4 flex flex-col overflow-y-auto bg-slate-50/50">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Contacts Directory</h4>
                <div className="space-y-1">
                  {usersList.filter(u => u.id !== currentUser?.id).map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setActiveChatUser(u)}
                      className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors ${
                        activeChatUser?.id === u.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <img src={u.avatar || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80"} alt="avatar" className="h-8 w-8 rounded-full" />
                      <div>
                        <p className="text-xs font-bold leading-none">{u.name}</p>
                        <span className="text-[9px] capitalize text-slate-400 font-semibold">{u.role}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </aside>

              {/* Chat panel */}
              {activeChatUser ? (
                <div className="flex-1 flex flex-col justify-between">
                  {/* Chat header */}
                  <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={activeChatUser.avatar} alt="avatar" className="h-9 w-9 rounded-full" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">{activeChatUser.name}</p>
                        <span className="text-[10px] capitalize text-slate-400">{activeChatUser.role} • Active Session</span>
                      </div>
                    </div>
                  </div>

                  {/* Chat body */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/20">
                    {messages
                      .filter(m => (m.senderId === currentUser?.id && m.receiverId === activeChatUser.id) || (m.senderId === activeChatUser.id && m.receiverId === currentUser?.id))
                      .map((msg) => {
                        const isMe = msg.senderId === currentUser?.id;
                        return (
                          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3.5 rounded-2xl max-w-sm text-xs space-y-1 ${
                              isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs'
                            }`}>
                              <p className="leading-relaxed">{msg.content}</p>
                              <span className={`text-[8px] font-mono block text-right ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                    {typingSim && (
                      <div className="flex justify-start">
                        <div className="p-3 bg-white border border-slate-100 rounded-2xl flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message input */}
                  <form onSubmit={handleSendMessage} className="border-t border-slate-100 px-6 py-4 flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Ask double rotational balancing pivot inquiries..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-1 rounded-xl bg-slate-100 border-none px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button type="submit" className="rounded-full bg-indigo-600 hover:bg-indigo-500 p-2.5 text-white transition-colors">
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <MessageSquare className="h-10 w-10 text-slate-300" />
                  <p className="text-xs font-semibold">Select an academic user contact above to communicate.</p>
                </div>
              )}
            </div>
          )}


          {/* TAB 6: USERS DIRECTORY (Admin Only) */}
          {activeTab === 'users' && currentRole === 'admin' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">User & Security Management</h3>
                  <p className="text-xs text-slate-500">Authorize academic credentials, edit student details, and suspend profiles.</p>
                </div>
                <button 
                  onClick={() => setShowCreateUser(true)}
                  className="flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-all"
                >
                  <UserPlus className="h-4 w-4" /> Add Academic Credential
                </button>
              </div>

              {/* CREATE USER MODAL */}
              {showCreateUser && (
                <form onSubmit={handleSaveUser} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-md max-w-lg">
                  <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2">Create New Academic Account</h4>
                  
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Full Name</label>
                    <input 
                      type="text" 
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="e.g. Dr. Arthur Jenkins" 
                      className="w-full rounded border border-slate-200 px-3 py-2 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Email Address</label>
                    <input 
                      type="email" 
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="e.g. jenkins@eduassess.ai" 
                      className="w-full rounded border border-slate-200 px-3 py-2 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Role Permission Group</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as any)}
                      className="w-full rounded border border-slate-200 px-3 py-2 text-xs"
                    >
                      <option value="student">Student (Learner context)</option>
                      <option value="teacher">Teacher (Instructor context)</option>
                      <option value="admin">Administrator (Superuser context)</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <button type="button" onClick={() => setShowCreateUser(false)} className="rounded px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold">Cancel</button>
                    <button type="submit" className="rounded bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-xs font-bold text-white transition-colors">Register Account</button>
                  </div>
                </form>
              )}

              {/* USER GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {usersList.map((usr) => (
                  <div key={usr.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                    <div className="flex gap-4">
                      <img src={usr.avatar || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80"} alt="avatar" className="h-12 w-12 rounded-full border border-slate-100" />
                      <div>
                        <h4 className="font-bold text-slate-950 leading-tight">{usr.name}</h4>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{usr.email}</p>
                        <span className="inline-block rounded bg-indigo-50 text-indigo-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mt-2">
                          {usr.role}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${usr.status === 'active' ? 'text-emerald-600' : 'text-rose-500'}`}>
                        ● Status: {usr.status}
                      </span>

                      <button
                        onClick={() => toggleUserSuspend(usr.id, usr.status === 'suspended')}
                        className={`rounded px-3 py-1 text-[10px] font-bold uppercase transition-colors ${
                          usr.status === 'suspended' 
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        {usr.status === 'suspended' ? 'Restore User' : 'Suspend Access'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* TAB 7: COURSES DIRECTORY */}
          {activeTab === 'courses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">Institution Course Structures</h3>
                  <p className="text-xs text-slate-500">Coordinate degree curricula, subject areas, and batch codes.</p>
                </div>
                {currentRole === 'admin' && (
                  <button 
                    onClick={() => setShowCreateCourse(true)}
                    className="flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-all"
                  >
                    <Plus className="h-4 w-4" /> Provision Course Curriculum
                  </button>
                )}
              </div>

              {/* CREATE COURSE FORM */}
              {showCreateCourse && (
                <form onSubmit={handleSaveCourse} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-md max-w-2xl">
                  <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2">Configure Course Structure</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Course Name</label>
                      <input 
                        type="text" 
                        value={newCourseName}
                        onChange={(e) => setNewCourseName(e.target.value)}
                        placeholder="e.g. Electrical & Systems" 
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Course Code</label>
                      <input 
                        type="text" 
                        value={newCourseCode}
                        onChange={(e) => setNewCourseCode(e.target.value)}
                        placeholder="e.g. ECE-2026" 
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Semester Designation</label>
                      <input 
                        type="text" 
                        value={newCourseSemester}
                        onChange={(e) => setNewCourseSemester(e.target.value)}
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Batch Code</label>
                      <input 
                        type="text" 
                        value={newCourseBatch}
                        onChange={(e) => setNewCourseBatch(e.target.value)}
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Subjects (Comma separated list)</label>
                    <input 
                      type="text" 
                      value={newCourseSubjects}
                      onChange={(e) => setNewCourseSubjects(e.target.value)}
                      placeholder="e.g. Network Theory, Signal Processing, Embedded Systems" 
                      className="w-full rounded border border-slate-200 px-3 py-2 text-xs"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <button type="button" onClick={() => setShowCreateCourse(false)} className="rounded px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold">Cancel</button>
                    <button type="submit" className="rounded bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-xs font-bold text-white transition-colors">Publish Curriculum</button>
                  </div>
                </form>
              )}

              {/* LIST OF COURSES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.map((crs) => (
                  <div key={crs.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs relative space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="rounded bg-slate-100 text-slate-500 px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider uppercase">{crs.code}</span>
                        <h4 className="font-bold text-slate-900 mt-2">{crs.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5 font-semibold">{crs.semester} • {crs.batch}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Included Academic Subjects</span>
                      <div className="flex flex-wrap gap-2">
                        {crs.subjects.map((sub, sIdx) => (
                          <span key={sIdx} className="rounded bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: AUDIT LOGS */}
          {activeTab === 'audit-logs' && currentRole === 'admin' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">System Audit Trail</h3>
                  <p className="text-xs text-slate-500">Review security events, quiz completions, and administrative actions.</p>
                </div>
                <button
                  onClick={fetchAuditLogs}
                  disabled={loadingAuditLogs}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 transition-all shadow-xs cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingAuditLogs ? 'animate-spin' : ''}`} />
                  Refresh Logs
                </button>
              </div>

              {/* SEARCH & FILTER CONTROLS */}
              <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search logs by keyword, user, action..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={auditRoleFilter}
                    onChange={(e) => setAuditRoleFilter(e.target.value)}
                    className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white font-semibold text-slate-600 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="teacher">Teacher</option>
                    <option value="student">Student</option>
                  </select>
                  <select
                    value={auditActionFilter}
                    onChange={(e) => setAuditActionFilter(e.target.value)}
                    className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white font-semibold text-slate-600 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Actions</option>
                    <option value="USER_LOGIN">User Logins</option>
                    <option value="USER_REGISTER">User Registrations</option>
                    <option value="USER_SWITCH_ROLE">Role Switches</option>
                    <option value="QUIZ_CREATE">Quiz Creations</option>
                    <option value="QUIZ_SUBMIT">Quiz Submissions</option>
                    <option value="ASSIGNMENT_CREATE">Assignment Creations</option>
                    <option value="ASSIGNMENT_SUBMIT">Assignment Submissions</option>
                    <option value="SUBMISSION_GRADE">Grading Events</option>
                  </select>
                </div>
              </div>

              {/* DATE RANGE FILTER CONTROLS */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3" id="audit-date-range-filters">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  <span>Academic Windows & Date Ranges</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Preset Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Quick Academic Presets</label>
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'all') {
                          setAuditStartDate('');
                          setAuditEndDate('');
                        } else if (val === 'today') {
                          const today = new Date().toISOString().split('T')[0];
                          setAuditStartDate(today);
                          setAuditEndDate(today);
                        } else if (val === 'week') {
                          const today = new Date();
                          const first = today.getDate() - today.getDay();
                          const last = first + 6;
                          const firstDay = new Date(today.setDate(first)).toISOString().split('T')[0];
                          const lastDay = new Date(today.setDate(last)).toISOString().split('T')[0];
                          setAuditStartDate(firstDay);
                          setAuditEndDate(lastDay);
                        } else if (val === 'midterm') {
                          setAuditStartDate('2026-06-15');
                          setAuditEndDate('2026-06-22');
                        } else if (val === 'final_prep') {
                          setAuditStartDate('2026-06-23');
                          setAuditEndDate('2026-06-30');
                        }
                      }}
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white font-semibold text-slate-600 focus:outline-none cursor-pointer"
                    >
                      <option value="all">Custom Date Range / All Time</option>
                      <option value="today">Today</option>
                      <option value="week">Current Week</option>
                      <option value="midterm">Mid-Term Exams (June 15 – June 22, 2026)</option>
                      <option value="final_prep">Final Exams Prep (June 23 – June 30, 2026)</option>
                    </select>
                  </div>

                  {/* Start Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Start Date</label>
                    <input
                      type="date"
                      value={auditStartDate}
                      onChange={(e) => setAuditStartDate(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* End Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">End Date</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={auditEndDate}
                        onChange={(e) => setAuditEndDate(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      {(auditStartDate || auditEndDate) && (
                        <button
                          onClick={() => {
                            setAuditStartDate('');
                            setAuditEndDate('');
                          }}
                          className="px-2.5 py-1.5 text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Clear date filters"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* AUDIT LOG TABLE/LIST */}
              {loadingAuditLogs ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <RefreshCw className="h-8 w-8 animate-spin text-indigo-500 mb-2" />
                  <p className="text-sm font-semibold">Loading system audit trail...</p>
                </div>
              ) : (
                <AuditLogTable 
                  logs={filteredAuditLogs} 
                  onLogsDeleted={fetchAuditLogs}
                  currentUserId={currentUser?.id}
                />
              )}
            </div>
          )}

        </div>
      </main>

      {/* Attendance Confirmation Modal (Student only, when initiating a quiz) */}
      <AnimatePresence>
        {quizToConfirm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-5 text-left"
              id="quiz-attendance-confirmation-modal"
            >
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Percent className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm tracking-tight uppercase">Confirm Examination Attendance</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Verify your active student presence to begin</p>
                </div>
              </div>

              {/* Quiz Info */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs text-slate-600">
                <p>Assessment Title: <strong className="text-slate-800">{quizToConfirm.title}</strong></p>
                <p>Subject/Course: <span className="font-bold text-indigo-600">{quizToConfirm.subject}</span></p>
                <p>Scheduled Date: <span className="font-mono">{new Date().toLocaleDateString()}</span> (Today)</p>
                <p>Duration Allowed: <span className="font-mono font-bold">{quizToConfirm.duration} Minutes</span></p>
              </div>

              {/* Confirm Text Box */}
              <div className="space-y-3">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Before we launch the secure examination browser, you are required to check the verification box below to confirm that you are present, online, and initiating this assessment attempt honestly.
                </p>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50/50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmAttendanceChecked}
                    onChange={(e) => setConfirmAttendanceChecked(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                  />
                  <div className="text-[11px] text-slate-700 font-semibold leading-tight select-none">
                    I confirm my attendance for this test/quiz. I verify that I am giving this test now and my attendance can be recorded as present.
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setQuizToConfirm(null);
                    setConfirmAttendanceChecked(false);
                  }}
                  disabled={isConfirmingAttendanceLoading}
                  className="w-1/2 bg-slate-50 hover:bg-slate-100 border border-slate-250 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAttendanceAndStart}
                  disabled={!confirmAttendanceChecked || isConfirmingAttendanceLoading}
                  className={`w-1/2 flex items-center justify-center gap-1.5 font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-xs ${
                    confirmAttendanceChecked && !isConfirmingAttendanceLoading
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-indigo-300 text-indigo-50 cursor-not-allowed'
                  }`}
                >
                  {isConfirmingAttendanceLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Confirm & Start"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Immediate Post-Submission Results Card */}
      <AnimatePresence>
        {justFinishedAttempt && (() => {
          const quiz = quizzes.find(q => q.id === justFinishedAttempt.quizId);
          if (!quiz) return null;
          const scorePercent = Math.round((justFinishedAttempt.score / justFinishedAttempt.totalPoints) * 100);
          const passed = scorePercent >= (quiz.passPercentage || 50);

          return (
            <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full text-center overflow-hidden p-6 space-y-6"
                id="assessment-immediate-result-card"
              >
                {/* Result Status Icon & Celebration */}
                <div className="flex flex-col items-center space-y-3">
                  <div className={`h-16 w-16 rounded-full flex items-center justify-center ${passed ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                    <Trophy className="h-8 w-8" />
                  </div>
                  <div>
                    <span className="rounded bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 uppercase tracking-wide font-mono">
                      {quiz.subject}
                    </span>
                    <h4 className="font-bold text-base text-slate-900 mt-2 font-display">{quiz.title}</h4>
                    <p className="text-xs text-slate-500">Assessment Successfully Submitted</p>
                  </div>
                </div>

                {/* Score Circle / Metric */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3 text-left">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    <span>Performance Rating</span>
                    <span className={`px-2 py-0.5 rounded font-sans text-[10px] font-bold ${passed ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                      {passed ? 'PASSED' : 'AT RISK'}
                    </span>
                  </div>
                  
                  <div className="flex items-baseline justify-center gap-1 py-1">
                    <span className="text-4xl font-black font-mono text-slate-800">{justFinishedAttempt.score}</span>
                    <span className="text-slate-400 font-medium text-xs">/ {justFinishedAttempt.totalPoints} pts</span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${passed ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${scorePercent}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 font-mono pt-1">
                    <span>Accuracy: {scorePercent}%</span>
                    <span>Proctoring: {justFinishedAttempt.isFullScreenViolation ? 'Flagged' : 'Compliant'}</span>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSelectedAttemptForReview(justFinishedAttempt);
                      setJustFinishedAttempt(null);
                    }}
                    className="w-full sm:w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Eye className="h-4 w-4" /> Review Results
                  </button>
                  <button
                    onClick={handleDoneAndExit}
                    className="w-full sm:w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
                  >
                    Done & Exit
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Review Results Modal (Comparative Performance Breakdown) */}
      <AnimatePresence>
        {selectedAttemptForReview && (() => {
          const quiz = quizzes.find(q => q.id === selectedAttemptForReview.quizId);
          if (!quiz) return null;
          const scorePercent = Math.round((selectedAttemptForReview.score / selectedAttemptForReview.totalPoints) * 100);
          const passed = scorePercent >= (quiz.passPercentage || 50);

          return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full text-left my-8 overflow-hidden"
                id="quiz-results-review-modal"
              >
                {/* Header Banner */}
                <div className={`p-6 text-white relative overflow-hidden ${passed ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-gradient-to-r from-rose-600 to-amber-600'}`}>
                  {/* Close button */}
                  <button 
                    onClick={closeReviewModalAndReturn}
                    className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/35 text-white/90 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>

                  <div className="flex justify-between items-start pr-8">
                    <div>
                      <span className="rounded bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">{quiz.subject}</span>
                      <h4 className="font-bold text-xl mt-1">{quiz.title}</h4>
                      <p className="text-xs text-white/85 mt-1">Performance Review • Completed on {new Date(selectedAttemptForReview.completedAt).toLocaleDateString()}</p>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-black font-mono">{selectedAttemptForReview.score} / {selectedAttemptForReview.totalPoints}</div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-white/90">{scorePercent}% ({passed ? 'Passed' : 'At Risk'})</div>
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="p-6 max-h-[65vh] overflow-y-auto space-y-6">
                  {/* Stats Overview */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-center">
                      <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block">Accuracy</span>
                      <span className="text-base font-bold text-slate-800 font-mono">{scorePercent}%</span>
                    </div>
                    <div className="text-center border-l border-slate-150">
                      <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block">Tab Switches</span>
                      <span className={`text-base font-bold font-mono ${selectedAttemptForReview.tabSwitches > 1 ? 'text-rose-500' : 'text-slate-800'}`}>
                        {selectedAttemptForReview.tabSwitches}
                      </span>
                    </div>
                    <div className="text-center border-l border-slate-150">
                      <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block">Proctor Violations</span>
                      <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${selectedAttemptForReview.isFullScreenViolation ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {selectedAttemptForReview.isFullScreenViolation ? 'Flagged' : 'None'}
                      </span>
                    </div>
                    <div className="text-center border-l border-slate-150">
                      <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block">Completion Mode</span>
                      <span className="text-xs font-bold text-slate-800 font-mono">
                        {selectedAttemptForReview.autoSubmitted ? 'Auto-timeout' : 'Manual'}
                      </span>
                    </div>
                  </div>

                  {/* Question Comparison List */}
                  <div className="space-y-4">
                    <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono border-b border-slate-100 pb-2">Questions Comparative Breakdown</h5>
                    
                    {quiz.questions.map((question, index) => {
                      const studentAnswer = selectedAttemptForReview.answers[question.id];
                      const correctAnswer = question.correctAnswer;
                      const isCorrect = studentAnswer && correctAnswer && studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

                      return (
                        <div key={question.id} className="p-5 rounded-2xl border border-slate-100 bg-white shadow-xs space-y-4">
                          {/* Question Number and Status Banner */}
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-1 rounded-md bg-slate-50 border border-slate-100 text-[10px] font-mono font-bold text-slate-500">
                              Question {index + 1} ({question.points} pts) • {question.difficulty.toUpperCase()}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                              isCorrect 
                                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                                : studentAnswer 
                                  ? 'bg-rose-50 border border-rose-200 text-rose-700' 
                                  : 'bg-amber-50 border border-amber-200 text-amber-700'
                            }`}>
                              {isCorrect ? (
                                <>
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Correct Answer</span>
                                </>
                              ) : studentAnswer ? (
                                <>
                                  <X className="h-3.5 w-3.5" />
                                  <span>Incorrect Answer</span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  <span>Not Attempted</span>
                                </>
                              )}
                            </span>
                          </div>

                          {/* Question Text */}
                          <p className="text-sm font-semibold text-slate-800">{question.text}</p>

                          {/* Detailed Answer Breakdown based on type */}
                          {question.type === 'mcq' && question.options && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                              {question.options.map((option, optIdx) => {
                                const isSelected = studentAnswer === option;
                                const isOptionCorrect = correctAnswer === option;
                                
                                let optionBg = 'bg-slate-50 border-slate-200 text-slate-700';
                                if (isSelected) {
                                  optionBg = isCorrect 
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold shadow-xs' 
                                    : 'bg-rose-50 border-rose-300 text-rose-800 font-semibold shadow-xs';
                                } else if (isOptionCorrect) {
                                  optionBg = 'bg-emerald-50/50 border-emerald-200 text-emerald-700 font-medium';
                                }

                                return (
                                  <div 
                                    key={optIdx} 
                                    className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${optionBg}`}
                                  >
                                    <span className="flex-1">{option}</span>
                                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                      {isOptionCorrect && (
                                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500 text-white font-mono">
                                          Correct
                                        </span>
                                      )}
                                      {isSelected && (
                                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded font-mono ${
                                          isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                                        }`}>
                                          Chosen
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {question.type === 'subjective' && (
                            <div className="space-y-3 pt-1">
                              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
                                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Your Drafted Response</span>
                                <p className={`text-xs font-mono leading-relaxed whitespace-pre-wrap ${studentAnswer ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                                  {studentAnswer || 'No response recorded.'}
                                </p>
                              </div>
                              <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/20 space-y-1">
                                <span className="text-[10px] text-emerald-600 font-mono uppercase tracking-wider">Model Reference Answer</span>
                                <p className="text-xs text-slate-700 font-mono leading-relaxed whitespace-pre-wrap">
                                  {correctAnswer || 'Reference feedback template has not been predefined.'}
                                </p>
                              </div>
                            </div>
                          )}

                          {question.type === 'coding' && (
                            <div className="space-y-3 pt-1">
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Your Code Submission</span>
                                <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono overflow-x-auto max-h-48 whitespace-pre-wrap leading-relaxed">
                                  {studentAnswer || '// No code submitted.'}
                                </pre>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] text-emerald-600 font-mono uppercase tracking-wider block">Model Reference Code</span>
                                <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-mono overflow-x-auto max-h-48 whitespace-pre-wrap leading-relaxed">
                                  {correctAnswer || '// Model solution template.'}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">Accuracy metric: {scorePercent}% over {quiz.questions.length} structured queries</span>
                  <button 
                    onClick={closeReviewModalAndReturn}
                    className="px-5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-colors cursor-pointer"
                  >
                    Close Review
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
