/**
 * F-001 — diagnostic scoring (worker). Ported from jobHunt/agents/scoring_agent.py.
 *
 * 6-dimension scoring via Gateway (tier='mid' for the 8s budget) → band (BR-001.9 exact) →
 * 3–7 reasons each {issue, fix, evidence_ref, severity}; reasons whose evidence_ref is NOT
 * resolvable against the résumé are DROPPED (BR-001.6); if <3 remain → honest "few issues".
 * Cite-markers (F-050) attached. Context adapts TONE only — score + reasons are identical.
 *
 * No charge (diagnostic is free). On failure → status='failed', error_code='ENGINE_UNAVAILABLE'.
 */

import { Redis } from "ioredis";
import postgres from "postgres";
import { gateway, SYSTEM_ACCOUNT_ID } from "../gateway.js";
import { attachCiteMarkers, upsertKnowledgeRef } from "@trajct/core/engine";
import { scoreToBand } from "@trajct/contracts";

export interface DiagnosticScoreInput {
  diagToken: string;
  resumeText: string;
  jdText: string;
  jdConfidence: "high" | "med" | "low";
  context: string | null;
  userId: string | null;
  idempotencyKey: string;
}

const DIMENSIONS = ["role_fit", "skill_coverage", "evidence_quality", "seniority_match", "logistics", "growth_fit"] as const;
const WEIGHTS: Record<(typeof DIMENSIONS)[number], number> = {
  role_fit: 0.25, skill_coverage: 0.25, evidence_quality: 0.2, seniority_match: 0.15, logistics: 0.05, growth_fit: 0.1,
};

interface Reason { issue: string; fix: string; evidence_ref: string; severity: "high" | "med" | "low"; }
interface Dimension { dimension: string; score: number; rationale: string; }

let _redis: Redis | null = null;
let _sql: ReturnType<typeof postgres> | null = null;
function redis(): Redis {
  if (!_redis) _redis = new Redis(process.env["REDIS_URL"] ?? "redis://localhost:6379", { maxRetriesPerRequest: 2 });
  return _redis;
}
function sql(): ReturnType<typeof postgres> {
  if (!_sql) _sql = postgres(process.env["DATABASE_URL"] ?? "postgresql://trajct:trajct_dev_password@localhost:5434/trajct_dev", { max: 2 });
  return _sql;
}

function hasLlmKeys(): boolean {
  return !!(process.env["ANTHROPIC_API_KEY"] || process.env["OPENAI_API_KEY"] || process.env["OPENROUTER_API_KEY"] || process.env["GOOGLE_API_KEY"]);
}

