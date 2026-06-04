import { pgTable, uuid, text, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.js";

/**
 * F-034.2 / F-080 — Consent records.
 * Immutable once written — no UPDATE grants on this table.
 * Referenced by decision_log entries (consentRef must be non-null for any automated decision).
 */
export const consentRecords = pgTable("consent_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  orgId: uuid("org_id"),
  jobId: uuid("job_id"),
  region: varchar("region", { length: 10 }).notNull(),
  purposes: jsonb("purposes").notNull().$type<string[]>(),
  capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
  ipAddress: varchar("ip_address", { length: 45 }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  revokedReason: text("revoked_reason"),
});

export type ConsentRecord = typeof consentRecords.$inferSelect;
export type NewConsentRecord = typeof consentRecords.$inferInsert;
