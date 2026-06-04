import { pgTable, uuid, varchar, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const userTypeEnum = pgEnum("user_type", ["candidate", "employer", "admin"]);

/**
 * F-070 — Users table.
 * RLS: users can only see/edit their own row (policy: users_self_rls).
 * Passwords are hashed with Argon2id — NEVER stored plaintext (FR-070.2).
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash"),
  userType: userTypeEnum("user_type").notNull(),
  displayName: varchar("display_name", { length: 255 }),
  emailVerified: boolean("email_verified").notNull().default(false),
  mfaEnabled: boolean("mfa_enabled").notNull().default(false),
  mfaTotpSecret: text("mfa_totp_secret"),
  isActive: boolean("is_active").notNull().default(true),
  isSuspended: boolean("is_suspended").notNull().default(false),
  suspendedReason: text("suspended_reason"),
  failedLoginCount: uuid("failed_login_count"),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
