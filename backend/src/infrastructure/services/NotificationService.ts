// src/infrastructure/services/NotificationService.ts
/**
 * Notification Service
 * Handles Firebase push notifications, email, and in-app notifications.
 * Supports multi-channel delivery: push, email, SMS.
 */
import admin from 'firebase-admin';
import nodemailer from 'nodemailer';
import { config } from '../../config/app.config';
import { logger } from '../../shared/utils/logger';
import { UserNotificationModel } from '../database/models/UserNotification.model';
import { UserModel } from '../database/models/User.model';

// ─── Types ────────────────────────────────────────────────────────────────────
export type NotificationType =
  | 'attendance_present'
  | 'attendance_absent'
  | 'attendance_late'
  | 'session_reminder'
  | 'session_location_change'
  | 'fee_reminder'
  | 'fee_paid'
  | 'fee_overdue'
  | 'performance_updated'
  | 'selection_updated'
  | 'transfer_request'
  | 'transfer_accepted'
  | 'transfer_rejected'
  | 'announcement';

export interface SendNotificationOptions {
  userIds: string[];
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  franchiseId?: string;
  channels?: ('push' | 'email' | 'sms')[];
  emailSubject?: string;
  emailHtml?: string;
}

// ─── Initialize Firebase Admin ────────────────────────────────────────────────
let firebaseInitialized = false;

const initFirebase = () => {
  if (firebaseInitialized) return;
  if (!config.firebase.projectId) {
    logger.warn('[NotificationService] Firebase not configured — push notifications disabled');
    return;
  }
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebase.projectId,
      clientEmail: config.firebase.clientEmail,
      privateKey: config.firebase.privateKey,
    }),
  });
  firebaseInitialized = true;
};

// ─── Email transporter ────────────────────────────────────────────────────────
const createMailTransporter = () => {
  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: false,
    auth: { user: config.email.user, pass: config.email.pass },
  });
};

// ─── Main service ─────────────────────────────────────────────────────────────
export class NotificationService {
  constructor() {
    // initFirebase();
  }

  /**
   * Send notification to one or more users via configured channels
   */
  async send(opts: SendNotificationOptions): Promise<void> {
    const channels = opts.channels ?? ['push'];

    // Fetch users in parallel
    const users = await UserModel.find({ _id: { $in: opts.userIds }, isActive: true }).select('email fcmTokens firstName');

    const tasks: Promise<void>[] = [];

    if (channels.includes('push')) {
      tasks.push(this.sendPush(users, opts));
    }
    if (channels.includes('email') && opts.emailSubject) {
      tasks.push(this.sendEmail(users, opts));
    }

    await Promise.allSettled(tasks);

    // Persist in-app notifications
    await this.persistNotifications(users.map((u) => u._id.toString()), opts);
  }

