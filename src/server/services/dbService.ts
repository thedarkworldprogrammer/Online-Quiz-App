import mongoose from 'mongoose';
import { db } from '../db.js';
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
import {
  User,
  Course,
  Quiz,
  QuizAttempt,
  Assignment,
  Submission,
  Message,
  Notification,
  Attendance,
  Announcement,
  AuditLog
} from '../../types';

// Connection tracker
export let isMongoConnected = false;

export async function connectDatabase() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eduassess';
  try {
    console.log(`Connecting to MongoDB at: ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 4000
    });
    isMongoConnected = true;
    console.log('✅ Connected to MongoDB successfully with Mongoose models and proper indexing.');
  } catch (err: any) {
    console.warn(`⚠️ MongoDB connection skipped: ${err.message}`);
    console.warn('Fallback enabled: Operating on file-based JSON DB.');
    isMongoConnected = false;
  }
}

// Helper to check connection status
function useMongo(): boolean {
  return mongoose.connection.readyState === 1;
}

// Convert Mongoose Document to clean plain object
function cleanDoc<T>(doc: any): T {
  if (!doc) return null as any;
  const obj = doc.toObject ? doc.toObject({ virtuals: true }) : doc;
  if (obj._id) {
    obj.id = obj.id || obj._id.toString();
    delete obj._id;
  }
  delete obj.__v;
  return obj as T;
}

export const dbService = {
  // 1. USER OPERATIONS
  async getUsers(): Promise<User[]> {
    if (useMongo()) {
      const users = await UserModel.find();
      return users.map(u => cleanDoc<User>(u));
    }
    return db.getUsers();
  },

  async addUser(user: User): Promise<User> {
    if (useMongo()) {
      const created = await UserModel.create(user);
      return cleanDoc<User>(created);
    }
    db.addUser(user);
    return user;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    if (useMongo()) {
      const updated = await (UserModel as any).findOneAndUpdate({ id }, { $set: updates }, { new: true });
      return updated ? cleanDoc<User>(updated) : null;
    }
    return db.updateUser(id, updates) as any;
  },

  // 2. COURSE OPERATIONS
  async getCourses(): Promise<Course[]> {
    if (useMongo()) {
      const courses = await CourseModel.find();
      return courses.map(c => cleanDoc<Course>(c));
    }
    return db.getCourses();
  },

  async addCourse(course: Course): Promise<Course> {
    if (useMongo()) {
      const created = await CourseModel.create(course);
      return cleanDoc<Course>(created);
    }
    return db.addCourse(course);
  },

  // 3. QUIZ OPERATIONS
  async getQuizzes(): Promise<Quiz[]> {
    if (useMongo()) {
      const quizzes = await QuizModel.find();
      return quizzes.map(q => cleanDoc<Quiz>(q));
    }
    return db.getQuizzes();
  },

  async addQuiz(quiz: Quiz): Promise<Quiz> {
    if (useMongo()) {
      const created = await QuizModel.create(quiz);
      return cleanDoc<Quiz>(created);
    }
    return db.addQuiz(quiz);
  },

  // 4. ATTEMPT OPERATIONS
  async getAttempts(): Promise<QuizAttempt[]> {
    if (useMongo()) {
      const attempts = await QuizAttemptModel.find();
      return attempts.map(a => cleanDoc<QuizAttempt>(a));
    }
    return db.getAttempts();
  },

  async addAttempt(attempt: QuizAttempt): Promise<QuizAttempt> {
    if (useMongo()) {
      const created = await QuizAttemptModel.create(attempt);
      return cleanDoc<QuizAttempt>(created);
    }
    return db.addAttempt(attempt);
  },

  // 5. ASSIGNMENT OPERATIONS
  async getAssignments(): Promise<Assignment[]> {
    if (useMongo()) {
      const assignments = await AssignmentModel.find();
      return assignments.map(a => cleanDoc<Assignment>(a));
    }
    return db.getAssignments();
  },

  async addAssignment(asg: Assignment): Promise<Assignment> {
    if (useMongo()) {
      const created = await AssignmentModel.create(asg);
      return cleanDoc<Assignment>(created);
    }
    return db.addAssignment(asg);
  },

  // 6. SUBMISSION OPERATIONS
  async getSubmissions(): Promise<Submission[]> {
    if (useMongo()) {
      const submissions = await SubmissionModel.find();
      return submissions.map(s => cleanDoc<Submission>(s));
    }
    return db.getSubmissions();
  },

  async addSubmission(sub: Submission): Promise<Submission> {
    if (useMongo()) {
      const created = await SubmissionModel.create(sub);
      return cleanDoc<Submission>(created);
    }
    return db.addSubmission(sub);
  },

  async updateSubmission(id: string, updates: Partial<Submission>): Promise<Submission | null> {
    if (useMongo()) {
      const updated = await (SubmissionModel as any).findOneAndUpdate({ id }, { $set: updates }, { new: true });
      return updated ? cleanDoc<Submission>(updated) : null;
    }
    return db.updateSubmission(id, updates);
  },

  // 7. MESSAGE OPERATIONS
  async getMessages(): Promise<Message[]> {
    if (useMongo()) {
      const messages = await MessageModel.find();
      return messages.map(m => cleanDoc<Message>(m));
    }
    return db.getMessages();
  },

  async addMessage(msg: Message): Promise<Message> {
    if (useMongo()) {
      const created = await MessageModel.create(msg);
      return cleanDoc<Message>(created);
    }
    return db.addMessage(msg);
  },

  // 8. NOTIFICATION OPERATIONS
  async getNotifications(): Promise<Notification[]> {
    if (useMongo()) {
      const notifications = await NotificationModel.find();
      return notifications.map(n => cleanDoc<Notification>(n));
    }
    return db.getNotifications();
  },

  async addNotification(notif: Notification): Promise<Notification> {
    if (useMongo()) {
      const created = await NotificationModel.create(notif);
      return cleanDoc<Notification>(created);
    }
    return db.addNotification(notif);
  },

  async markNotificationsRead(userId: string): Promise<void> {
    if (useMongo()) {
      await (NotificationModel as any).updateMany({ userId }, { $set: { isRead: true } });
      return;
    }
    db.markNotificationsRead(userId);
  },

  // 9. ATTENDANCE OPERATIONS
  async getAttendance(): Promise<Attendance[]> {
    if (useMongo()) {
      const records = await AttendanceModel.find();
      return records.map(r => cleanDoc<Attendance>(r));
    }
    return db.getAttendance();
  },

  async addAttendance(att: Attendance): Promise<Attendance> {
    if (useMongo()) {
      const created = await AttendanceModel.create(att);
      return cleanDoc<Attendance>(created);
    }
    return db.addAttendance(att);
  },

  // 10. ANNOUNCEMENT OPERATIONS
  async getAnnouncements(): Promise<Announcement[]> {
    if (useMongo()) {
      const announcements = await AnnouncementModel.find();
      return announcements.map(a => cleanDoc<Announcement>(a));
    }
    return db.getAnnouncements();
  },

  async addAnnouncement(ann: Announcement): Promise<Announcement> {
    if (useMongo()) {
      const created = await AnnouncementModel.create(ann);
      return cleanDoc<Announcement>(created);
    }
    return db.addAnnouncement(ann);
  },

  // 11. AUDITLOG OPERATIONS
  async getAuditLogs(): Promise<AuditLog[]> {
    if (useMongo()) {
      const logs = await AuditLogModel.find().sort({ timestamp: -1 });
      return logs.map(l => cleanDoc<AuditLog>(l));
    }
    return db.getAuditLogs();
  },

  async deleteAuditLogs(ids: string[]): Promise<void> {
    if (useMongo()) {
      await (AuditLogModel as any).deleteMany({ id: { $in: ids } });
      return;
    }
    db.deleteAuditLogs(ids);
  },

  async addAuditLog(log: AuditLog): Promise<AuditLog> {
    if (useMongo()) {
      const created = await AuditLogModel.create(log);
      return cleanDoc<AuditLog>(created);
    }
    return db.addAuditLog(log);
  }
};
