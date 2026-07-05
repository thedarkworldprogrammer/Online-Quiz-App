import mongoose, { Schema, Document } from 'mongoose';
import { Message } from '../../types';

export interface IMessageDocument extends Omit<Message, 'id'>, Document {
  id: string;
}

const MessageSchema = new Schema<IMessageDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    senderId: {
      type: String,
      required: true,
      index: true
    },
    senderName: {
      type: String,
      required: true
    },
    senderRole: {
      type: String,
      required: true
    },
    receiverId: {
      type: String,
      required: true,
      index: true
    },
    receiverName: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    timestamp: {
      type: String,
      required: true
    },
    isRead: {
      type: Boolean,
      default: false,
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

// Optimize messaging queries between two users
MessageSchema.index({ senderId: 1, receiverId: 1, timestamp: -1 });
MessageSchema.index({ receiverId: 1, isRead: 1 });

export const MessageModel = mongoose.models.Message || mongoose.model<IMessageDocument>('Message', MessageSchema);
