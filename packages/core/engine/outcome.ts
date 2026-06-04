/**
 * F-050 — Outcome logging.
 * Must ship from day one — you cannot learn from data you never captured.
 * Captures who got an interview / hired and which artifacts/knowledge drove it.
 *
 * CONSENT REQUIRED: throws if consentRef is absent.
 * Idempotent by idempotency_key. Fires the F-051 credit-assignment job async.
 */

import postgres from "postgres";
import { enqueue, ENGINE_QUEUES } from "./_enqueue.js";

export interface OutcomeEvent {
  userId: string;
  companyId: string;
  jobId?: string | undefined;
  outcome: "interview_win" | "interview_loss" | "offer" | "hire" | "rejection" | "withdraw";
  artifactIds: string[];
  citeMarkers: string[];
  consentRef: string;
  idempotencyKey?: string | undefined;
  timestamp?: string | undefined;
}

export interface OutcomeRecord extends OutcomeEvent {
  id: string;
  creditAssigned: boolean;
}

export class OutcomeConsentMissingError extends Error {
  constructor() {
    super("logOutcome requires a consentRef (F-050). Cannot log an outcome without consent.");
    this.name = "OutcomeConsentMissingError";
  }
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

export async function logOutcome(event: OutcomeEvent): Promise<OutcomeRecord> {
  if (!event.consentRef) throw new OutcomeConsentMissingError();

  const sql = getSql();
  const idem = event.idempotencyKey ?? `outcome:${event.userId}:${event.jobId ?? event.companyId}:${event.outcome}`;
  const ts = event.timestamp ?? new Date().toISOString();

  const rows = await sql`
    INSERT INTO outcome_events
      (user_id, company_id, job_id, outcome, artifact_ids, cite_markers, consent_ref, idempotency_key, recorded_at)
    VALUES
      (${event.userId}, ${event.companyId}, ${event.jobId ?? null}, ${event.outcome},
       ${sql.array(event.artifactIds)}, ${sql.array(event.citeMarkers)},
       ${event.consentRef}, ${idem}, ${ts})
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING id, credit_assigned
  `;

  let id: string;
  let creditAssigned: boolean;

  if (rows.length > 0) {
    id = rows[0]!.id as string;
    creditAssigned = rows[0]!.credit_assigned as boolean;
    // Fire-and-forget: F-051 credit assignment (async, q.research)
    await enqueue(ENGINE_QUEUES.RESEARCH, "loop.credit_assign", {
      type: "loop.credit_assign",
      outcomeId: id,
      userId: event.userId,
      artifactIds: event.artifactIds,
      idempotencyKey: `credit-${id}`,
    }, `credit-${id}`); // BullMQ jobId must not contain ':'
  } else {
    // Duplicate — return the existing row.
    const [existing] = await sql`SELECT id, credit_assigned FROM outcome_events WHERE idempotency_key = ${idem} LIMIT 1`;
    id = existing!.id as string;
    creditAssigned = existing!.credit_assigned as boolean;
  }

  return {
    id,
    userId: event.userId,
    companyId: event.companyId,
    ...(event.jobId !== undefined ? { jobId: event.jobId } : {}),
    outcome: event.outcome,
    artifactIds: event.artifactIds,
    citeMarkers: event.citeMarkers,
    consentRef: event.consentRef,
    timestamp: ts,
    creditAssigned,
  };
}

export async function getOutcome(id: string): Promise<OutcomeRecord | null> {
  const sql = getSql();
  const [row] = await sql`SELECT * FROM outcome_events WHERE id = ${id} LIMIT 1`;
  if (!row) return null;
  return {
    id: row.id as string,
    userId: row.user_id as string,
    companyId: row.company_id as string,
    jobId: (row.job_id as string | null) ?? undefined,
    outcome: row.outcome as OutcomeEvent["outcome"],
    artifactIds: (row.artifact_ids as string[]) ?? [],
    citeMarkers: (row.cite_markers as string[]) ?? [],
    consentRef: row.consent_ref as string,
    timestamp: (row.recorded_at as Date).toISOString(),
    creditAssigned: row.credit_assigned as boolean,
  };
}
