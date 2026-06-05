/**
 * F-002 — Per-company tailored résumé (worker). Ported from jobHunt g2_graph/g2_nodes.
 *
 * Invariants:
 *  - [R8 / BR-002.1] FABRICATION SCAN is mandatory and FAIL-CLOSED. Ungrounded → remove + regen
 *    (≤2). Scanner error → NOT clean. If it can't ground after retries → status='failed',
 *    error GENERATION_QUALITY, and NO charge.
 *  - [R7 / BR-002.5] The build is charged ONLY on success: the billing_ledger debit + the usage
 *    unit are written here in the worker success path, never pre-created in the API.
 *  - [F-055] Voice calibration when ≥3 samples; cold-start otherwise (never fail on missing voice).
 *  - [F-050] cite-markers attached.
 */

import postgres from "postgres";
import { randomUUID } from "crypto";
import { gateway, SYSTEM_ACCOUNT_ID } from "../gateway.js";
import { getPersona, getVoiceProfile, attachCiteMarkers, upsertKnowledgeRef } from "@trajct/core/engine";
import { scanFabrication, FabricationScanError } from "./fabrication-scan.js";

export interface TailorInput {
  tailoredResumeId: string;
  resumeId: string;
  companyId: string;
  targetRole: string;
  targetJdText?: string;
  userId: string;
  idempotencyKey: string;
}

const BUILD_COST_CENTS = 50;          // ~$0.50 per build (the metered usage unit)
const MAX_REGEN = 2;                  // FR-002.8: regenerate up to 2 times before 409

let _sql: ReturnType<typeof postgres> | null = null;
function sql(): ReturnType<typeof postgres> {
  if (!_sql) _sql = postgres(process.env["DATABASE_URL"] ?? "postgresql://trajct:trajct_dev_password@localhost:5434/trajct_dev", { max: 3 });
  return _sql;
}
function hasLlmKeys(): boolean {
  return !!(process.env["ANTHROPIC_API_KEY"] || process.env["OPENAI_API_KEY"] || process.env["OPENROUTER_API_KEY"] || process.env["GOOGLE_API_KEY"]);
}

export async function runTailor(data: TailorInput): Promise<void> {
  // Fetch the master profile (ground truth) + persona + voice.
  const [profile] = await sql()`SELECT parsed_text, experience, skills FROM candidate_profiles WHERE user_id = ${data.userId} LIMIT 1`;
  const profileText = buildProfileText(profile);

  // FR-002.5 — a too-thin profile is asked to add detail, not invented over (AC-002.1.7).
  if (profileText.trim().length < 80) {
    await fail(data, "THIN_PROFILE");
    return;
  }

  const persona = await getPersona({ companyId: data.companyId, requestingUserId: data.userId }).catch(() => null);
  const voice = await getVoiceProfile(data.userId).catch(() => null);
  const useVoice = !!voice && voice.sampleCount >= 3; // F-055 cold-start

  let lastUngrounded: string[] = [];
  for (let attempt = 0; attempt <= MAX_REGEN; attempt++) {
    const generated = await generate(profileText, persona, data, useVoice, attempt);

    let scan;
    try {
      scan = await scanFabrication(generated, profileText, `${data.idempotencyKey}-${attempt}`);
    } catch (err) {
      // [R8] scanner outage = NOT clean. Do not serve, do not charge. Try again (bounded).
      if (err instanceof FabricationScanError && attempt < MAX_REGEN) continue;
      await fail(data, "GENERATION_QUALITY");
      return;
    }

    if (scan.clean) {
      await succeed(data, generated, profileText);
      return;
    }
    lastUngrounded = scan.ungrounded;
  }

  // Could not ground after MAX_REGEN retries → 409 GENERATION_QUALITY, NO charge.
  console.warn(`[tailor] ${data.tailoredResumeId} ungrounded after retries:`, lastUngrounded);
  await fail(data, "GENERATION_QUALITY");
}

// ---------------------------------------------------------------------------

