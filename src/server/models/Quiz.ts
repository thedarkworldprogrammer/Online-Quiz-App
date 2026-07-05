import mongoose, { Schema, Document } from 'mongoose';
import { Quiz } from '../../types';

export interface IQuizDocument extends Omit<Quiz, 'id'>, Document {
  id: string;
}

const QuestionSchema = new Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ['mcq', 'subjective', 'coding'],
    required: true
  },
  text: { type: String, required: true, trim: true },
  options: { type: [String], default: [] },
  correctAnswer: { type: String, trim: true },
  points: { type: Number, required: true, default: 1 },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  codingTemplate: { type: String, trim: true },
  testCases: [
    {
      input: { type: String },
      output: { type: String }
    }
  ]
});

const QuizSchema = new Schema<IQuizDocument>(
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
    questions: {
      type: [QuestionSchema],
      default: []
    },
    duration: {
      type: Number,
      required: true,
      default: 30 // minutes
    },
    negativeMarking: {
      type: Boolean,
      default: false
    },
    passPercentage: {
      type: Number,
      default: 40
    },
    maxAttempts: {
      type: Number,
      default: 1
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true
    },
    scheduledAt: {
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

// Compound index for course selection queries
QuizSchema.index({ courseId: 1, isPublished: 1 });

export const QuizModel = mongoose.models.Quiz || mongoose.model<IQuizDocument>('Quiz', QuizSchema);
