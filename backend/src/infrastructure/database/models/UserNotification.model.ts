// src/infrastructure/database/models/UserNotification.model.ts
// Per-user notification feed (push/in-app/email delivery log), distinct from
// the audience-based bulk "Notification" model in Notification.model.ts.
// IMPORTANT: kept in its own file/collection name to avoid mongoose
// OverwriteModelError — do not redeclare a model under the name 'Notification'
// anywhere else in the codebase.
import mongoose, { Schema, Document } from 'mongoose';

export interface UserNotificationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  franchiseId?: mongoose.Types.ObjectId;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  sentVia: string[];
  createdAt: Date;
}

const UserNotificationSchema = new Schema<UserNotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    franchiseId: { type: Schema.Types.ObjectId, ref: 'Franchise', index: true },
    type: { type: String, required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: Schema.Types.Mixed,
    isRead: { type: Boolean, default: false, index: true },
    sentVia: [{ type: String, enum: ['push', 'email', 'sms'] }],
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

UserNotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const UserNotificationModel = mongoose.model<UserNotificationDocument>(
  'UserNotification',
  UserNotificationSchema,
);
