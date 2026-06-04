import { pgTable, uuid, varchar, numeric, jsonb, timestamp, pgEnum, unique } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const taskTierEnum = pgEnum("task_tier", ["frontier", "mid", "utility", "embed"]);

/**
 * F-076 — Usage events (metering).
 * idempotency_key UNIQUE ensures no double-count on retry (FR-076.2, TC-076.2).
 * Every generation must produce exactly one usage event.
 */
export const usageEvents = pgTable(
  "usage_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    orgId: uuid("org_id"),
    action: varchar("action", { length: 100 }).notNull(),
    costCents: numeric("cost_cents", { precision: 12, scale: 4 }).notNull(),
    taskTier: taskTierEnum("task_tier"),
    modelVersion: varchar("model_version", { length: 100 }),
    promptVersion: varchar("prompt_version", { length: 100 }),
    idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull(),
    metadata: jsonb("metadata"),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueIdempotency: unique("usage_events_idempotency_key_unique").on(table.idempotencyKey),
  })
);

export type UsageEvent = typeof usageEvents.$inferSelect;
export type NewUsageEvent = typeof usageEvents.$inferInsert;
