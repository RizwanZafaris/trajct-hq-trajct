import { pgTable, uuid, varchar, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const orgTierEnum = pgEnum("org_tier", ["free", "starter", "growth", "enterprise"]);
export const verificationStatusEnum = pgEnum("verification_status", ["unverified", "email_verified", "domain_verified", "manual_verified"]);

/**
 * F-070 — Orgs (employer tenants).
 * RLS: members can only see/edit their own org (policy: orgs_member_rls).
 * Each org is a tenant — all tenant data is scoped by org_id in RLS policies.
 */
export const orgs = pgTable("orgs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  domain: varchar("domain", { length: 255 }),
  tier: orgTierEnum("tier").notNull().default("free"),
  verificationStatus: verificationStatusEnum("verification_status").notNull().default("unverified"),
  logoUrl: text("logo_url"),
  region: varchar("region", { length: 10 }).notNull().default("global"),
  isActive: boolean("is_active").notNull().default(true),
  isSuspended: boolean("is_suspended").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export type Org = typeof orgs.$inferSelect;
export type NewOrg = typeof orgs.$inferInsert;
