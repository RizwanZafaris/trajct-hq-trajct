/**
 * F-052 — Per-company persona synthesis (DATA LAYER).
 * F-054 — Freshness + refresh scheduling.
 *
 * Boundary rule A: core/engine MUST NOT import packages/ai. The heavy AI synthesis
 * runs in the worker (apps/worker research.handler) which calls upsertPersona() here.
 * This module owns: freshness gating, cached reads, upsert, version snapshots, enqueue.
 */

import postgres from "postgres";
import { enqueue, ENGINE_QUEUES } from "./_enqueue.js";

export interface PersonaQuery {
  companyId: string;
  requestingUserId: string;
  consentRef?: string;
}

export interface AtsKeywordBank {
  required: string[];
  boost: string[];
  banned: string[];
}

export interface CompanyPersona {
  companyId: string;
  version: string;
  synthesizedAt: string;
  hiringSignals: string[];
  cultureIndicators: string[];
  successPatterns: string[];
  rejectionPatterns: string[];
  atsKeywordBank: AtsKeywordBank;
  evidenceRefs: string[];
  freshnessScore: number;
  quality?: "high" | "medium" | "low" | undefined;
}

/** Data the worker produces from the AI synthesis and hands back to upsert. */
export interface SynthesisResult {
  hiringSignals: string[];
  cultureIndicators: string[];
  successPatterns: string[];
  rejectionPatterns: string[];
  atsKeywordBank: AtsKeywordBank;
  evidenceRefs: string[];
  quality: "high" | "medium" | "low";
}

const FRESH_THRESHOLD = 0.3; // freshness_score above which we serve cache and skip re-synthesis
const REFRESH_INTERVAL_DAYS = 7;

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

function rowToPersona(row: Record<string, unknown>): CompanyPersona {
  const bank = (row["ats_keyword_bank"] as AtsKeywordBank | null) ?? { required: [], boost: [], banned: [] };
  return {
    companyId: row["company_id"] as string,
    version: String(row["version"] ?? 1),
    synthesizedAt: row["last_synthesized_at"] ? (row["last_synthesized_at"] as Date).toISOString() : "",
    hiringSignals: (row["hiring_signals"] as string[]) ?? [],
    cultureIndicators: (row["culture_indicators"] as string[]) ?? [],
    successPatterns: (row["success_patterns"] as string[]) ?? [],
    rejectionPatterns: (row["rejection_patterns"] as string[]) ?? [],
    atsKeywordBank: bank,
    evidenceRefs: (row["evidence_refs"] as string[]) ?? [],
    freshnessScore: parseFloat(String(row["freshness_score"] ?? "0")),
    quality: (row["quality"] as "high" | "medium" | "low" | null) ?? undefined,
  };
}

/** Read the cached persona for a company (null if none). */
export async function getPersona(query: PersonaQuery): Promise<CompanyPersona | null> {
  const sql = getSql();
  const [row] = await sql`SELECT * FROM company_personas WHERE company_id = ${query.companyId} LIMIT 1`;
  return row ? rowToPersona(row) : null;
}

/**
 * Return the cached persona if fresh; otherwise enqueue a synthesis job (q.research)
 * and return whatever we currently have (possibly null / stale). Non-blocking.
 */
export async function getOrSynthesize(
  companyId: string,
  companyName: string,
  companyDomain?: string,
  forceRefresh = false
): Promise<CompanyPersona | null> {
  const existing = await getPersona({ companyId, requestingUserId: "system" });

  const fresh = existing && existing.freshnessScore > FRESH_THRESHOLD && !forceRefresh;
  if (fresh) return existing;

  await enqueue(ENGINE_QUEUES.RESEARCH, "persona.synthesize", {
    type: "persona.synthesize",
    companyId,
    companyName,
    companyDomain,
    forceRefresh,
    idempotencyKey: `persona-${companyId}`,
  }, `persona-${companyId}`); // BullMQ jobId must not contain ':'

  return existing; // stale-while-revalidate
}

