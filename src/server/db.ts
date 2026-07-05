import fs from 'fs';
import path from 'path';

// Define DB file path
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Types & Interfaces
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
  correctAnswer?: string; // option index or text or code solution
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
  duration: number; // in minutes
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
  answers: Record<string, string>; // questionId -> studentAnswer
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

export interface DBStore {
  users: User[];
  courses: Course[];
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  assignments: Assignment[];
  submissions: Submission[];
  messages: Message[];
  notifications: Notification[];
  attendance: Attendance[];
  announcements: Announcement[];
  auditLogs: AuditLog[];
}

// Initial Seed Data
const defaultDB: DBStore = {
  users: [
    { id: 'usr-admin-1', name: 'Dr. Arthur Pendelton', email: 'admin@eduassess.ai', role: 'admin', status: 'active', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
    { id: 'usr-teacher-1', name: 'Prof. Sarah Jenkins', email: 'teacher@eduassess.ai', role: 'teacher', status: 'active', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' },
    { id: 'usr-student-1', name: 'Himanshu Tiwary', email: 'student@eduassess.ai', role: 'student', status: 'active', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80', academicDetails: { batch: 'A', semester: '4th Semester', rollNo: 'CS-2026-089', xp: 2450, level: 12, streak: 5 } },
    { id: 'usr-student-2', name: 'Jane Doe', email: 'student2@eduassess.ai', role: 'student', status: 'active', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80', academicDetails: { batch: 'A', semester: '4th Semester', rollNo: 'CS-2026-092', xp: 1890, level: 9, streak: 3 } }
  ],
  courses: [
    { id: 'crs-1', name: 'Computer Science & Engineering', code: 'CSE-2026', semester: '4th Semester', batch: 'Batch A', session: '2025-26', subjects: ['Data Structures', 'Database Management Systems', 'Artificial Intelligence'] },
    { id: 'crs-2', name: 'Electronics & Communication', code: 'ECE-2026', semester: '4th Semester', batch: 'Batch B', session: '2025-26', subjects: ['Digital Signal Processing', 'Microprocessors'] }
  ],
  quizzes: [
    {
      id: 'q-1',
      title: 'Data Structures - Mid Semester Quiz',
      courseId: 'crs-1',
      subject: 'Data Structures',
      duration: 15,
      negativeMarking: true,
      passPercentage: 40,
      maxAttempts: 1,
      isPublished: true,
      scheduledAt: '2026-07-06T10:00:00.000Z',
      questions: [
        {
          id: 'q-1-q1',
          type: 'mcq',
          text: 'What is the worst-case time complexity of inserting an element into a balanced binary search tree (like AVL Tree)?',
          options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
          correctAnswer: '1', // Index 1: O(log n)
          points: 5,
          difficulty: 'medium'
        },
        {
          id: 'q-1-q2',
          type: 'mcq',
          text: 'Which of the following data structures operates on the First In First Out (FIFO) principle?',
          options: ['Stack', 'Queue', 'Graph', 'Tree'],
          correctAnswer: '1', // Index 1: Queue
          points: 5,
          difficulty: 'easy'
        },
        {
          id: 'q-1-q3',
          type: 'coding',
          text: 'Write a function "isPalindrome(s: string): boolean" to check if a string is a palindrome. Ignore spacing and cases.',
          points: 15,
          difficulty: 'medium',
          codingTemplate: 'function isPalindrome(s: string): boolean {\n  // Write your code here\n  return false;\n}',
          testCases: [
            { input: '"racecar"', output: 'true' },
            { input: '"hello"', output: 'false' }
          ]
        }
      ]
    },
    {
      id: 'q-2',
      title: 'Database Management - Practice Test',
      courseId: 'crs-1',
      subject: 'Database Management Systems',
      duration: 10,
      negativeMarking: false,
      passPercentage: 50,
      maxAttempts: 3,
      isPublished: true,
      scheduledAt: '2026-07-07T14:30:00.000Z',
      questions: [
        {
          id: 'q-2-q1',
          type: 'mcq',
          text: 'Which SQL keyword is used to sort the result-set?',
          options: ['SORT BY', 'ORDER BY', 'GROUP BY', 'ALIGN BY'],
          correctAnswer: '1',
          points: 5,
          difficulty: 'easy'
        },
        {
          id: 'q-2-q2',
          type: 'mcq',
          text: 'What is the primary characteristic of the Third Normal Form (3NF)?',
          options: ['No transitive dependencies', 'No partial dependencies', 'No multi-valued attributes', 'Must be in BCNF'],
          correctAnswer: '0',
          points: 10,
          difficulty: 'hard'
        }
      ]
    }
  ],
  attempts: [
    {
      id: 'att-1',
      quizId: 'q-2',
      studentId: 'usr-student-1',
      score: 15,
      totalPoints: 15,
      answers: {
        'q-2-q1': '1',
        'q-2-q2': '0'
      },
      startedAt: '2026-07-04T12:00:00.000Z',
      completedAt: '2026-07-04T12:08:12.000Z',
      tabSwitches: 0,
      isFullScreenViolation: false,
      autoSubmitted: false
    }
  ],
  assignments: [
    {
      id: 'asg-1',
      title: 'AVL Tree Implementation & Balance Factor Analysis',
      description: 'Implement an AVL tree from scratch in TypeScript or Java. Include insertion, deletion, and rotation logic. In your PDF report, analyze the height balance factor and provide worst-case graphs.',
      courseId: 'crs-1',
      subject: 'Data Structures',
      deadline: '2026-07-10T23:59:59.000Z',
      points: 100,
      allowLate: true
    },
    {
      id: 'asg-2',
      title: 'Relational Schema Normalization Exercise',
      description: 'Evaluate the given unnormalized company dataset and design relational schemas matching 1NF, 2NF, and 3NF specifications. Attach a visual diagram of your entity relationship schema.',
      courseId: 'crs-1',
      subject: 'Database Management Systems',
      deadline: '2026-07-04T23:59:59.000Z',
      points: 50,
      allowLate: false
    }
  ],
  submissions: [
    {
      id: 'sub-1',
      assignmentId: 'asg-2',
      studentId: 'usr-student-1',
      fileUrl: '/uploads/normalization_submission.pdf',
      fileName: 'CSE_Normalization_Tiwary.pdf',
      submittedAt: '2026-07-04T18:30:00.000Z',
      grade: 48,
      feedback: 'Excellent breakdown of relational normal forms! Strong visual schema diagrams and excellent transition descriptions.',
      plagiarismScore: 8,
      aiAssistedFeedback: 'The submission correctly demonstrates the elimination of transitive dependencies to arrive at 3NF. The formatting of functional dependency sets is neat. Minor suggestions: Could explain Boyce-Codd Normal Form transition constraints.'
    }
  ],
  messages: [
    { id: 'm-1', senderId: 'usr-teacher-1', senderName: 'Prof. Sarah Jenkins', senderRole: 'teacher', receiverId: 'usr-student-1', receiverName: 'Himanshu Tiwary', content: 'Hi Himanshu, great job on your Database Normalization assignment! Let me know if you need resources for the AVL tree assignment.', timestamp: '2026-07-04T19:00:00.000Z', isRead: true },
    { id: 'm-2', senderId: 'usr-student-1', senderName: 'Himanshu Tiwary', senderRole: 'student', receiverId: 'usr-teacher-1', receiverName: 'Prof. Sarah Jenkins', content: 'Thank you Professor! I am working on the AVL tree now. I might need clarification on double left rotation cases.', timestamp: '2026-07-04T20:15:00.000Z', isRead: true }
  ],
  notifications: [
    { id: 'n-1', userId: 'usr-student-1', title: 'New Quiz Scheduled', message: 'Mid Semester Quiz on Data Structures has been scheduled for tomorrow.', type: 'quiz', isRead: false, createdAt: '2026-07-05T01:00:00.000Z' },
    { id: 'n-2', userId: 'usr-student-1', title: 'Assignment Evaluated', message: 'Your Database Normalization assignment has been graded. Grade: 48/50.', type: 'grade', isRead: false, createdAt: '2026-07-04T19:02:00.000Z' }
  ],
  attendance: [
    { id: 'att-ds-1', studentId: 'usr-student-1', courseId: 'crs-1', date: '2026-07-01', status: 'present' },
    { id: 'att-ds-2', studentId: 'usr-student-1', courseId: 'crs-1', date: '2026-07-02', status: 'present' },
    { id: 'att-ds-3', studentId: 'usr-student-1', courseId: 'crs-1', date: '2026-07-03', status: 'present' },
    { id: 'att-ds-4', studentId: 'usr-student-1', courseId: 'crs-1', date: '2026-07-04', status: 'late' },
    { id: 'att-ds-5', studentId: 'usr-student-2', courseId: 'crs-1', date: '2026-07-04', status: 'absent' }
  ],
  announcements: [
    { id: 'ann-1', title: 'Data Structures - Lab Exam Guidelines', content: 'Please review tree traversals and Graph BFS/DFS implementations before the lab exam scheduled next Wednesday. Open IDE permitted but no Internet access.', courseId: 'crs-1', authorName: 'Prof. Sarah Jenkins', createdAt: '2026-07-04T10:00:00.000Z' }
  ],
  auditLogs: [
    {
      id: 'log-startup',
      userId: 'usr-admin-1',
      userName: 'Dr. Arthur Pendelton',
      userEmail: 'admin@eduassess.ai',
      userRole: 'admin',
      action: 'SYSTEM_STARTUP',
      details: 'EduAssess AI system database initialized successfully',
      ipAddress: '127.0.0.1',
      timestamp: '2026-07-05T00:00:00.000Z'
    }
  ]
};

// Database class to read/write JSON
class Database {
  private data: DBStore = { ...defaultDB };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(fileContent);
        if (!this.data.auditLogs) {
          this.data.auditLogs = [];
        }
      } else {
        this.save();
      }
    } catch (error) {
      console.error('Failed to initialize local JSON DB:', error);
      this.data = { ...defaultDB };
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to save to JSON DB:', error);
    }
  }

  // Generic DB Operations
  public getStore(): DBStore {
    return this.data;
  }

  public getUsers(): User[] {
    return this.data.users;
  }

  public getCourses(): Course[] {
    return this.data.courses;
  }

  public getQuizzes(): Quiz[] {
    return this.data.quizzes;
  }

  public getAttempts(): QuizAttempt[] {
    return this.data.attempts;
  }

  public getAssignments(): Assignment[] {
    return this.data.assignments;
  }

  public getSubmissions(): Submission[] {
    return this.data.submissions;
  }

  public getMessages(): Message[] {
    return this.data.messages;
  }

  public getNotifications(): Notification[] {
    return this.data.notifications;
  }

  public getAttendance(): Attendance[] {
    return this.data.attendance;
  }

  public getAnnouncements(): Announcement[] {
    return this.data.announcements;
  }

  // Mutators
  public addUser(user: User) {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(userId: string, updates: Partial<User>) {
    const user = this.data.users.find((u) => u.id === userId);
    if (user) {
      Object.assign(user, updates);
      this.save();
    }
    return user;
  }

  public addCourse(course: Course) {
    this.data.courses.push(course);
    this.save();
    return course;
  }

  public addQuiz(quiz: Quiz) {
    this.data.quizzes.push(quiz);
    this.save();
    return quiz;
  }

  public updateQuiz(quizId: string, updates: Partial<Quiz>) {
    const quiz = this.data.quizzes.find((q) => q.id === quizId);
    if (quiz) {
      Object.assign(quiz, updates);
      this.save();
    }
    return quiz;
  }

  public addAttempt(attempt: QuizAttempt) {
    this.data.attempts.push(attempt);
    // Grant XP and Level up!
    const student = this.data.users.find(u => u.id === attempt.studentId && u.role === 'student');
    if (student && student.academicDetails) {
      student.academicDetails.xp = (student.academicDetails.xp || 0) + attempt.score * 10 + 50; // Points * 10 + bonus
      student.academicDetails.level = Math.floor((student.academicDetails.xp || 0) / 200) + 1;
      student.academicDetails.streak = (student.academicDetails.streak || 0) + 1;
    }
    this.save();
    return attempt;
  }

  public addAssignment(assignment: Assignment) {
    this.data.assignments.push(assignment);
    this.save();
    return assignment;
  }

  public addSubmission(submission: Submission) {
    // Check if duplicate submission exists
    const idx = this.data.submissions.findIndex(s => s.assignmentId === submission.assignmentId && s.studentId === submission.studentId);
    if (idx !== -1) {
      this.data.submissions[idx] = submission;
    } else {
      this.data.submissions.push(submission);
    }
    this.save();
    return submission;
  }

  public updateSubmission(submissionId: string, updates: Partial<Submission>) {
    const sub = this.data.submissions.find(s => s.id === submissionId);
    if (sub) {
      Object.assign(sub, updates);
      this.save();
    }
    return sub;
  }

  public addMessage(message: Message) {
    this.data.messages.push(message);
    this.save();
    return message;
  }

  public addNotification(notification: Notification) {
    this.data.notifications.push(notification);
    this.save();
    return notification;
  }

  public markNotificationsRead(userId: string) {
    this.data.notifications.forEach((n) => {
      if (n.userId === userId) n.isRead = true;
    });
    this.save();
  }

  public addAttendance(attendance: Attendance) {
    this.data.attendance.push(attendance);
    this.save();
    return attendance;
  }

  public addAnnouncement(announcement: Announcement) {
    this.data.announcements.push(announcement);
    this.save();
    return announcement;
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs || [];
  }

  public deleteAuditLogs(ids: string[]): void {
    if (!this.data.auditLogs) return;
    this.data.auditLogs = this.data.auditLogs.filter(log => !ids.includes(log.id));
    this.save();
  }

  public addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'> & { id?: string; timestamp?: string }) {
    if (!this.data.auditLogs) {
      this.data.auditLogs = [];
    }
    const newLog: AuditLog = {
      id: log.id || `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: log.userId,
      userName: log.userName,
      userEmail: log.userEmail,
      userRole: log.userRole,
      action: log.action,
      details: log.details,
      ipAddress: log.ipAddress || '127.0.0.1',
      timestamp: log.timestamp || new Date().toISOString()
    };
    this.data.auditLogs.unshift(newLog); // Put latest logs first
    this.save();
    return newLog;
  }
}

export const db = new Database();
