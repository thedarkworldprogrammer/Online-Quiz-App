import mongoose, { Schema, Document } from 'mongoose';
import { AuditLog } from '../../types';

export interface IAuditLogDocument extends Omit<AuditLog, 'id'>, Document {
  id: string;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    userName: {
      type: String,
      required: true
    },
    userEmail: {
      type: String,
      required: true
    },
    userRole: {
      type: String,
      enum: ['admin', 'teacher', 'student'],
      required: true
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    details: {
      type: String,
      trim: true
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1'
    },
    timestamp: {
      type: String,
      required: true,
      index: true
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

// Optimize sorting and auditing queries
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });

export const AuditLogModel = mongoose.models.AuditLog || mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);
