import { pgTable, uuid, varchar, boolean, jsonb, timestamp, text } from "drizzle-orm/pg-core";

/**
 * F-085 — Feature flags.
 * Server-side evaluated. Client override attempts are ignored (FR-085.3).
 * Kill-switches must propagate fast — bounded TTL in cache.
 * Flag service failure falls back to safe defaults (FR-085.5): e.g., screening=false.
 *
 * ADR-004: Using a DB-backed flags table at MVP instead of an external provider.
 * Revisit when percentage-rollout UX or real-time propagation becomes a bottleneck.
 */
export const featureFlags = pgTable("feature_flags", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 200 }).notNull().unique(),
  enabled: boolean("enabled").notNull().default(false),
  description: text("description"),
  allowedRegions: jsonb("allowed_regions").$type<string[]>(),
  allowedTiers: jsonb("allowed_tiers").$type<string[]>(),
  allowedOrgIds: jsonb("allowed_org_ids").$type<string[]>(),
  rolloutPercent: varchar("rollout_percent", { length: 5 }).default("0"),
  metadata: jsonb("metadata"),
  lastChangedBy: uuid("last_changed_by"),
  lastChangedReason: text("last_changed_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type NewFeatureFlag = typeof featureFlags.$inferInsert;
