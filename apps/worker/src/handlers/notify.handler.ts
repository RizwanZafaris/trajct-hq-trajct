/**
 * q.notify — Notification delivery (email via Resend, in-app, push).
 *
 * Job types:
 *   notify.diagnostic_ready  → F-001 diagnostic complete
 *   notify.tailor_ready      → F-002 tailored resume ready (or failed)
 *   notify.job_match         → F-032 new job match found
 *   notify.monitor_alert     → F-015 job monitor found new matches
 *   notify.follow_up_due     → F-020 follow-up due reminder
 *   notify.screening_invite  → F-034 candidate invited to screening
 *
 * All notifications are stored in the notifications table first.
 * Delivery is idempotent: duplicate job → skip if already sent.
 */

import { Worker, type Job } from "bullmq";
import { QUEUE_NAMES, getRedisConnection } from "../queues.js";

export type NotifyJobType =
  | "notify.diagnostic_ready"
  | "notify.tailor_ready"
  | "notify.job_match"
  | "notify.monitor_alert"
  | "notify.follow_up_due"
  | "notify.screening_invite";

export interface NotifyJobData {
  type: NotifyJobType;
  userId: string;
  channel: "email" | "in_app" | "push";
  title: string;
  body: string;
  payload?: object;
  idempotencyKey: string;
}

export function createNotifyWorker(): Worker<NotifyJobData> {
  const connection = getRedisConnection();

  return new Worker<NotifyJobData>(
    QUEUE_NAMES.NOTIFY,
    async (job: Job<NotifyJobData>) => {
      const { type, userId, channel } = job.data;
      console.log(`[notify] Job ${job.id} type=${type} user=${userId} channel=${channel}`);

      // 1. Check idempotency: if notifications row already has sent_at → skip
      // 2. INSERT INTO notifications (user_id, type, channel, title, body, payload)
      // 3. Send via appropriate channel (Resend for email, etc.)
      // 4. UPDATE notifications SET sent_at = now()

      // TODO: Implement per-channel delivery
      console.log(`[notify] Stub: would send "${job.data.title}" to user ${userId} via ${channel}`);
    },
    { connection, concurrency: 50 }  // notifications are cheap and high-volume
  );
}
