import mongoose, { Schema, Document } from 'mongoose';
import { QuizAttempt } from '../../types';

export interface IQuizAttemptDocument extends Omit<QuizAttempt, 'id'>, Document {
  id: string;
}

const QuizAttemptSchema = new Schema<IQuizAttemptDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    quizId: {
      type: String,
      required: true,
      index: true
    },
    studentId: {
      type: String,
      required: true,
      index: true
    },
    score: {
      type: Number,
      required: true,
      default: 0
    },
    totalPoints: {
      type: Number,
      required: true,
      default: 0
    },
    answers: {
      type: Map,
      of: String,
      default: {}
    },
    startedAt: {
      type: String,
      required: true
    },
    completedAt: {
      type: String,
      required: true
    },
    tabSwitches: {
      type: Number,
      default: 0
    },
    isFullScreenViolation: {
      type: Boolean,
      default: false
    },
    autoSubmitted: {
      type: Boolean,
      default: false
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

// Compound index to quickly find/verify student attempts on a particular quiz
QuizAttemptSchema.index({ studentId: 1, quizId: 1 });

export const QuizAttemptModel = mongoose.models.QuizAttempt || mongoose.model<IQuizAttemptDocument>('QuizAttempt', QuizAttemptSchema);