async function generate(profileText: string, persona: unknown, data: TailorInput, useVoice: boolean, attempt: number): Promise<string> {
  if (!hasLlmKeys()) {
    // Dev mock: grounded résumé derived ONLY from the profile (never introduces new facts).
    return `TAILORED RÉSUMÉ for ${data.targetRole}\n\n${profileText}`;
  }
  const p = persona as { hiringSignals?: string[]; successPatterns?: string[]; atsKeywordBank?: { required?: string[] } } | null;
  const system = `You are an expert résumé writer tailoring for the role "${data.targetRole}".
Use ONLY facts from the candidate profile below. NEVER invent a company, role, title, date, or metric.
${p?.hiringSignals?.length ? `Company hiring signals: ${p.hiringSignals.join(", ")}.` : ""}
${p?.atsKeywordBank?.required?.length ? `Mirror these ATS keywords where truthful: ${p.atsKeywordBank.required.join(", ")}.` : ""}
${useVoice ? "Match the candidate's calibrated writing voice." : "Use a clear professional voice."}
${attempt > 0 ? "A previous draft introduced ungrounded claims — be stricter: include ONLY profile facts." : ""}
Return ONLY the tailored résumé text.`;
  const resp = await gateway().complete({
    task: "resume.tailor", taskTier: "frontier",
    accountId: data.userId || SYSTEM_ACCOUNT_ID,
    idempotencyKey: `tailor-${data.idempotencyKey}-${attempt}`,
    maxTokens: 2500, temperature: 0.3,
    messages: [{ role: "system", content: system }, { role: "user", content: `## Profile:\n${profileText.slice(0, 10000)}\n\n## Target JD:\n${(data.targetJdText ?? data.targetRole).slice(0, 6000)}` }],
  });
  return resp.content;
}

async function succeed(data: TailorInput, generated: string, _profileText: string): Promise<void> {
  const citeId = `cite:tailor:${data.tailoredResumeId}`;
  void upsertKnowledgeRef({ knowledgeId: citeId, docType: "user-doc", sourceRef: `profile:${data.userId}`, confidence: 0.9 });
  const withCites = attachCiteMarkers(generated, [{ knowledgeId: citeId, docType: "user-doc", sourceRef: `profile:${data.userId}`, confidence: 0.9 }]);

  await sql().begin(async (tx) => {
    // [R7/BR-002.5] The build ledger debit + usage unit are written ONLY here (success path).
    const ledgerId = randomUUID();
    await tx`
      INSERT INTO billing_ledger (id, account_id, order_id, idempotency_key, entry_type, amount_cents, currency, description)
      VALUES (${ledgerId}, ${data.userId}, ${data.tailoredResumeId}, ${"build:" + data.tailoredResumeId},
              'debit', ${BUILD_COST_CENTS}, 'USD', 'F-002 tailored résumé build')
      ON CONFLICT (order_id, idempotency_key) DO NOTHING
    `;
    await tx`
      INSERT INTO usage_events (account_id, action, cost_cents, idempotency_key, task_tier)
      VALUES (${data.userId}, 'resume.tailor', ${BUILD_COST_CENTS}, ${"build-usage:" + data.tailoredResumeId}, 'frontier')
      ON CONFLICT (idempotency_key) DO NOTHING
    `;
    await tx`
      UPDATE tailored_resumes SET
        status = 'completed', generated_text = ${withCites.content},
        fabrication_scan_passed = true, citations = ${tx.json(withCites.citations as never)},
        ledger_entry_id = ${ledgerId}, model_version = ${hasLlmKeys() ? "claude-sonnet-4-6" : "mock-dev"},
        completed_at = now()
      WHERE id = ${data.tailoredResumeId}
    `;
  });
  console.log(`[tailor] ${data.tailoredResumeId} completed (charged 1 build unit)`);
}

async function fail(data: TailorInput, errorCode: string): Promise<void> {
  // [R7/R8/FR-073.4] No ledger debit, no usage unit — failed/halted work is never charged.
  await sql()`
    UPDATE tailored_resumes SET status = 'failed', fabrication_scan_passed = false, completed_at = now()
    WHERE id = ${data.tailoredResumeId}
  `;
  console.warn(`[tailor] ${data.tailoredResumeId} FAILED (${errorCode}) — not charged`);
  // Throw GENERATION_QUALITY surfaces to BullMQ for alerting; THIN_PROFILE is a clean stop.
  if (errorCode === "GENERATION_QUALITY") throw new Error(`tailor ${data.tailoredResumeId}: ${errorCode}`);
}

function buildProfileText(profile: Record<string, unknown> | undefined): string {
  if (!profile) return "";
  const parsed = (profile["parsed_text"] as string | null) ?? "";
  const exp = (profile["experience"] as Array<{ role?: string; company?: string; bullets?: string[] }> | null) ?? [];
  const expText = exp.map((e) => `${e.role ?? ""} at ${e.company ?? ""}: ${(e.bullets ?? []).join("; ")}`).join("\n");
  const skills = ((profile["skills"] as string[] | null) ?? []).join(", ");
  return [parsed, expText, skills ? `Skills: ${skills}` : ""].filter(Boolean).join("\n");
}
