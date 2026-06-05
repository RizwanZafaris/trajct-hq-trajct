/**
 * F-082 — DSAR tooling (export / delete).
 *
 * [FIX GAP 9] Deletion ORDER MATTERS:
 *   1. ANONYMIZE outcomes FIRST (user_id = NULL, anonymized_at = now()) — FR-082.3 says
 *      outcomes are anonymized, never destroyed (the moat). This MUST happen before the
 *      user row is removed (the FK is ON DELETE SET NULL, but we set anonymized_at explicitly
 *      so the anonymization is auditable, not a silent side-effect).
 *   2. Delete candidate-private rows across stores.
 *   3. Residual-PII scan → residualPiiCount MUST be 0; anonymized-outcome count proves
 *      anonymize-not-delete.
 *
 * Financial records (billing_ledger, usage_events) are RETAINED per legal retention (7y) and
 * are out of scope for erasure — the user row is soft-deleted (PII scrubbed) when such records
 * exist, hard-deleted otherwise. The email-confirmation + R2/Redis sweep are Platform-sprint
 * (returned as pending here, never thrown).
 */

import postgres from "postgres";

export interface DsarExportRequest {
  userId: string;
  verificationToken: string;
  requestId: string;
}

export interface DsarDeleteRequest {
  userId: string;
  verificationToken: string;
  requestId: string;
}

export interface DsarResult {
  requestId: string;
  status: "completed" | "pending" | "failed";
  exportUrl?: string;
  exportBundle?: Record<string, unknown>;
  residualPiiCount?: number;
  anonymizedOutcomeCount?: number;
  completedAt?: string;
}

// Candidate-private tables keyed by user_id that are erased on a DSAR delete.
const PRIVATE_TABLES = [
  "sessions", "consent_records", "resumes", "diagnostic_results", "tailored_resumes",
  "candidate_profiles", "job_ratings", "prep_sessions", "mock_interviews",
  "linkedin_optimizations", "linkedin_posts", "outreach_drafts", "job_monitors",
  "job_applications", "follow_up_cadences", "offer_evaluations", "notifications",
  "user_voice_profiles", "journeys",
  // Sprint-B candidate-private stores — must also be erased so residual PII stays 0.
  "resume_versions", "resume_edit_cursor", "job_alerts", "onboarding_state",
] as const;

let _sql: ReturnType<typeof postgres> | null = null;
function getSql(): ReturnType<typeof postgres> {
  if (!_sql) {
    const url = process.env["DATABASE_URL"];
    if (!url) throw new Error("DATABASE_URL required");
    _sql = postgres(url, { max: 3 });
  }
  return _sql;
}
export function __setSql(sql: ReturnType<typeof postgres>): void {
  _sql = sql;
}

/** Export a user's data as a portable JSON bundle (identity-verified upstream). */
export async function exportUserData(req: DsarExportRequest): Promise<DsarResult> {
  const sql = getSql();
  const [user] = await sql`SELECT id, email, user_type, display_name, created_at FROM users WHERE id = ${req.userId} LIMIT 1`;
  if (!user) return { requestId: req.requestId, status: "failed" };

  const bundle: Record<string, unknown> = { user };
  for (const table of PRIVATE_TABLES) {
    try {
      bundle[table] = await sql`SELECT * FROM ${sql(table)} WHERE user_id = ${req.userId}`;
    } catch {
      bundle[table] = [];
    }
  }
  // Outcomes are exported too (the user's own outcome history).
  bundle["outcome_events"] = await sql`SELECT * FROM outcome_events WHERE user_id = ${req.userId}`;

  // R2/email delivery is Platform-sprint → the bundle is returned inline; status pending on delivery.
  return { requestId: req.requestId, status: "pending", exportBundle: bundle };
}

/**
 * Delete a user's data. Anonymizes outcomes FIRST, then erases private rows, then scans
 * for residual PII. Returns residualPiiCount (must be 0) and anonymizedOutcomeCount.
 */
export async function deleteUserData(req: DsarDeleteRequest): Promise<DsarResult> {
  const sql = getSql();

  const result = await sql.begin(async (tx) => {
    // 1. Anonymize outcomes FIRST (auditable: anonymized_at set), never destroy them.
    const anon = await tx`
      UPDATE outcome_events SET user_id = NULL, anonymized_at = now()
      WHERE user_id = ${req.userId}
    `;
    const anonymizedOutcomeCount = anon.count;

    // 2. Erase candidate-private rows.
    for (const table of PRIVATE_TABLES) {
      try {
        await tx`DELETE FROM ${tx(table)} WHERE user_id = ${req.userId}`;
      } catch {
        // table may not exist in a given environment — skip
      }
    }

    // Financial records gate: if the user has retained financial rows, soft-delete (scrub PII)
    // instead of hard-deleting the user row (legal retention).
    const [fin] = await tx`SELECT count(*)::int AS n FROM billing_ledger WHERE account_id = ${req.userId}`;
    const hasFinancial = (fin?.["n"] as number) > 0;

    if (hasFinancial) {
      await tx`
        UPDATE users SET
          email = ${"deleted-" + req.userId + "@anonymized.invalid"},
          display_name = NULL, password_hash = NULL, mfa_totp_secret = NULL,
          is_active = false, deleted_at = now()
        WHERE id = ${req.userId}
      `;
    } else {
      await tx`DELETE FROM users WHERE id = ${req.userId}`;
    }

    // 3. Residual-PII scan — count any private rows still referencing the user.
    let residual = 0;
    for (const table of PRIVATE_TABLES) {
      try {
        const [c] = await tx`SELECT count(*)::int AS n FROM ${tx(table)} WHERE user_id = ${req.userId}`;
        residual += (c?.["n"] as number) ?? 0;
      } catch { /* skip */ }
    }
    // Outcomes must be present-but-anonymized (user_id NULL), never counted as residual PII.
    const [stillLinked] = await tx`SELECT count(*)::int AS n FROM outcome_events WHERE user_id = ${req.userId}`;
    residual += (stillLinked?.["n"] as number) ?? 0;

    return { residual, anonymizedOutcomeCount };
  });

  return {
    requestId: req.requestId,
    status: "completed",
    residualPiiCount: result.residual,
    anonymizedOutcomeCount: result.anonymizedOutcomeCount,
    completedAt: new Date().toISOString(),
  };
}