  /**
   * Send push notification via Firebase FCM
   */
  private async sendPush(users: any[], opts: SendNotificationOptions): Promise<void> {
    if (!firebaseInitialized) return;

    const allTokens: string[] = users.flatMap((u) => u.fcmTokens ?? []);
    if (allTokens.length === 0) return;

    // FCM allows max 500 tokens per request — batch them
    const BATCH_SIZE = 500;
    for (let i = 0; i < allTokens.length; i += BATCH_SIZE) {
      const batch = allTokens.slice(i, i + BATCH_SIZE);
      try {
        const response = await admin.messaging().sendEachForMulticast({
          tokens: batch,
          notification: { title: opts.title, body: opts.body },
          data: opts.data ?? {},
          android: {
            priority: 'high',
            notification: { channelId: 'football_franchise', sound: 'default' },
          },
          apns: {
            payload: { aps: { sound: 'default', badge: 1 } },
          },
        });

        // Remove stale tokens
        const staleTokens: string[] = [];
        response.responses.forEach((r, idx) => {
          if (!r.success && (r.error?.code === 'messaging/invalid-registration-token' ||
            r.error?.code === 'messaging/registration-token-not-registered')) {
            staleTokens.push(batch[idx]);
          }
        });

        if (staleTokens.length > 0) {
          await UserModel.updateMany(
            { fcmTokens: { $in: staleTokens } },
            { $pull: { fcmTokens: { $in: staleTokens } } }
          );
        }

        logger.info(`[NotificationService] Push sent: ${response.successCount}/${batch.length} delivered`);
      } catch (err) {
        logger.error('[NotificationService] FCM error:', err);
      }
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(users: any[], opts: SendNotificationOptions): Promise<void> {
    if (!config.email.user) return;

    const transporter = createMailTransporter();
    const emails = users.map((u) => u.email).filter(Boolean);
    if (emails.length === 0) return;

    try {
      await transporter.sendMail({
        from: `"${config.email.fromName}" <${config.email.from}>`,
        bcc: emails.join(','),
        subject: opts.emailSubject ?? opts.title,
        html: opts.emailHtml ?? `<p>${opts.body}</p>`,
      });
      logger.info(`[NotificationService] Email sent to ${emails.length} recipients`);
    } catch (err) {
      logger.error('[NotificationService] Email error:', err);
    }
  }

  /**
   * Persist notification records in MongoDB
   */
  private async persistNotifications(userIds: string[], opts: SendNotificationOptions): Promise<void> {
    try {
      const docs = userIds.map((userId) => ({
        userId,
        franchiseId: opts.franchiseId,
        type: opts.type,
        title: opts.title,
        body: opts.body,
        data: opts.data,
        isRead: false,
        sentVia: opts.channels ?? ['push'],
      }));
      await UserNotificationModel.insertMany(docs, { ordered: false });
    } catch (err) {
      logger.error('[NotificationService] Persist error:', err);
    }
  }

  // ─── Convenience methods ────────────────────────────────────────────────────

  async sendAttendanceAlert(guardianIds: string[], studentName: string, status: 'absent' | 'late', franchiseId: string) {
    const messages = {
      absent: { title: 'Absence Alert', body: `${studentName} has been marked absent from today's session.` },
      late: { title: 'Late Arrival', body: `${studentName} arrived late to today's session.` },
    };
    await this.send({
      userIds: guardianIds,
      type: `attendance_${status}` as NotificationType,
      ...messages[status],
      franchiseId,
      channels: ['push'],
    });
  }

  async sendSessionReminder(guardianIds: string[], sessionTime: string, locationName: string, locationUrl: string, franchiseId: string) {
    await this.send({
      userIds: guardianIds,
      type: 'session_reminder',
      title: "Today's Session Starting Soon",
      body: `Session at ${locationName} starts at ${sessionTime}. Tap to navigate.`,
      data: { locationUrl, sessionTime },
      franchiseId,
      channels: ['push'],
    });
  }

  async sendLocationChange(guardianIds: string[], newLocation: string, franchiseId: string) {
    await this.send({
      userIds: guardianIds,
      type: 'session_location_change',
      title: '⚠️ Location Changed',
      body: `Today's session location has changed to: ${newLocation}`,
      franchiseId,
      channels: ['push'],
    });
  }

  async sendFeeReminder(guardianIds: string[], studentName: string, amount: number, dueDate: string, franchiseId: string) {
    await this.send({
      userIds: guardianIds,
      type: 'fee_reminder',
      title: 'Fee Payment Reminder',
      body: `₹${amount.toLocaleString()} due for ${studentName} on ${dueDate}. Please pay to avoid disruption.`,
      franchiseId,
      channels: ['push', 'email'],
      emailSubject: `Fee Payment Due — ${studentName}`,
      emailHtml: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
          <h2 style="color:#0a0a0f;background:#ccff00;padding:12px 20px;margin:0">Football Franchise — Fee Reminder</h2>
          <div style="padding:20px">
            <p>Dear Guardian,</p>
            <p>A fee payment of <strong>₹${amount.toLocaleString()}</strong> for <strong>${studentName}</strong> is due on <strong>${dueDate}</strong>.</p>
            <p>Please log in to the Football Franchise app to make your payment and avoid any disruption to training.</p>
          </div>
        </div>
      `,
    });
  }

  async sendSelectionUpdate(userIds: string[], studentName: string, status: string, franchiseId: string) {
    await this.send({
      userIds,
      type: 'selection_updated',
      title: 'Selection Status Updated',
      body: `${studentName}'s selection status has been updated to: ${status}`,
      franchiseId,
      channels: ['push'],
    });
  }

  async sendTransferRequest(managerIds: string[], playerName: string, requestingFranchise: string) {
    await this.send({
      userIds: managerIds,
      type: 'transfer_request',
      title: 'New Transfer Request',
      body: `${requestingFranchise} has submitted a transfer request for ${playerName}.`,
      channels: ['push'],
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
