/**
 * F-080 — Compliance & decision audit logging.
 *
 * FAIL-CLOSED: throws DecisionLogWriteError on any DB failure → caller MUST NOT serve the decision.
 * CONSENT REQUIRED: throws ConsentMissingError if consentRef is absent.
 * IMMUTABLE: append-only table (RLS: INSERT-only for trajct_app, no UPDATE/DELETE).
 * IDEMPOTENT [R3]: dedup on idempotency_key (NOT inputs_hash — repeat decisions are legitimate).
 * TAMPER-EVIDENT [R4]: hash_chain = SHA-256(prevHash | inputsHash | rationale | ts).
 *   The read-prev → insert is serialized with pg_advisory_xact_lock so concurrent writers
 *   cannot read the same prevHash and FORK the chain. Order is by chain_seq (insertion order),
 *   immune to clock ties. verifyChain() re-walks the chain to prove linearity (TC-080.2).
 */

import { createHash, randomUUID } from "crypto";
import postgres from "postgres";

export interface DecisionLogEntry {
  decisionType: "screening" | "matching" | "recommendation";
  accountId: string;
  candidateAnonymizedId: string;
  orgId: string;
  jobId?: string;
  inputsHash: string;
  idempotencyKey: string;          // [R3] dedup key — distinct from inputs_hash
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

export interface ChainVerification {
  valid: boolean;
  count: number;
  brokenAtSeq?: number;
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

const CHAIN_LOCK_KEY = "decision_log_chain";

let _sql: ReturnType<typeof postgres> | null = null;
function getSql(): ReturnType<typeof postgres> {
  if (!_sql) {
    const url = process.env["DATABASE_URL"];
    if (!url) throw new Error("DATABASE_URL required");
    _sql = postgres(url, { max: 5 });
  }
  return _sql;
}
export function __setSql(sql: ReturnType<typeof postgres>): void {
  _sql = sql;
}

function hashOf(prevHash: string, inputsHash: string, rationale: string, ts: string): string {
  return createHash("sha256").update(`${prevHash}|${inputsHash}|${rationale}|${ts}`).digest("hex");
}

/**
 * Write a decision log entry BEFORE the decision is served (F-080.6). Fail-closed.
 * @throws ConsentMissingError if consentRef absent
 * @throws DecisionLogWriteError on any DB failure (decision not served)
 */
export async function writeDecisionLog(entry: DecisionLogEntry): Promise<DecisionLogResult> {
  if (!entry.consentRef) throw new ConsentMissingError();

  const ts = (entry.timestamp ? new Date(entry.timestamp) : new Date()).toISOString();
  const id = randomUUID();
  const sql = getSql();

  try {
    return await sql.begin(async (tx) => {
      // [R4] serialize chain-head reads + inserts so concurrent writers cannot fork the chain.
      await tx`SELECT pg_advisory_xact_lock(hashtext(${CHAIN_LOCK_KEY}))`;

      const [prev] = await tx`
        SELECT hash_chain FROM compliance_decision_log ORDER BY chain_seq DESC LIMIT 1
      `;
      const prevHash = (prev?.hash_chain as string | undefined) ?? "genesis";
      const hashChain = hashOf(prevHash, entry.inputsHash, entry.rationale, ts);

      // [R3] idempotent on idempotency_key. Client-side id (no RETURNING — trajct_app has
      // no SELECT policy; see ADR-009).
      const inserted = await tx`
        INSERT INTO compliance_decision_log
          (id, decision_type, account_id, candidate_anonymized_id, org_id, job_id,
           inputs_hash, idempotency_key, model_version, prompt_version, rationale,
           consent_ref, region, hash_chain, recorded_at)
        VALUES
          (${id}, ${entry.decisionType}, ${entry.accountId}, ${entry.candidateAnonymizedId},
           ${entry.orgId}, ${entry.jobId ?? null}, ${entry.inputsHash}, ${entry.idempotencyKey},
           ${entry.modelVersion}, ${entry.promptVersion}, ${entry.rationale},
           ${entry.consentRef}, ${entry.region}, ${hashChain}, ${ts})
        ON CONFLICT (idempotency_key) DO NOTHING
      `;

      if (inserted.count > 0) {
        return { logId: id, hashChain };
      }

      // Idempotency replay → return the existing row (same idempotency_key).
      const [existing] = await tx`
        SELECT id, hash_chain FROM compliance_decision_log WHERE idempotency_key = ${entry.idempotencyKey} LIMIT 1
      `;
      if (!existing) throw new DecisionLogWriteError("idempotency conflict but no existing row found");
      return { logId: existing.id as string, hashChain: existing.hash_chain as string };
    });
  } catch (err) {
    if (err instanceof ConsentMissingError || err instanceof DecisionLogWriteError) throw err;
    throw new DecisionLogWriteError(err instanceof Error ? err.message : String(err));
  }
}

/**
 * [R4] Verify the hash chain is linear (no fork) over a time range, by re-walking
 * rows in chain_seq order and recomputing each hash from its predecessor.
 */
export async function verifyChain(fromTs: string, toTs: string): Promise<ChainVerification> {
  const sql = getSql();
  const rows = await sql`
    SELECT inputs_hash, rationale, hash_chain, chain_seq, recorded_at
    FROM compliance_decision_log
    WHERE recorded_at >= ${fromTs} AND recorded_at <= ${toTs}
    ORDER BY chain_seq ASC
  `;
  if (rows.length === 0) return { valid: true, count: 0 };

  // Seed prevHash from the row immediately before the range (or genesis).
  const [before] = await sql`
    SELECT hash_chain FROM compliance_decision_log
    WHERE chain_seq < ${rows[0]!["chain_seq"] as number}
    ORDER BY chain_seq DESC LIMIT 1
  `;
  let prevHash = (before?.hash_chain as string | undefined) ?? "genesis";

  for (const row of rows) {
    const ts = (row["recorded_at"] as Date).toISOString();
    const expected = hashOf(prevHash, row["inputs_hash"] as string, row["rationale"] as string, ts);
    if (expected !== (row["hash_chain"] as string)) {
      return { valid: false, count: rows.length, brokenAtSeq: row["chain_seq"] as number };
    }
    prevHash = row["hash_chain"] as string;
  }
  return { valid: true, count: rows.length };
}
