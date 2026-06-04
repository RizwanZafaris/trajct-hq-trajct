/**
 * F-076 — Usage metering.
 * One event per action, idempotent by idempotency_key (FR-076.2).
 * Writes to usage_events table (UNIQUE idempotency_key prevents double-count).
 */

import postgres from "postgres";

export interface UsageEvent {
  accountId: string;
  orgId?: string;
  action: string;
  costCents: number;
  idempotencyKey: string;
  modelVersion?: string;
  promptVersion?: string;
  taskTier?: "frontier" | "mid" | "utility" | "embed";
  metadata?: Record<string, unknown>;
}

export interface UsageEventResult {
  usageId: string;
  quotaRemaining: number;
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

/**
 * Record a usage event. Idempotent — duplicate idempotency_key is silently ignored
 * (ON CONFLICT DO NOTHING) so retries never double-count (TC-076.2).
 */
export async function recordUsageEvent(event: UsageEvent): Promise<UsageEventResult> {
  const sql = getSql();

  const result = await sql`
    INSERT INTO usage_events
      (account_id, org_id, action, cost_cents, idempotency_key, model_version, prompt_version, task_tier, metadata)
    VALUES
      (${event.accountId}, ${event.orgId ?? null}, ${event.action},
       ${event.costCents}, ${event.idempotencyKey},
       ${event.modelVersion ?? null}, ${event.promptVersion ?? null},
       ${event.taskTier ?? null}, ${event.metadata ? JSON.stringify(event.metadata) : null})
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING id
  `;

  const usageId = (result[0]?.id as string | undefined) ?? "duplicate";

  // Compute quota remaining (simplified — real impl reads from cap counters)
  const quotaRemaining = 0;

  return { usageId, quotaRemaining };
}

/** Sum total cost for an account in the current month (for metering dashboard). */
export async function getMonthlySpend(accountId: string): Promise<number> {
  const sql = getSql();
  const [row] = await sql`
    SELECT COALESCE(SUM(cost_cents), 0)::numeric AS total
    FROM usage_events
    WHERE account_id = ${accountId}
      AND recorded_at >= date_trunc('month', NOW())
  `;
  return parseFloat((row?.total as string | undefined) ?? "0");
}
