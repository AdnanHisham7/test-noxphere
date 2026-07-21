// src/infrastructure/services/SchedulerService.ts
/**
 * Scheduler Service
 * Handles timed jobs:
 * - Pre-session location & time alerts to guardians
 * - Post-session pickup alerts
 * - Fee overdue reminders (3-day, same-day, post-due)
 * Uses Bull queue backed by Redis for reliability.
 */
import Queue from 'bull';
import { config } from '../../config/app.config';
import { logger } from '../../shared/utils/logger';
import { notificationService } from './NotificationService';
import { FranchiseModel } from '../database/models/Franchise.model';
import { StudentModel } from '../database/models/Student.model';
import { FeeModel } from '../database/models/Fee.model';
import { UserModel } from '../database/models/User.model';

// ─── Queues ───────────────────────────────────────────────────────────────────
const sessionReminderQueue = new Queue('session-reminders', config.redis.url);
const feeReminderQueue = new Queue('fee-reminders', config.redis.url);

// ─── Session Reminder Processor ───────────────────────────────────────────────
sessionReminderQueue.process(async (job) => {
  const { franchiseId, type } = job.data; // type: 'pre' | 'post'

  try {
    const franchise = await FranchiseModel.findById(franchiseId);
    if (!franchise || !franchise.isActive) return;

    // Get all guardians for this franchise
    const students = await StudentModel.find({ franchiseId, isActive: true }).select('guardianIds');
    const allGuardianIds = [...new Set(students.flatMap((s) => s.guardianIds.map((id) => id.toString())))];
    if (allGuardianIds.length === 0) return;

    if (type === 'pre') {
      const sessionTimes = franchise.sessionTimes;
      const today = new Date().getDay();
      const todaySession = sessionTimes.find((s) => s.dayOfWeek === today);
      if (!todaySession) return;

      const locationUrl = `https://maps.google.com/?q=${franchise.location.latitude},${franchise.location.longitude}`;
      await notificationService.sendSessionReminder(
        allGuardianIds,
        todaySession.startTime,
        franchise.location.name,
        locationUrl,
        franchiseId
      );
      logger.info(`[Scheduler] Pre-session alert sent to ${allGuardianIds.length} guardians for franchise ${franchiseId}`);
    } else if (type === 'post') {
      await notificationService.send({
        userIds: allGuardianIds,
        type: 'session_reminder',
        title: 'Session Ending Soon',
        body: `Training at ${franchise.location.name} is ending. Please head to the pickup point.`,
        franchiseId,
        channels: ['push'],
      });
      logger.info(`[Scheduler] Post-session alert sent to ${allGuardianIds.length} guardians for franchise ${franchiseId}`);
    }
  } catch (err) {
    logger.error('[Scheduler] Session reminder error:', err);
    throw err; // Bull will retry
  }
});

// ─── Fee Reminder Processor ───────────────────────────────────────────────────
feeReminderQueue.process(async (job) => {
  const { feeId } = job.data;

  try {
    const fee = await FeeModel.findById(feeId).populate('studentId');
    if (!fee) return;

    const student = fee.studentId as any;
    const guardians = await UserModel.find({ _id: { $in: student.guardianIds } }).select('_id');
    const guardianIds = guardians.map((g) => g._id.toString());
    if (guardianIds.length === 0) return;

    // Find the overdue/pending installment
    const pendingInstallment = fee.installments.find(
      (inst) => inst.status === 'pending' || inst.status === 'overdue'
    );
    if (!pendingInstallment) return;

    await notificationService.sendFeeReminder(
      guardianIds,
      `${student.firstName} ${student.lastName}`,
      pendingInstallment.amount,
      pendingInstallment.dueDate.toLocaleDateString('en-IN'),
      fee.franchiseId.toString()
    );

    // Update reminder count
    pendingInstallment.reminderSentCount += 1;
    pendingInstallment.lastReminderAt = new Date();
    await fee.save();

    logger.info(`[Scheduler] Fee reminder sent for student ${student.firstName} ${student.lastName}`);
  } catch (err) {
    logger.error('[Scheduler] Fee reminder error:', err);
    throw err;
  }
});

