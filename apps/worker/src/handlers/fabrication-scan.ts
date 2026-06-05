/**
 * F-002 / FR-002.8, BR-002.1 — Fabrication (grounding) scan.
 *
 * [FIX R8] FAIL-CLOSED: if the scanner itself errors, that is NOT CLEAN — the caller must
 * not serve and not charge. A guard outage must never become a fabrication bypass. Hence
 * scanFabrication throws FabricationScanError on scanner failure (the caller treats a throw
 * exactly like a detected fabrication: fail the build).
 *
 * Detects any company / role / date / metric in the generated résumé that is NOT traceable
 * to the user's master profile. Heuristic fast-path + LLM judge (utility tier) when keys exist.
 */

import { gateway, SYSTEM_ACCOUNT_ID } from "../gateway.js";

export class FabricationScanError extends Error {
  constructor(reason: string) {
    super(`Fabrication scan failed (treated as NOT clean): ${reason}`);
    this.name = "FabricationScanError";
  }
}

export interface FabricationResult {
  clean: boolean;
  ungrounded: string[];
}

function hasLlmKeys(): boolean {
  return !!(process.env["ANTHROPIC_API_KEY"] || process.env["OPENAI_API_KEY"] || process.env["OPENROUTER_API_KEY"] || process.env["GOOGLE_API_KEY"]);
}

/**
 * Extract capitalized company-like tokens that follow "at"/"@" on the SAME line.
 * Tight on purpose: no periods/newlines (so it doesn't capture across sentences), and not
 * "for" (which usually precedes a role, not a company) — keeps the heuristic low-false-positive.
 */
function companyTokens(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/\b(?:at|@)[ \t]+([A-Z][A-Za-z0-9&]+(?:[ \t]+[A-Z][A-Za-z0-9&]+){0,2})/g)) {
    if (m[1]) out.add(m[1].trim());
  }
  return [...out];
}

/**
 * Scan generated content for claims not grounded in the profile.
 * @throws FabricationScanError if the (LLM) scanner errors — fail-closed (R8).
 */
export async function scanFabrication(
  generated: string,
  profileText: string,
  idempotencyKey: string
): Promise<FabricationResult> {
  // Heuristic: any company named in the generated résumé that is absent from the profile.
  const profileLower = profileText.toLowerCase();
  const ungrounded = companyTokens(generated).filter((c) => !profileLower.includes(c.toLowerCase()));

  if (!hasLlmKeys()) {
    // Dev / no-LLM: heuristic only.
    return { clean: ungrounded.length === 0, ungrounded };
  }

  // LLM judge — the real guard. A scanner error is FAIL-CLOSED (throws).
  let raw: string;
  try {
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
    raw = resp.content;
  } catch (err) {
    // [R8] scanner outage → NOT clean. Never let the guard's failure become a bypass.
    throw new FabricationScanError(err instanceof Error ? err.message : String(err));
  }

  try {
    const j = JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "")) as { clean?: boolean; ungrounded?: string[] };
    const llmUngrounded = (j.ungrounded ?? []).map(String);
    const allUngrounded = [...new Set([...ungrounded, ...llmUngrounded])];
    return { clean: j.clean === true && allUngrounded.length === 0, ungrounded: allUngrounded };
  } catch {
    // Unparseable judge output is also fail-closed.
    throw new FabricationScanError("scanner returned unparseable output");
  }
}
