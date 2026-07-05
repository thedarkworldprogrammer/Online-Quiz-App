import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  UserModel,
  CourseModel,
  QuizModel,
  QuizAttemptModel,
  AssignmentModel,
  SubmissionModel,
  MessageModel,
  NotificationModel,
  AttendanceModel,
  AnnouncementModel,
  AuditLogModel
} from '../models/index';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eduassess';

// Seed Data
const seedUsers = [
  {
    id: 'usr-admin-1',
    name: 'Dr. Arthur Pendelton',
    email: 'admin@eduassess.ai',
    role: 'admin',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'usr-teacher-1',
    name: 'Prof. Sarah Jenkins',
    email: 'teacher@eduassess.ai',
    role: 'teacher',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'usr-student-1',
    name: 'Himanshu Tiwary',
    email: 'student@eduassess.ai',
    role: 'student',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
    academicDetails: {
      batch: 'A',
      semester: '4th Semester',
      rollNo: 'CS-2026-089',
      xp: 2450,
      level: 12,
      streak: 5
    }
  },
  {
    id: 'usr-student-2',
    name: 'Jane Doe',
    email: 'student2@eduassess.ai',
    role: 'student',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
    academicDetails: {
      batch: 'A',
      semester: '4th Semester',
      rollNo: 'CS-2026-092',
      xp: 1890,
      level: 9,
      streak: 3
    }
  }
];

const seedCourses = [
  {
    id: 'crs-1',
    name: 'Computer Science & Engineering',
    code: 'CSE-2026',
    semester: '4th Semester',
    batch: 'Batch A',
    session: '2025-26',
    subjects: ['Data Structures', 'Database Management Systems', 'Artificial Intelligence']
  },
  {
    id: 'crs-2',
    name: 'Electronics & Communication',
    code: 'ECE-2026',
    semester: '4th Semester',
    batch: 'Batch B',
    session: '2025-26',
    subjects: ['Digital Signal Processing', 'Microprocessors']
  }
];

const seedQuizzes = [
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
        correctAnswer: '1',
        points: 5,
        difficulty: 'medium'
      },
      {
        id: 'q-1-q2',
        type: 'mcq',
        text: 'Which of the following data structures operates on the First In First Out (FIFO) principle?',
        options: ['Stack', 'Queue', 'Graph', 'Tree'],
        correctAnswer: '1',
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
];

const seedAttempts = [
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
];

const seedAssignments = [
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
];

const seedSubmissions = [
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
];

const seedMessages = [
  {
    id: 'm-1',
    senderId: 'usr-teacher-1',
    senderName: 'Prof. Sarah Jenkins',
    senderRole: 'teacher',
    receiverId: 'usr-student-1',
    receiverName: 'Himanshu Tiwary',
    content: 'Hi Himanshu, great job on your Database Normalization assignment! Let me know if you need resources for the AVL tree assignment.',
    timestamp: '2026-07-04T19:00:00.000Z',
    isRead: true
  },
  {
    id: 'm-2',
    senderId: 'usr-student-1',
    senderName: 'Himanshu Tiwary',
    senderRole: 'student',
    receiverId: 'usr-teacher-1',
    receiverName: 'Prof. Sarah Jenkins',
    content: 'Thank you Professor! I am working on the AVL tree now. I might need clarification on double left rotation cases.',
    timestamp: '2026-07-04T20:15:00.000Z',
    isRead: true
  }
];

const seedNotifications = [
  {
    id: 'n-1',
    userId: 'usr-student-1',
    title: 'New Quiz Scheduled',
    message: 'Mid Semester Quiz on Data Structures has been scheduled for tomorrow.',
    type: 'quiz',
    isRead: false,
    createdAt: '2026-07-05T01:00:00.000Z'
  },
  {
    id: 'n-2',
    userId: 'usr-student-1',
    title: 'Assignment Evaluated',
    message: 'Your Database Normalization assignment has been graded. Grade: 48/50.',
    type: 'grade',
    isRead: false,
    createdAt: '2026-07-04T19:02:00.000Z'
  }
];

const seedAttendance = [
  { id: 'att-ds-1', studentId: 'usr-student-1', courseId: 'crs-1', date: '2026-07-01', status: 'present' },
  { id: 'att-ds-2', studentId: 'usr-student-1', courseId: 'crs-1', date: '2026-07-02', status: 'present' },
  { id: 'att-ds-3', studentId: 'usr-student-1', courseId: 'crs-1', date: '2026-07-03', status: 'present' },
  { id: 'att-ds-4', studentId: 'usr-student-1', courseId: 'crs-1', date: '2026-07-04', status: 'late' },
  { id: 'att-ds-5', studentId: 'usr-student-2', courseId: 'crs-1', date: '2026-07-04', status: 'absent' }
];

const seedAnnouncements = [
  {
    id: 'ann-1',
    title: 'Data Structures - Lab Exam Guidelines',
    content: 'Please review tree traversals and Graph BFS/DFS implementations before the lab exam scheduled next Wednesday. Open IDE permitted but no Internet access.',
    courseId: 'crs-1',
    authorName: 'Prof. Sarah Jenkins',
    createdAt: '2026-07-04T10:00:00.000Z'
  }
];

const seedAuditLogs = [
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
];

async function runSeeder() {
  console.log(`Connecting to MongoDB at: ${MONGODB_URI}`);
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connection established successfully.');

    // Clear existing collections
    console.log('Clearing existing data...');
    await Promise.all([
      UserModel.deleteMany({}),
      CourseModel.deleteMany({}),
      QuizModel.deleteMany({}),
      QuizAttemptModel.deleteMany({}),
      AssignmentModel.deleteMany({}),
      SubmissionModel.deleteMany({}),
      MessageModel.deleteMany({}),
      NotificationModel.deleteMany({}),
      AttendanceModel.deleteMany({}),
      AnnouncementModel.deleteMany({}),
      AuditLogModel.deleteMany({})
    ]);
    console.log('Cleared all collections.');

    // Insert new seed data
    console.log('Seeding new collections...');
    await Promise.all([
      UserModel.insertMany(seedUsers as any),
      CourseModel.insertMany(seedCourses as any),
      QuizModel.insertMany(seedQuizzes as any),
      QuizAttemptModel.insertMany(seedAttempts as any),
      AssignmentModel.insertMany(seedAssignments as any),
      SubmissionModel.insertMany(seedSubmissions as any),
      MessageModel.insertMany(seedMessages as any),
      NotificationModel.insertMany(seedNotifications as any),
      AttendanceModel.insertMany(seedAttendance as any),
      AnnouncementModel.insertMany(seedAnnouncements as any),
      AuditLogModel.insertMany(seedAuditLogs as any)
    ]);

    console.log('Seeding completed successfully!');
    console.log(`Successfully seeded:`);
    console.log(`- ${seedUsers.length} Users`);
    console.log(`- ${seedCourses.length} Courses`);
    console.log(`- ${seedQuizzes.length} Quizzes`);
    console.log(`- ${seedAttempts.length} Quiz Attempts`);
    console.log(`- ${seedAssignments.length} Assignments`);
    console.log(`- ${seedSubmissions.length} Submissions`);
    console.log(`- ${seedMessages.length} Messages`);
    console.log(`- ${seedNotifications.length} Notifications`);
    console.log(`- ${seedAttendance.length} Attendance Records`);
    console.log(`- ${seedAnnouncements.length} Announcements`);
    console.log(`- ${seedAuditLogs.length} Audit Logs`);

  } catch (error) {
    console.error('Error during database seeding:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  }
}

runSeeder();
