/**
 * F-080 — Compliance & decision audit logging.
 *
 * FAIL-CLOSED: throws DecisionLogWriteError on any DB failure → caller MUST NOT serve the decision.
 * CONSENT REQUIRED: throws ConsentMissingError if consentRef is absent.
 * IMMUTABLE: append-only table; idempotent by inputs_hash (ON CONFLICT DO NOTHING).
 * TAMPER-EVIDENT: hash_chain = SHA-256(prev_hash || inputsHash || rationale || timestamp).
 */

import { createHash } from "crypto";
import postgres from "postgres";

export interface DecisionLogEntry {
  decisionType: "screening" | "matching" | "recommendation";
  accountId: string;
  candidateAnonymizedId: string;
  orgId: string;
  jobId?: string;
  inputsHash: string;
  modelVersion: string;
  promptVersion: string;
  rationale: string;
  consentRef: string;
  region: string;
  timestamp?: string;
}

export interface DecisionLogResult {
  logId: string;
  hashChain: string;
}

export class DecisionLogWriteError extends Error {
  constructor(reason: string) {
    super(`Decision log write failed: ${reason}. Decision will NOT be served.`);
    this.name = "DecisionLogWriteError";
  }
}

export class ConsentMissingError extends Error {
  constructor() {
    super("writeDecisionLog requires a valid consentRef. Cannot log or serve a decision without consent.");
    this.name = "ConsentMissingError";
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

/** Allow tests to inject a client. */
export function __setSql(sql: ReturnType<typeof postgres>): void {
  _sql = sql;
}

function computeHashChain(prevHash: string, entry: DecisionLogEntry, ts: string): string {
  return createHash("sha256")
    .update(`${prevHash}|${entry.inputsHash}|${entry.rationale}|${ts}`)
    .digest("hex");
}

/**
 * Write a decision log entry BEFORE the decision is served (F-080.6).
 * @throws ConsentMissingError if consentRef absent
 * @throws DecisionLogWriteError on any DB failure (fail-closed — decision not served)
 */
export async function writeDecisionLog(entry: DecisionLogEntry): Promise<DecisionLogResult> {
  if (!entry.consentRef) throw new ConsentMissingError();

  const ts = entry.timestamp ?? new Date().toISOString();
  const sql = getSql();

  try {
    // Get the previous entry's hash_chain to extend the chain (tamper-evidence).
    const [prev] = await sql`
      SELECT hash_chain FROM compliance_decision_log
      ORDER BY timestamp DESC LIMIT 1
    `;
    const prevHash = (prev?.hash_chain as string | undefined) ?? "genesis";
    const hashChain = computeHashChain(prevHash, entry, ts);

    // Idempotent insert keyed by inputs_hash.
    const rows = await sql`
      INSERT INTO compliance_decision_log
        (decision_type, account_id, candidate_anonymized_id, org_id, job_id,
         inputs_hash, model_version, prompt_version, rationale, consent_ref, region, hash_chain, timestamp)
      VALUES
        (${entry.decisionType}, ${entry.accountId}, ${entry.candidateAnonymizedId},
         ${entry.orgId}, ${entry.jobId ?? null}, ${entry.inputsHash}, ${entry.modelVersion},
         ${entry.promptVersion}, ${entry.rationale}, ${entry.consentRef}, ${entry.region},
         ${hashChain}, ${ts})
      ON CONFLICT (inputs_hash) DO NOTHING
      RETURNING id, hash_chain
    `;

    if (rows.length > 0) {
      return { logId: rows[0]!.id as string, hashChain: rows[0]!.hash_chain as string };
    }

    // Conflict → an entry already exists for this inputs_hash. Return the existing one.
    const [existing] = await sql`
      SELECT id, hash_chain FROM compliance_decision_log WHERE inputs_hash = ${entry.inputsHash} LIMIT 1
    `;
    if (!existing) throw new DecisionLogWriteError("insert conflict but no existing row found");
    return { logId: existing.id as string, hashChain: existing.hash_chain as string };
  } catch (err) {
    if (err instanceof ConsentMissingError) throw err;
    if (err instanceof DecisionLogWriteError) throw err;
    throw new DecisionLogWriteError(err instanceof Error ? err.message : String(err));
  }
}
