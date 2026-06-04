/**
 * F-071 — Plans, entitlements & feature gating.
 * Server-side only — client trust is NEVER accepted (FR-071.2).
 * Feature flags (F-085) gate region-specific features.
 */

import postgres from "postgres";

export interface EntitlementCheck {
  accountId: string;
  feature: string;
}

export interface EntitlementResult {
  entitled: boolean;
  quotaRemaining?: number;
  tier?: "free" | "paid";
}

// Features that require no payment (always allowed)
const FREE_FEATURES = new Set([
  "diagnostic",      // F-001 — free, no auth required even
  "jd.generate",     // F-030 — employer front door, free forever
  "profile.read",    // profile read
  "profile.write",   // profile write
]);

// Paid features by plan tier
const PAID_FEATURES: Record<string, string[]> = {
  free: [],
  paid: ["resume.tailor", "prep.session", "mock.interview", "linkedin.optimize", "linkedin.post", "rate_job", "offer.evaluate"],
};

let _sql: ReturnType<typeof postgres> | null = null;
function getSql(): ReturnType<typeof postgres> {
  if (!_sql) {
    const url = process.env["DATABASE_URL"];
    if (!url) throw new Error("DATABASE_URL required");
    _sql = postgres(url, { max: 3 });
  }
  return _sql;
}

export async function checkEntitlement(check: EntitlementCheck): Promise<EntitlementResult> {
  // Free features are always entitled
  if (FREE_FEATURES.has(check.feature)) {
    return { entitled: true, tier: "free" };
  }

  const sql = getSql();

  // Check if user has an active paid subscription
  // Simplified: check user_type and any active ledger entries (real: subscription table)
  const [user] = await sql`
    SELECT u.user_type,
           (SELECT COUNT(*) FROM billing_ledger bl WHERE bl.account_id = u.id AND bl.psp_status = 'succeeded') AS paid_count
    FROM users u
    WHERE u.id = ${check.accountId} AND u.deleted_at IS NULL
    LIMIT 1
  `;

  if (!user) return { entitled: false, tier: "free" };

  const paidCount = parseInt(user.paid_count as string, 10);
  const hasPaidPlan = paidCount > 0;

  if (!hasPaidPlan) {
    const isPaywalled = (PAID_FEATURES["paid"] ?? []).includes(check.feature);
    return { entitled: !isPaywalled, tier: "free", quotaRemaining: 0 };
  }

  return { entitled: true, tier: "paid", quotaRemaining: 999 };
}

/**
 * F-085 — Feature flag check.
 * Server-authoritative — reads from feature_flags table + Redis TTL cache.
 * If flag service is down, fail safe to the safe default (FR-085.5).
 */
export async function checkFeatureFlag(
  flagKey: string,
  context: { region?: string; orgId?: string; tier?: string }
): Promise<boolean> {
  const sql = getSql();

  try {
    const [flag] = await sql`
      SELECT enabled, allowed_regions, allowed_tiers, allowed_org_ids
      FROM feature_flags
      WHERE key = ${flagKey}
      LIMIT 1
    `;

    if (!flag) return false; // Flag not defined → disabled (safe default)
    if (!flag.enabled) return false;

    const regions  = (flag.allowed_regions as string[] | null);
    const tiers    = (flag.allowed_tiers   as string[] | null);
    const orgs     = (flag.allowed_org_ids as string[] | null);

    if (regions?.length && context.region && !regions.includes(context.region)) return false;
    if (tiers?.length  && context.tier   && !tiers.includes(context.tier))     return false;
    if (orgs?.length   && context.orgId  && !orgs.includes(context.orgId))     return false;

    return true;
  } catch {
    // Flag service down → fail safe (FR-085.5)
    // Screening is always safe-default OFF
    return false;
  }
}