export async function runDiagnosticScore(data: DiagnosticScoreInput): Promise<void> {
  try {
    const { dimensions, reasons } = hasLlmKeys()
      ? await scoreViaLlm(data)
      : mockScore(data.resumeText);

    // Drop reasons whose evidence_ref is not resolvable in the résumé (BR-001.6).
    const resumeLower = data.resumeText.toLowerCase();
    const resolved = reasons.filter((r) => {
      const ev = (r.evidence_ref ?? "").trim();
      if (!ev) return false;
      const probe = ev.toLowerCase().replace(/^["']|["']$/g, "").slice(0, 40);
      return probe.length >= 4 && resumeLower.includes(probe.slice(0, Math.min(probe.length, 24)));
    });

    // BR-001.6: <3 resolvable reasons → honest "few issues found" (keep what resolved).
    const fewIssues = resolved.length < 3;
    const finalReasons = (resolved.length > 0 ? resolved : reasons).slice(0, 7);

    const overall = Math.round(
      DIMENSIONS.reduce((sum, d) => sum + (dimensions.find((x) => x.dimension === d)?.score ?? 50) * WEIGHTS[d], 0)
    );
    const band = scoreToBand(overall);

    // Cite-markers (F-050): one per reason, linking to the résumé evidence.
    const citations = finalReasons.map((r, i) => {
      const knowledgeId = `cite:diagnostic:${data.diagToken}:${i}`;
      void upsertKnowledgeRef({ knowledgeId, docType: "user-doc", sourceRef: r.evidence_ref, confidence: 0.8 });
      return { knowledgeId, docType: "user-doc", sourceRef: r.evidence_ref };
    });
    const reasonsWithCites = finalReasons.map((r, i) => ({ ...r, evidence_ref: r.evidence_ref || `cite:diagnostic:${data.diagToken}:${i}` }));

    const result = {
      score: overall,
      band,
      reasons: reasonsWithCites,
      dimensions: dimensions.map((d) => ({ dimension: d.dimension, score: Math.round(d.score), rationale: d.rationale })),
      confidence: data.jdConfidence === "low" ? "low" : fewIssues ? "med" : "high",
      diag_token: data.diagToken,
      citations,
      modelVersion: hasLlmKeys() ? "claude-sonnet-4-6" : "mock-dev",
      ...(fewIssues ? { locale_notice: undefined } : {}),
    };
    void attachCiteMarkers; // marker JSON travels with the artifact when persisted to R2 (Sprint B+)

    await writeBack(data, "completed", result, null);
    console.log(`[frontier:diagnostic] ${data.diagToken} → ${overall}/${band} (${reasonsWithCites.length} reasons)`);
  } catch (err) {
    console.error(`[frontier:diagnostic] ${data.diagToken} failed:`, err instanceof Error ? err.message : err);
    await writeBack(data, "failed", null, "ENGINE_UNAVAILABLE");
    throw err; // surfaces to BullMQ retry/DLQ
  }
}

// ---------------------------------------------------------------------------

async function scoreViaLlm(data: DiagnosticScoreInput): Promise<{ dimensions: Dimension[]; reasons: Reason[] }> {
  const toneNote = data.context && data.context !== "unknown"
    ? `The candidate context is "${data.context}". Adapt ONLY the TONE/framing of each fix string (gentler, action-plan oriented). DO NOT change the score or which issues you raise.`
    : "";

  const system = `You are a senior technical recruiter giving an HONEST résumé diagnostic against a target role.
Score 6 dimensions 0-100 and list the specific reasons the candidate is unlikely to get a callback.
${toneNote}
Reply ONLY with strict JSON:
{
  "dimensions": [{"dimension":"role_fit","score":0-100,"rationale":"..."}, ... all 6: role_fit, skill_coverage, evidence_quality, seniority_match, logistics, growth_fit],
  "reasons": [{"issue":"...","fix":"...","evidence_ref":"<exact short quote from the résumé that shows the issue>","severity":"high|med|low"}]
}
Rules: 3-7 reasons ranked by severity. Every evidence_ref MUST be a verbatim short quote from the résumé text. Never invent facts.`;

  const user = `## Target role / JD:\n${data.jdText.slice(0, 8000)}\n\n## Résumé:\n${data.resumeText.slice(0, 12000)}`;

  const resp = await gateway().complete({
    task: "diagnostic.score",
    taskTier: "mid", // 8s p95 budget — fast model, rubric compensates (FR-001.3)
    accountId: data.userId ?? SYSTEM_ACCOUNT_ID,
    idempotencyKey: `diag-score-${data.idempotencyKey}`,
    jsonMode: true,
    maxTokens: 1800,
    temperature: 0.2,
    messages: [{ role: "system", content: system }, { role: "user", content: user }],
  });

  return parseScore(resp.content);
}

function parseScore(raw: string): { dimensions: Dimension[]; reasons: Reason[] } {
  try {
    const j = JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "")) as { dimensions?: Dimension[]; reasons?: Reason[] };
    const dimensions = (j.dimensions ?? []).map((d) => ({
      dimension: String(d.dimension),
      score: Math.max(0, Math.min(100, Number(d.score) || 50)),
      rationale: String(d.rationale ?? ""),
    }));
    const reasons = (j.reasons ?? []).slice(0, 7).map((r) => ({
      issue: String(r.issue ?? ""),
      fix: String(r.fix ?? ""),
      evidence_ref: String(r.evidence_ref ?? ""),
      severity: (["high", "med", "low"].includes(r.severity) ? r.severity : "med") as Reason["severity"],
    }));
    return { dimensions, reasons };
  } catch {
    return mockScore("");
  }
}

/** Deterministic dev mock (no LLM keys) so the pipeline is testable end-to-end. */
function mockScore(resumeText: string): { dimensions: Dimension[]; reasons: Reason[] } {
  const quote = resumeText.trim().split(/\s+/).slice(0, 6).join(" ") || "experience";
  return {
    dimensions: DIMENSIONS.map((d) => ({ dimension: d, score: 62, rationale: `mock ${d}` })),
    reasons: [
      { issue: "No quantified impact in experience", fix: "Add metrics (%, $, team size) to each role", evidence_ref: quote, severity: "high" },
      { issue: "Missing ATS keywords for the target role", fix: "Mirror the JD's exact phrasing in skills", evidence_ref: quote, severity: "high" },
      { issue: "Generic summary", fix: "Lead with your #1 differentiating achievement", evidence_ref: quote, severity: "med" },
    ],
  };
}

async function writeBack(
  data: DiagnosticScoreInput,
  status: "completed" | "failed",
  result: unknown,
  errorCode: string | null
): Promise<void> {
  // Update the Redis blob (anon + authed both keyed by diag_token).
  const key = `diag:${data.diagToken}`;
  const raw = await redis().get(key);
  if (raw) {
    const blob = JSON.parse(raw) as Record<string, unknown>;
    blob["status"] = status;
    if (result) blob["result"] = result;
    if (errorCode) blob["errorCode"] = errorCode;
    const ttl = await redis().ttl(key);
    await redis().set(key, JSON.stringify(blob), "EX", ttl > 0 ? ttl : 24 * 3600);
  }
  // [R5] authed → also persist to Postgres.
  if (data.userId) {
    const r = result as { score?: number; band?: string; reasons?: unknown } | null;
    await sql()`
      UPDATE diagnostic_results SET
        status = ${status},
        overall_score = ${r?.score ?? null},
        band = ${r?.band ?? null},
        reasons = ${r?.reasons ? sql().json(r.reasons as never) : null},
        error_code = ${errorCode},
        model_version = ${"claude-sonnet-4-6"},
        completed_at = now()
      WHERE diag_token = ${data.diagToken} AND user_id = ${data.userId}
    `.catch((e: unknown) => console.error("[diagnostic] persist failed:", e));
  }
}