/** Enqueue-only wrapper kept for the public index signature. */
export async function synthesizePersona(companyId: string): Promise<CompanyPersona | null> {
  return getOrSynthesize(companyId, companyId);
}

/**
 * Upsert a synthesized persona (called by the worker AFTER the AI synthesis).
 * Snapshots the prior version to persona_versions, bumps version, sets freshness=1.0.
 */
export async function upsertPersona(
  companyId: string,
  result: SynthesisResult,
  companyName?: string
): Promise<CompanyPersona> {
  const sql = getSql();
  const now = new Date();
  const nextRefresh = new Date(now.getTime() + REFRESH_INTERVAL_DAYS * 24 * 3600 * 1000).toISOString();

  // Snapshot the current version before overwriting (audit trail).
  const [current] = await sql`SELECT * FROM company_personas WHERE company_id = ${companyId} LIMIT 1`;
  if (current) {
    await sql`
      INSERT INTO persona_versions (company_id, version, snapshot, reason)
      VALUES (${companyId}, ${(current["version"] as number) ?? 1}, ${sql.json(current as never)}, 'resynthesis')
    `;
  }

  const rows = await sql`
    INSERT INTO company_personas
      (company_id, company_name, version, hiring_signals, culture_indicators, success_patterns,
       rejection_patterns, ats_keyword_bank, evidence_refs, freshness_score, quality,
       last_synthesized_at, last_research_at, next_refresh_at, updated_at)
    VALUES
      (${companyId}, ${companyName ?? null}, 1,
       ${sql.json(result.hiringSignals)}, ${sql.json(result.cultureIndicators)}, ${sql.json(result.successPatterns)},
       ${sql.json(result.rejectionPatterns)}, ${sql.json(result.atsKeywordBank as never)}, ${sql.json(result.evidenceRefs)},
       1.0, ${result.quality}, ${now.toISOString()}, ${now.toISOString()}, ${nextRefresh}, ${now.toISOString()})
    ON CONFLICT (company_id) DO UPDATE SET
      version = company_personas.version + 1,
      hiring_signals = EXCLUDED.hiring_signals,
      culture_indicators = EXCLUDED.culture_indicators,
      success_patterns = EXCLUDED.success_patterns,
      rejection_patterns = EXCLUDED.rejection_patterns,
      ats_keyword_bank = EXCLUDED.ats_keyword_bank,
      evidence_refs = EXCLUDED.evidence_refs,
      freshness_score = 1.0,
      quality = EXCLUDED.quality,
      last_synthesized_at = EXCLUDED.last_synthesized_at,
      last_research_at = EXCLUDED.last_research_at,
      next_refresh_at = EXCLUDED.next_refresh_at,
      updated_at = EXCLUDED.updated_at
    RETURNING *
  `;

  return rowToPersona(rows[0]!);
}

/** F-054 — list personas due for a freshness refresh. */
export async function listStalePersonas(limit = 20): Promise<Array<{ companyId: string; companyName: string }>> {
  const sql = getSql();
  const rows = await sql`
    SELECT company_id, company_name FROM company_personas
    WHERE next_refresh_at < NOW() OR freshness_score < 0.4
    ORDER BY next_refresh_at ASC NULLS FIRST
    LIMIT ${limit}
  `;
  return rows.map((r) => ({ companyId: r["company_id"] as string, companyName: (r["company_name"] as string | null) ?? "" }));
}

/** F-054 — decay freshness on a minor news check (no full re-synthesis). */
export async function decayFreshness(companyId: string, newScore: number): Promise<void> {
  const sql = getSql();
  const nextRefresh = new Date(Date.now() + REFRESH_INTERVAL_DAYS * 24 * 3600 * 1000).toISOString();
  await sql`
    UPDATE company_personas
    SET freshness_score = ${Math.max(0, Math.min(1, newScore))}, next_refresh_at = ${nextRefresh}, updated_at = NOW()
    WHERE company_id = ${companyId}
  `;
}
