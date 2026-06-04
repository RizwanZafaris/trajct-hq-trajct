/**
 * F-051 — Outcome-learning loop: credit assignment + persona evolution.
 * Port of jobHunt/agents/outcome_to_persona.py.
 *
 * Credit deltas (verbatim from donor):
 *   interview_win  +0.05   interview_loss -0.02
 *   offer          +0.10   hire           +0.10
 *   rejection      -0.01   withdraw        0.00
 *
 * Each cited knowledge atom's outcome_score moves by (delta / citeCount), clamped [0,1].
 * Strong positive outcomes (offer/hire) additionally trigger persona evolution.
 */

import postgres from "postgres";
import { enqueue, ENGINE_QUEUES } from "./_enqueue.js";

export const CREDIT_DELTA: Record<string, number> = {
  interview_win: +0.05,
  interview_loss: -0.02,
  offer: +0.10,
  hire: +0.10,
  rejection: -0.01,
  withdraw: 0.0,
};

const SCORE_MIN = 0.0;
const SCORE_MAX = 1.0;
const clamp = (n: number): number => Math.max(SCORE_MIN, Math.min(SCORE_MAX, n));

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

export interface CreditAssignResult {
  outcomeId: string;
  knowledgeUpdated: number;
  delta: number;
  triggeredPersonaEvolve: boolean;
}

/**
 * Assign Bayesian credit from a logged outcome back to the knowledge that drove it.
 * Idempotent: if outcome_events.credit_assigned is already true, returns a no-op.
 */
export async function assignCredit(outcomeId: string): Promise<CreditAssignResult> {
  const sql = getSql();

  const [outcome] = await sql`
    SELECT id, company_id, outcome, cite_markers, credit_assigned
    FROM outcome_events WHERE id = ${outcomeId} LIMIT 1
  `;
  if (!outcome) throw new Error(`outcome ${outcomeId} not found`);

  if (outcome.credit_assigned as boolean) {
    return { outcomeId, knowledgeUpdated: 0, delta: 0, triggeredPersonaEvolve: false };
  }

  const outcomeType = outcome.outcome as string;
  const citeMarkers = (outcome.cite_markers as string[]) ?? [];
  const baseDelta = CREDIT_DELTA[outcomeType] ?? 0;
  const perKnowledge = citeMarkers.length > 0 ? baseDelta / citeMarkers.length : 0;

  let knowledgeUpdated = 0;
  if (perKnowledge !== 0) {
    for (const knowledgeId of citeMarkers) {
      // Upsert: ensure the knowledge ref exists, then move its outcome_score by the delta (clamped).
      await sql`
        INSERT INTO knowledge_refs (knowledge_id, doc_type, outcome_score)
        VALUES (${knowledgeId}, 'outcome', LEAST(1.0, GREATEST(0.0, 0.5 + ${perKnowledge})))
        ON CONFLICT (knowledge_id) DO UPDATE SET
          outcome_score = LEAST(1.0, GREATEST(0.0, knowledge_refs.outcome_score + ${perKnowledge})),
          updated_at = NOW()
      `;
      knowledgeUpdated += 1;
    }
  }

  // Mark credit assigned (idempotency guard for re-runs).
  await sql`UPDATE outcome_events SET credit_assigned = true WHERE id = ${outcomeId}`;

  // Strong positive → evolve the company persona (F-051).
  const triggeredPersonaEvolve = outcomeType === "offer" || outcomeType === "hire";
  if (triggeredPersonaEvolve) {
    await enqueue(ENGINE_QUEUES.RESEARCH, "loop.persona_evolve", {
      type: "loop.persona_evolve",
      companyId: outcome.company_id as string,
      reason: `${outcomeType} outcome ${outcomeId}`,
      idempotencyKey: `evolve-${outcomeId}`,
    }, `evolve-${outcomeId}`); // BullMQ jobId must not contain ':'
  }

  return { outcomeId, knowledgeUpdated, delta: baseDelta, triggeredPersonaEvolve };
}

void clamp; // SQL LEAST/GREATEST does the clamping; helper retained for unit reference
