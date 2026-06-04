import { pgTable, uuid, timestamp, pgEnum, primaryKey, unique } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { orgs } from "./orgs.js";

export const orgRoleEnum = pgEnum("org_role", ["admin", "recruiter", "hiring_manager", "viewer"]);

/**
 * F-072e — Org memberships with RBAC roles.
 * RLS: users see only memberships for their org (policy: org_memberships_member_rls).
 * No self-escalation: role changes require admin + audit log.
 */
export const orgMemberships = pgTable(
  "org_memberships",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    role: orgRoleEnum("role").notNull().default("viewer"),
    invitedBy: uuid("invited_by").references(() => users.id),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.orgId] }),
    uniqueActiveRole: unique("org_memberships_active_unique").on(table.userId, table.orgId),
  })
);

export type OrgMembership = typeof orgMemberships.$inferSelect;
export type NewOrgMembership = typeof orgMemberships.$inferInsert;
