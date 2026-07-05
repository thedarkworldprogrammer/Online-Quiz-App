export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  avatar?: string;
  status: 'active' | 'suspended';
  academicDetails?: {
    batch?: string;
    semester?: string;
    rollNo?: string;
    xp?: number;
    level?: number;
    streak?: number;
  };
}

export interface Course {
  id: string;
  name: string;
  code: string;
  semester: string;
  batch: string;
  session: string;
  subjects: string[];
}

export interface Question {
  id: string;
  type: 'mcq' | 'subjective' | 'coding';
  text: string;
  options?: string[];
  correctAnswer?: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  codingTemplate?: string;
  testCases?: { input: string; output: string }[];
}

export interface Quiz {
  id: string;
  title: string;
  courseId: string;
  subject: string;
  questions: Question[];
  duration: number;
  negativeMarking: boolean;
  passPercentage: number;
  maxAttempts: number;
  isPublished: boolean;
  scheduledAt?: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  score: number;
  totalPoints: number;
  answers: Record<string, string>;
  startedAt: string;
  completedAt: string;
  tabSwitches: number;
  isFullScreenViolation: boolean;
  autoSubmitted: boolean;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  courseId: string;
  subject: string;
  deadline: string;
  points: number;
  allowLate: boolean;
  fileUrl?: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  fileUrl: string;
  fileName: string;
  submittedAt: string;
  grade?: number;
  feedback?: string;
  plagiarismScore?: number;
  aiAssistedFeedback?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  receiverId: string;
  receiverName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'quiz' | 'assignment' | 'grade' | 'message' | 'system';
  isRead: boolean;
  createdAt: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  courseId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  courseId: string;
  authorName: string;
  createdAt: string;
}

export interface AIRecommendation {
  weakTopics: string[];
  strongTopics: string[];
  studyPlanSteps: {
    title: string;
    duration: string;
    action: string;
  }[];
  recommendationAdvice: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: 'admin' | 'teacher' | 'student';
  action: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

