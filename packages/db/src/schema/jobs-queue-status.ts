import { pgTable, uuid, varchar, text, integer, jsonb, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const jobStatusEnum = pgEnum("job_status", [
  "pending", "active", "completed", "failed", "delayed", "waiting-children"
]);

export const queueNameEnum = pgEnum("queue_name", [
  "q.ingest", "q.ai.frontier", "q.ai.utility", "q.embed",
  "q.notify", "q.research", "q.compliance"
]);

/**
 * F-076 §7 — Job queue status.
 * Postgres is the record of truth; Redis is the transport (BullMQ).
 * This table allows the UI to show job progress and allows recovery after Redis flush.
 */
export const jobsQueueStatus = pgTable("jobs_queue_status", {
  id: uuid("id").primaryKey().defaultRandom(),
  bullmqJobId: varchar("bullmq_job_id", { length: 255 }),
  queueName: queueNameEnum("queue_name").notNull(),
  jobType: varchar("job_type", { length: 100 }).notNull(),
  accountId: uuid("account_id").references(() => users.id, { onDelete: "set null" }),
  orgId: uuid("org_id"),
  idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull().unique(),
  status: jobStatusEnum("status").notNull().default("pending"),
  progress: integer("progress").notNull().default(0),
  resultRef: text("result_ref"),
  errorCode: varchar("error_code", { length: 100 }),
  errorMessage: text("error_message"),
  attemptsMade: integer("attempts_made").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(3),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  failedAt: timestamp("failed_at", { withTimezone: true }),
});

export type JobQueueStatus = typeof jobsQueueStatus.$inferSelect;
export type NewJobQueueStatus = typeof jobsQueueStatus.$inferInsert;