// ─── Scheduler API ────────────────────────────────────────────────────────────
export class SchedulerService {
  /**
   * Schedule pre-session and post-session alerts for a franchise
   * Called when a franchise session is configured or updated.
   */
  async scheduleFranchiseAlerts(franchiseId: string): Promise<void> {
    const franchise = await FranchiseModel.findById(franchiseId);
    if (!franchise || !franchise.isActive) return;

    const now = new Date();
    const today = now.getDay();

    for (const session of franchise.sessionTimes) {
      if (session.dayOfWeek !== today) continue;

      const [startHour, startMin] = session.startTime.split(':').map(Number);
      const [endHour, endMin] = session.endTime.split(':').map(Number);

      const sessionStart = new Date();
      sessionStart.setHours(startHour, startMin, 0, 0);

      const sessionEnd = new Date();
      sessionEnd.setHours(endHour, endMin, 0, 0);

      const preAlertTime = new Date(sessionStart.getTime() - franchise.alertBeforeMinutes * 60_000);
      const postAlertTime = new Date(sessionEnd.getTime() + franchise.notificationAlertAfterMinutes * 60_000);

      const preDelay = preAlertTime.getTime() - now.getTime();
      const postDelay = postAlertTime.getTime() - now.getTime();

      if (preDelay > 0) {
        await sessionReminderQueue.add({ franchiseId, type: 'pre' }, { delay: preDelay, jobId: `pre-${franchiseId}-${today}` });
        logger.info(`[Scheduler] Pre-session alert scheduled in ${Math.round(preDelay / 60_000)} minutes`);
      }

      if (postDelay > 0) {
        await sessionReminderQueue.add({ franchiseId, type: 'post' }, { delay: postDelay, jobId: `post-${franchiseId}-${today}` });
        logger.info(`[Scheduler] Post-session alert scheduled in ${Math.round(postDelay / 60_000)} minutes`);
      }
    }
  }

  /**
   * Schedule fee reminders for a specific fee record
   */
  async scheduleFeeReminders(feeId: string, dueDate: Date): Promise<void> {
    const now = new Date();

    // 3 days before
    const threeDaysBefore = new Date(dueDate.getTime() - 3 * 24 * 60 * 60_000);
    if (threeDaysBefore > now) {
      await feeReminderQueue.add({ feeId }, {
        delay: threeDaysBefore.getTime() - now.getTime(),
        jobId: `fee-3day-${feeId}`,
      });
    }

    // On due date (morning)
    const onDueDate = new Date(dueDate);
    onDueDate.setHours(9, 0, 0, 0);
    if (onDueDate > now) {
      await feeReminderQueue.add({ feeId }, {
        delay: onDueDate.getTime() - now.getTime(),
        jobId: `fee-due-${feeId}`,
      });
    }

    // 3 days after (overdue)
    const threeDaysAfter = new Date(dueDate.getTime() + 3 * 24 * 60 * 60_000);
    if (threeDaysAfter > now) {
      await feeReminderQueue.add({ feeId }, {
        delay: threeDaysAfter.getTime() - now.getTime(),
        jobId: `fee-overdue-${feeId}`,
        repeat: { every: 3 * 24 * 60 * 60_000, limit: 3 }, // repeat 3x
      });
    }

    logger.info(`[Scheduler] Fee reminders scheduled for fee ${feeId}`);
  }

  /**
   * Initialize daily scheduling of all active franchises
   * Run once at startup, then daily via cron
   */
  async initDailySchedule(): Promise<void> {
    const activeFranchises = await FranchiseModel.find({ isActive: true }).select('_id');
    for (const franchise of activeFranchises) {
      await this.scheduleFranchiseAlerts(franchise._id.toString());
    }
    logger.info(`[Scheduler] Daily schedule initialized for ${activeFranchises.length} active franchises`);
  }

  /**
   * Cancel alerts for a franchise (e.g., session cancelled)
   */
  async cancelFranchiseAlerts(franchiseId: string): Promise<void> {
    const today = new Date().getDay();
    const preJob = await sessionReminderQueue.getJob(`pre-${franchiseId}-${today}`);
    const postJob = await sessionReminderQueue.getJob(`post-${franchiseId}-${today}`);
    if (preJob) await preJob.remove();
    if (postJob) await postJob.remove();
    logger.info(`[Scheduler] Cancelled alerts for franchise ${franchiseId}`);
  }
}

export const schedulerService = new SchedulerService();
