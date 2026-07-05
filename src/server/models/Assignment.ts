import mongoose, { Schema, Document } from 'mongoose';
import { Assignment } from '../../types';

export interface IAssignmentDocument extends Omit<Assignment, 'id'>, Document {
  id: string;
}

const AssignmentSchema = new Schema<IAssignmentDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    courseId: {
      type: String,
      required: true,
      index: true
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    deadline: {
      type: String,
      required: true
    },
    points: {
      type: Number,
      required: true,
      default: 100
    },
    allowLate: {
      type: Boolean,
      default: false
    },
    fileUrl: {
      type: String
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

AssignmentSchema.index({ courseId: 1, deadline: 1 });

export const AssignmentModel = mongoose.models.Assignment || mongoose.model<IAssignmentDocument>('Assignment', AssignmentSchema);
