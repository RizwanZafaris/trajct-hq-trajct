/**
 * Shared grounding (fabrication) scan — the canonical guard behind F-002 (tailor) and
 * F-004 (chat-edit). Confirms generated content introduces NO company/role/date/metric
 * absent from the candidate's ground-truth profile.
 *
 * [FAIL-CLOSED] If the (LLM) judge errors, that is NOT clean — the caller must not serve
 * and must not charge. A guard outage must never become a fabrication bypass. Hence the
 * judge's throw propagates as GroundingScanError; callers treat a throw exactly like a
 * detected fabrication. (F-002 R8 / F-004 BR-004.2.)
 *
 * Core stays app-agnostic: the LLM judge is INJECTED by the app (worker/api) so this module
 * never imports an app-level gateway. Without a judge (dev / no keys) the heuristic is the guard.
 */

export class GroundingScanError extends Error {
  constructor(reason: string) {
    super(`Grounding scan failed (treated as NOT clean): ${reason}`);
    this.name = "GroundingScanError";
  }
}

export interface GroundingResult {
  clean: boolean;
  ungrounded: string[];
}

/** An optional LLM judge. MUST throw on scanner error (so the scan fails closed). */
export type GroundingJudge = (
  generated: string,
  profileText: string
) => Promise<{ clean: boolean; ungrounded: string[] }>;

/**
 * Extract company-like tokens that follow "at"/"@" on the SAME line. Tight on purpose:
 * no periods/newlines (won't capture across sentences) and not "for" (usually a role) —
 * a low-false-positive heuristic that runs even with no LLM keys.
 */
export function companyTokens(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/\b(?:at|@)[ \t]+([A-Z][A-Za-z0-9&]+(?:[ \t]+[A-Z][A-Za-z0-9&]+){0,2})/g)) {
    if (m[1]) out.add(m[1].trim());
  }
  return [...out];
}

/**
 * @param judge optional LLM judge; if provided it is the real guard and its throw is fail-closed.
 * @throws GroundingScanError when the judge errors (NOT clean).
 */
export async function scanGrounding(
  generated: string,
  profileText: string,
  judge?: GroundingJudge
): Promise<GroundingResult> {
  const profileLower = profileText.toLowerCase();
  const heuristicUngrounded = companyTokens(generated).filter((c) => !profileLower.includes(c.toLowerCase()));

  if (!judge) {
    return { clean: heuristicUngrounded.length === 0, ungrounded: heuristicUngrounded };
  }

  let judged: { clean: boolean; ungrounded: string[] };
  try {
    judged = await judge(generated, profileText);
  } catch (err) {
    // FAIL-CLOSED: never let the guard's failure become a bypass.
    throw new GroundingScanError(err instanceof Error ? err.message : String(err));
  }

  const ungrounded = [...new Set([...heuristicUngrounded, ...(judged.ungrounded ?? []).map(String)])];
  return { clean: judged.clean === true && ungrounded.length === 0, ungrounded };
}
