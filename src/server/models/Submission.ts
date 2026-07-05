import mongoose, { Schema, Document } from 'mongoose';
import { Submission } from '../../types';

export interface ISubmissionDocument extends Omit<Submission, 'id'>, Document {
  id: string;
}

const SubmissionSchema = new Schema<ISubmissionDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    assignmentId: {
      type: String,
      required: true,
      index: true
    },
    studentId: {
      type: String,
      required: true,
      index: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    submittedAt: {
      type: String,
      required: true
    },
    grade: {
      type: Number
    },
    feedback: {
      type: String,
      trim: true
    },
    plagiarismScore: {
      type: Number
    },
    aiAssistedFeedback: {
      type: String,
      trim: true
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

// Prevent redundant submissions / quick tracking
SubmissionSchema.index({ studentId: 1, assignmentId: 1 }, { unique: true });

export const SubmissionModel = mongoose.models.Submission || mongoose.model<ISubmissionDocument>('Submission', SubmissionSchema);
