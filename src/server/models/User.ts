import mongoose, { Schema, Document } from 'mongoose';
import { User } from '../../types';

export interface IUserDocument extends Omit<User, 'id'>, Document {
  id: string;
  passwordHash?: string;
  otpCode?: string;
  otpExpires?: Date;
}

const UserSchema = new Schema<IUserDocument>(
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
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    role: {
      type: String,
      enum: ['admin', 'teacher', 'student'],
      required: true
    },
    avatar: {
      type: String
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
      index: true
    },
    academicDetails: {
      batch: { type: String, trim: true },
      semester: { type: String, trim: true },
      rollNo: { type: String, trim: true },
      xp: { type: Number, default: 0 },
      level: { type: Number, default: 1 },
      streak: { type: Number, default: 0 }
    },
    passwordHash: {
      type: String
    },
    otpCode: {
      type: String
    },
    otpExpires: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        delete ret.otpCode;
        delete ret.otpExpires;
        return ret;
      }
    }
  }
);

// Optimize query performance for combinations
UserSchema.index({ role: 1, status: 1 });

export const UserModel = mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);
