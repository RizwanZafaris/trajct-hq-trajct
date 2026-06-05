/**
 * F-002 / FR-002.8, BR-002.1 — Fabrication (grounding) scan.
 *
 * This is a THIN worker-side adapter over the canonical, fail-closed grounding scan in
 * @trajct/core/engine (F-004). There is now exactly ONE implementation of this security-critical
 * check; here we only (a) inject a worker-gateway-backed LLM judge (metered against the system
 * account) and (b) re-throw the engine's GroundingScanError under the historical
 * `FabricationScanError` name so existing callers (tailor.ts) and tests (TC-002.4) that switch on
 * `instanceof FabricationScanError` keep working unchanged.
 *
 * [FIX R8] FAIL-CLOSED: if the scanner itself errors, that is NOT CLEAN — the caller must not
 * serve and not charge. A guard outage must never become a fabrication bypass. The engine enforces
 * this (judge throw → GroundingScanError); we preserve it (→ FabricationScanError). The caller
 * treats a throw exactly like a detected fabrication: fail the build.
 */

import { scanGrounding, GroundingScanError, type GroundingResult, type GroundingJudge } from "@trajct/core/engine";
import { gateway, SYSTEM_ACCOUNT_ID } from "../gateway.js";

export class FabricationScanError extends Error {
  constructor(reason: string, options?: { cause?: unknown }) {
    super(`Fabrication scan failed (treated as NOT clean): ${reason}`, options);
    this.name = "FabricationScanError";
  }
}

/** Same shape as the engine's GroundingResult — aliased so there is a single definition. */
export type FabricationResult = GroundingResult;

function hasLlmKeys(): boolean {
  return !!(process.env["ANTHROPIC_API_KEY"] || process.env["OPENAI_API_KEY"] || process.env["OPENROUTER_API_KEY"] || process.env["GOOGLE_API_KEY"]);
}

/**
 * The worker's LLM judge for the engine scan: a utility-tier gateway call, metered against the
 * system account. The engine merges this verdict with its own company-token heuristic and applies
 * fail-closed semantics — a throw here (gateway outage OR unparseable output via JSON.parse) is
 * caught by scanGrounding and surfaced as GroundingScanError.
 */
function gatewayJudge(idempotencyKey: string): GroundingJudge {
  return async (generated, profileText) => {
    const resp = await gateway().complete({
      task: "resume.fabrication_scan",
      taskTier: "utility",
      accountId: SYSTEM_ACCOUNT_ID,
      idempotencyKey: `fab-${idempotencyKey}`,
      jsonMode: true,
      maxTokens: 600,
      messages: [
        { role: "system", content: `You verify a tailored résumé introduces NO company, role, title, date, or metric absent from the candidate's profile. Reply ONLY JSON: {"clean": true|false, "ungrounded": ["..."]}.` },
        { role: "user", content: `## Profile (ground truth):\n${profileText.slice(0, 8000)}\n\n## Tailored résumé:\n${generated.slice(0, 8000)}` },
      ],
    });
    const j = JSON.parse(resp.content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "")) as { clean?: boolean; ungrounded?: string[] };
    return { clean: j.clean === true, ungrounded: (j.ungrounded ?? []).map(String) };
  };
}

/**
 * Scan generated content for claims not grounded in the profile. Delegates to the canonical
 * engine scan; injects the worker gateway judge only when LLM keys exist (heuristic-only in dev).
 * @throws FabricationScanError if the scan fails — fail-closed (R8).
 */
export async function scanFabrication(
  generated: string,
  profileText: string,
  idempotencyKey: string
): Promise<FabricationResult> {
  try {
    return await scanGrounding(generated, profileText, hasLlmKeys() ? gatewayJudge(idempotencyKey) : undefined);
  } catch (err) {
    // [R8] Re-throw the engine's fail-closed error under the worker's historical name so callers
    // and tests that switch on `instanceof FabricationScanError` keep working. Detail is preserved
    // via `cause` (the original GroundingScanError) rather than re-prefixing its message.
    if (err instanceof GroundingScanError) throw new FabricationScanError("grounding scan failed", { cause: err });
    throw err;
  }
}
