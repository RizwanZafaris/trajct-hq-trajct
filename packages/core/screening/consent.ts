/**
 * F-034.2 — Consent capture for screening.
 * Consent must be captured before any assessment begins. Immutable once written.
 */

import postgres from "postgres";

export interface ConsentRecord {
  id: string;
  userId: string;
  orgId: string | null;
  jobId: string | null;
  region: string;
  purposes: string[];
  capturedAt: string;
  ipAddress?: string | undefined;
  expiresAt?: string | undefined;
}

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

function rowToConsent(row: Record<string, unknown>): ConsentRecord {
  return {
    id: row["id"] as string,
    userId: row["user_id"] as string,
    orgId: (row["org_id"] as string | null) ?? null,
    jobId: (row["job_id"] as string | null) ?? null,
    region: row["region"] as string,
    purposes: (row["purposes"] as string[]) ?? [],
    capturedAt: (row["captured_at"] as Date).toISOString(),
    ipAddress: (row["ip_address"] as string | null) ?? undefined,
    expiresAt: row["expires_at"] ? (row["expires_at"] as Date).toISOString() : undefined,
  };
}

/** Capture immutable consent before any assessment (F-034.2). */
export async function captureConsent(
  userId: string,
  orgId: string | null,
  jobId: string | null,
  region: string,
  purposes: string[]
): Promise<ConsentRecord> {
  const sql = getSql();
  const [row] = await sql`
    INSERT INTO consent_records (user_id, org_id, job_id, region, purposes)
    VALUES (${userId}, ${orgId}, ${jobId}, ${region}, ${sql.json(purposes)})
    RETURNING *
  `;
  return rowToConsent(row!);
}

/** Resolve a consent reference; returns null if missing, revoked, or expired. */
export async function verifyConsent(consentRef: string): Promise<ConsentRecord | null> {
  const sql = getSql();
  const [row] = await sql`
    SELECT * FROM consent_records
    WHERE id = ${consentRef}
      AND revoked_at IS NULL
      AND (expires_at IS NULL OR expires_at > now())
    LIMIT 1
  `;
  return row ? rowToConsent(row) : null;
}
