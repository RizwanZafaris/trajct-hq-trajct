/**
 * F-055 — Per-user voice calibration.
 * Port of jobHunt/agents/voice_injector.py + linkedin_voice_extractor.py.
 *
 * Boundary rule A: engine never imports packages/ai. The AI `complete` is INJECTED
 * by the caller (worker/service which may import the Gateway). Engine owns the
 * logic, the prompts, the persistence, and the cold-start rule.
 *
 * COLD-START: voice is enhancement, not a blocker. <3 samples → injection is skipped
 * and the original content is returned unchanged (never fails).
 */

import postgres from "postgres";

/** Injected completion fn — caller wires Gateway.complete (utility tier). */
export type EngineComplete = (system: string, user: string) => Promise<string>;

export interface VoiceProfile {
  userId: string;
  sentenceLengthAvg: number;
  formalityScore: number;
  activeVsPassivePct: number;
  preferredTransitions: string[];
  signaturePhrases: string[];
  sampleCount: number;
}

const MIN_SAMPLES = 3;

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

const EXTRACT_SYSTEM = `You are a writing-style analyst. Given several writing samples from one person,
extract their voice fingerprint. Reply ONLY with strict JSON:
{
  "sentence_length_avg": <number>,
  "formality_score": <0..1>,
  "active_vs_passive_pct": <0..100>,
  "preferred_transitions": [<string>, ...],
  "signature_phrases": [<string>, ...]
}`;

/** Extract a voice profile from writing samples and persist it. */
export async function voiceExtract(
  userId: string,
  samples: string[],
  complete: EngineComplete
): Promise<VoiceProfile> {
  const sql = getSql();

  if (samples.length < MIN_SAMPLES) {
    // Not enough signal — persist a low-confidence stub so callers know to skip injection.
    const stub: VoiceProfile = {
      userId, sentenceLengthAvg: 0, formalityScore: 0.5, activeVsPassivePct: 50,
      preferredTransitions: [], signaturePhrases: [], sampleCount: samples.length,
    };
    await persist(sql, stub);
    return stub;
  }

  const user = `Writing samples:\n\n${samples.map((s, i) => `[Sample ${i + 1}]\n${s}`).join("\n\n")}`;
  let parsed: Partial<VoiceProfile> = {};
  try {
    const raw = await complete(EXTRACT_SYSTEM, user);
    const json = JSON.parse(stripFences(raw)) as Record<string, unknown>;
    parsed = {
      sentenceLengthAvg: Number(json["sentence_length_avg"] ?? 0),
      formalityScore: Number(json["formality_score"] ?? 0.5),
      activeVsPassivePct: Number(json["active_vs_passive_pct"] ?? 50),
      preferredTransitions: (json["preferred_transitions"] as string[]) ?? [],
      signaturePhrases: (json["signature_phrases"] as string[]) ?? [],
    };
  } catch {
    // AI failed — store a neutral profile rather than failing the user flow.
    parsed = { sentenceLengthAvg: 0, formalityScore: 0.5, activeVsPassivePct: 50, preferredTransitions: [], signaturePhrases: [] };
  }

  const profile: VoiceProfile = {
    userId,
    sentenceLengthAvg: parsed.sentenceLengthAvg ?? 0,
    formalityScore: parsed.formalityScore ?? 0.5,
    activeVsPassivePct: parsed.activeVsPassivePct ?? 50,
    preferredTransitions: parsed.preferredTransitions ?? [],
    signaturePhrases: parsed.signaturePhrases ?? [],
    sampleCount: samples.length,
  };
  await persist(sql, profile);
  return profile;
}

/**
 * Rewrite content in the user's voice. COLD-START: if no profile or <3 samples,
 * returns the original content unchanged (never throws, never blocks).
 */
export async function voiceInject(
  content: string,
  userId: string | null,
  complete: EngineComplete
): Promise<string> {
  if (!userId) return content;

  const sql = getSql();
  const [row] = await sql`SELECT * FROM user_voice_profiles WHERE user_id = ${userId} LIMIT 1`;
  if (!row || (row["sample_count"] as number) < MIN_SAMPLES) return content; // cold-start: unchanged

  const profile = rowToProfile(row);
  const system = `Rewrite the user's content to match their voice fingerprint WITHOUT changing facts or meaning.
Voice: avg sentence length ~${profile.sentenceLengthAvg} words, formality ${profile.formalityScore},
${profile.activeVsPassivePct}% active voice. Favour transitions: ${profile.preferredTransitions.join(", ") || "natural"}.
Signature phrases (use sparingly, only if they fit): ${profile.signaturePhrases.join(", ") || "none"}.
Return ONLY the rewritten text.`;

  try {
    const rewritten = await complete(system, content);
    return rewritten.trim() || content;
  } catch {
    return content; // enhancement failure → original, never block
  }
}

export async function getVoiceProfile(userId: string): Promise<VoiceProfile | null> {
  const sql = getSql();
  const [row] = await sql`SELECT * FROM user_voice_profiles WHERE user_id = ${userId} LIMIT 1`;
  return row ? rowToProfile(row) : null;
}

// --- helpers ---------------------------------------------------------------

function stripFences(s: string): string {
  return s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function rowToProfile(row: Record<string, unknown>): VoiceProfile {
  return {
    userId: row["user_id"] as string,
    sentenceLengthAvg: parseFloat(String(row["sentence_length_avg"] ?? "0")),
    formalityScore: parseFloat(String(row["formality_score"] ?? "0.5")),
    activeVsPassivePct: parseFloat(String(row["active_vs_passive_pct"] ?? "50")),
    preferredTransitions: (row["preferred_transitions"] as string[]) ?? [],
    signaturePhrases: (row["signature_phrases"] as string[]) ?? [],
    sampleCount: (row["sample_count"] as number) ?? 0,
  };
}

async function persist(sql: ReturnType<typeof postgres>, p: VoiceProfile): Promise<void> {
  await sql`
    INSERT INTO user_voice_profiles
      (user_id, sentence_length_avg, formality_score, active_vs_passive_pct,
       preferred_transitions, signature_phrases, sample_count, updated_at)
    VALUES
      (${p.userId}, ${p.sentenceLengthAvg}, ${p.formalityScore}, ${p.activeVsPassivePct},
       ${sql.array(p.preferredTransitions)}, ${sql.array(p.signaturePhrases)}, ${p.sampleCount}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      sentence_length_avg = EXCLUDED.sentence_length_avg,
      formality_score = EXCLUDED.formality_score,
      active_vs_passive_pct = EXCLUDED.active_vs_passive_pct,
      preferred_transitions = EXCLUDED.preferred_transitions,
      signature_phrases = EXCLUDED.signature_phrases,
      sample_count = EXCLUDED.sample_count,
      updated_at = NOW()
  `;
}
