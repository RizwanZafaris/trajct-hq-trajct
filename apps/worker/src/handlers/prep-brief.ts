/**
 * F-007 — interview-brief builder (pure; the honest-AI core).
 *
 * Honesty rules (NEVER bypass):
 *  - [FR-007.4] Thin research (no/weak persona) → confidence='low' and EVERY section is general
 *    best-practice — we never invent company-specific specifics.
 *  - [BR-007.1] A claim without a citation is labeled "general guidance" (general=true, no marker),
 *    not presented as company-specific fact.
 *  - [FR-007.5] An insider/confidential ask is declined; we still return a publicly-grounded brief.
 *  - [FR-007.7] Conflicting public signals are surfaced as an uncertainty note, not one fabricated answer.
 *
 * Grounded in the per-company persona (Engine F-052); citations come from persona.evidenceRefs.
 */

import type { CompanyPersona } from "@trajct/core/engine";
import type { PrepBrief, PrepBriefQuestion, PrepCite, PrepConfidence, PrepStarMapping, PrepValue } from "@trajct/contracts";

export interface BriefOptions {
  target?: string;
  starStoryIds?: string[];      // F-010 STAR story ids → mapped onto questions
  insider?: boolean;            // the request text asked for insider/confidential content
  prepType?: "standard" | "deep" | "leadership";
}

export interface BuiltBrief {
  brief: PrepBrief;
  cites: PrepCite[];
  confidence: PrepConfidence;
  starMappings: PrepStarMapping[];
  notes: string[];
  insiderDeclined: boolean;
}

const GENERAL_QUESTIONS: Array<Pick<PrepBriefQuestion, "question" | "type" | "difficulty">> = [
  { question: "Walk me through a project you're proud of and your specific role in it.", type: "behavioral", difficulty: "medium" },
  { question: "Tell me about a time you handled conflicting priorities.", type: "situational", difficulty: "medium" },
  { question: "Describe a technical decision you made and its trade-offs.", type: "technical", difficulty: "hard" },
  { question: "How do you align your work with a team's goals and culture?", type: "culture", difficulty: "easy" },
  { question: "Tell me about a failure and what you took away from it.", type: "behavioral", difficulty: "medium" },
];

const GENERAL_VALUES = ["Ownership and follow-through", "Clear communication", "Collaboration", "Bias toward measurable impact"];

const FRAMEWORKS = [
  "STAR (Situation, Task, Action, Result) for behavioral answers",
  "Trade-off framing (options → decision → why) for technical questions",
  "Metrics-first for impact stories",
];

/** FR-007.5 — does the ask require non-public / insider knowledge? */
export function isInsiderRequest(text: string): boolean {
  const t = text.toLowerCase();
  if (/\b(insider|confidential|leaked|non[- ]public|nda)\b/.test(t)) return true;
  if (/\bexact\b[^.?!]*\bquestions?\b/.test(t)) return true;                       // "the exact questions"
  if (/\bquestions?\b[^.?!]*\b(asked|ask)\b[^.?!]*\bcandidate/.test(t)) return true; // "questions they asked candidate X"
  if (/\bwhat\b[^.?!]*\b(did|do)\b[^.?!]*\bask\b/.test(t)) return true;
  return false;
}

export function confidenceFromPersona(persona: CompanyPersona | null): PrepConfidence {
  if (!persona) return "low";
  const signals = persona.hiringSignals.length + persona.successPatterns.length;
  if (persona.quality === "low" || persona.freshnessScore < 0.3 || signals < 2) return "low";
  if (persona.quality === "high" && persona.freshnessScore >= 0.6 && signals >= 4) return "high";
  return "med";
}

/** FR-007.7 — surface conflicting public signals (same theme as both success and rejection). */
export function detectConflicts(persona: CompanyPersona | null): string[] {
  if (!persona) return [];
  const succWords = new Set(persona.successPatterns.join(" ").toLowerCase().split(/\W+/).filter((w) => w.length > 4));
  for (const rej of persona.rejectionPatterns) {
    const overlap = rej.toLowerCase().split(/\W+/).find((w) => w.length > 4 && succWords.has(w));
    if (overlap) {
      return [`Public sources differ on "${overlap}" — it appears as both a success and a rejection signal. Treat it as an uncertainty, not a rule.`];
    }
  }
  return [];
}

export function buildBrief(persona: CompanyPersona | null, opts: BriefOptions = {}): BuiltBrief {
  const insiderDeclined = !!opts.insider;
  const notes = detectConflicts(persona);
  if (insiderDeclined) {
    notes.unshift("I won't assert insider or confidential interview content. This brief uses publicly-grounded inference only.");
  }

  const confidence = confidenceFromPersona(persona);
  const grounded = confidence !== "low" && !!persona;   // only ground specifics when research is solid
  const cites: PrepCite[] = [];
  const refs = persona?.evidenceRefs ?? [];
  let citeN = 0;
  const nextCite = (claim: string): string | null => {
    if (citeN >= refs.length) return null;              // no evidence left → general guidance (BR-007.1)
    const marker = `cite:prep:${citeN + 1}`;
    cites.push({ marker, sourceRef: refs[citeN] as string, claim });
    citeN++;
    return marker;
  };

  const questions: PrepBriefQuestion[] = [];
  if (grounded && persona) {
    for (const sig of persona.hiringSignals.slice(0, 3)) {
      const claim = `This team weights "${sig}".`;
      const marker = nextCite(claim);
      questions.push({ question: `Describe a time you demonstrated ${sig}.`, type: "behavioral", rationale: claim, citeMarker: marker, general: marker === null, difficulty: "medium" });
    }
    for (const pat of persona.successPatterns.slice(0, 2)) {
      const claim = `Strong candidates here ${pat}.`;
      const marker = nextCite(claim);
      questions.push({ question: `Give an example where you ${pat}.`, type: "situational", rationale: claim, citeMarker: marker, general: marker === null, difficulty: "hard" });
    }
  }
  // Always include general best-practice questions (explicitly general — never invented specifics).
  for (const g of GENERAL_QUESTIONS) {
    questions.push({ ...g, rationale: "General interview best-practice.", citeMarker: null, general: true });
  }

  const values: PrepValue[] = [];
  if (grounded && persona) {
    for (const c of persona.cultureIndicators.slice(0, 4)) {
      values.push({ value: c, citeMarker: nextCite(`Culture signal: ${c}.`) });
    }
  }
  if (values.length === 0) {
    for (const v of GENERAL_VALUES) values.push({ value: v, citeMarker: null });
  }

  const format = grounded
    ? "Typical stages: recruiter screen → role/technical round(s) → values/behavioral → final. Confirm specifics with your recruiter."
    : "General guidance: expect a recruiter screen, one or more role rounds, and a values/behavioral round — we couldn't confirm this company's exact process.";

  const brief: PrepBrief = { questions, format, values, frameworks: FRAMEWORKS };

  // FR-007.3 — map provided STAR story ids onto the leading questions.
  const starMappings: PrepStarMapping[] = (opts.starStoryIds ?? [])
    .slice(0, questions.length)
    .map((storyId, i) => ({ questionIndex: i, storyId }));

  return { brief, cites, confidence, starMappings, notes, insiderDeclined };
}
