import mongoose, { Schema, Document } from 'mongoose';
import { Attendance } from '../../types';

export interface IAttendanceDocument extends Omit<Attendance, 'id'>, Document {
  id: string;
}

const AttendanceSchema = new Schema<IAttendanceDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    studentId: {
      type: String,
      required: true,
      index: true
    },
    courseId: {
      type: String,
      required: true,
      index: true
    },
    date: {
      type: String, // e.g., '2026-07-05'
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Prevent duplicate attendance entries for the same student, course and day
AttendanceSchema.index({ studentId: 1, courseId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ courseId: 1, date: 1 });

export const AttendanceModel = mongoose.models.Attendance || mongoose.model<IAttendanceDocument>('Attendance', AttendanceSchema);
