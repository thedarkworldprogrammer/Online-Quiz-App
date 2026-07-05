import mongoose, { Schema, Document } from 'mongoose';
import { Course } from '../../types';

export interface ICourseDocument extends Omit<Course, 'id'>, Document {
  id: string;
}

const CourseSchema = new Schema<ICourseDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    semester: {
      type: String,
      required: true,
      trim: true
    },
    batch: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    session: {
      type: String,
      required: true,
      trim: true
    },
    subjects: {
      type: [String],
      default: []
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

// Compound index for finding courses in a specific batch and semester
CourseSchema.index({ batch: 1, semester: 1 });

export const CourseModel = mongoose.models.Course || mongoose.model<ICourseDocument>('Course', CourseSchema);
