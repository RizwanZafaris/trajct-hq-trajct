import { pgTable, uuid, text, varchar, jsonb, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const auditActionEnum = pgEnum("audit_action", [
  "user.create", "user.update", "user.delete", "user.login", "user.logout", "user.lockout",
  "org.create", "org.update", "org.suspend",
  "member.invite", "member.role_change", "member.revoke",
  "billing.charge", "billing.refund", "billing.cap_adjust",
  "admin.action", "admin.breakglass",
  "screening.evaluate",
  "dsar.export", "dsar.delete",
  "feature_flag.change",
]);

/**
 * F-080 — Append-only audit log.
 * CRITICAL: The app DB role has NO UPDATE or DELETE privileges on this table (enforced by SQL grant).
 * This is tested in TC-080.2 (audit_log rejects UPDATE/DELETE).
 * hash_chain: SHA-256(prev_hash || entry_json) — tamper-evident (F-080.2).
 */
export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  action: auditActionEnum("action").notNull(),
  actorId: uuid("actor_id"),
  actorType: varchar("actor_type", { length: 50 }).notNull().default("user"),
  targetId: uuid("target_id"),
  targetType: varchar("target_type", { length: 100 }),
  orgId: uuid("org_id"),
  region: varchar("region", { length: 10 }),
  payload: jsonb("payload"),
  ipAddress: varchar("ip_address", { length: 45 }),
  hashChain: text("hash_chain").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AuditLogEntry = typeof auditLog.$inferSelect;
export type NewAuditLogEntry = typeof auditLog.$inferInsert;
