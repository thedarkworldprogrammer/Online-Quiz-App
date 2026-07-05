import mongoose, { Schema, Document } from 'mongoose';
import { Announcement } from '../../types';

export interface IAnnouncementDocument extends Omit<Announcement, 'id'>, Document {
  id: string;
}

const AnnouncementSchema = new Schema<IAnnouncementDocument>(
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
    content: {
      type: String,
      required: true,
      trim: true
    },
    courseId: {
      type: String,
      required: true,
      index: true
    },
    authorName: {
      type: String,
      required: true
    },
    createdAt: {
      type: String,
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

AnnouncementSchema.index({ courseId: 1, createdAt: -1 });

export const AnnouncementModel = mongoose.models.Announcement || mongoose.model<IAnnouncementDocument>('Announcement', AnnouncementSchema);
