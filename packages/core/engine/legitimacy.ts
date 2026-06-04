/**
 * F-059 — Ghost-posting / legitimacy filter.
 * Port of jobHunt/agents/legitimacy_agent.py — 4-signal scorer (equal weights v1).
 *
 *   Signal 1 — posting age   (0.25): >60d → 0.0; <7d → 1.0; linear between
 *   Signal 2 — URL reachable (0.25): HEAD 200 → 1.0; else 0.0
 *   Signal 3 — repost 90d    (0.25): count >3 same title+company → 0.0; 0 → 1.0
 *   Signal 5 — recent news   (0.25): hiring signal in last 30d → 1.0
 *                                    if PERPLEXITY_API_KEY absent → weight redistributed
 *
 * Tiers: ≥0.7 legitimate · 0.5–0.7 caution · <0.5 suspicious
 */

export const WEIGHT_AGE = 0.25;
export const WEIGHT_URL = 0.25;
export const WEIGHT_REPOST = 0.25;
export const WEIGHT_NEWS = 0.25;
export const TIER_LEGITIMATE_MIN = 0.7;
export const TIER_CAUTION_MIN = 0.5;

export type LegitimacyTier = "legitimate" | "caution" | "suspicious";

export interface LegitimacyResult {
  score: number;
  tier: LegitimacyTier;
  signals: { age: number; url: number; repost: number; news: number | null };
}

export interface LegitimacyInput {
  title: string;
  company: string;
  jdUrl: string;
  postedAt: string | null;
}

/** Injectable deps (for tests + offline runs). */
export interface LegitimacyDeps {
  nowMs: number;
  urlReachable: (url: string) => Promise<boolean>;
  repostCount: (title: string, company: string) => Promise<number>;
  newsSignal?: (company: string) => Promise<number>; // 0..1, omit when PERPLEXITY absent
}

const DAY_MS = 24 * 3600 * 1000;

/** Signal 1 — age score. >60d → 0; <7d → 1; linear between. */
export function ageScore(postedAt: string | null, nowMs: number): number {
  if (!postedAt) return 0.5; // unknown age → neutral
  const ageDays = (nowMs - new Date(postedAt).getTime()) / DAY_MS;
  if (ageDays >= 60) return 0.0;
  if (ageDays <= 7) return 1.0;
  return 1 - (ageDays - 7) / (60 - 7); // linear ramp down from 1.0 at 7d to 0.0 at 60d
}

/** Signal 3 — repost score. 0 reposts → 1.0; >3 → 0.0; linear between. */
export function repostScore(count: number): number {
  if (count <= 0) return 1.0;
  if (count > 3) return 0.0;
  return 1 - count / 4;
}

/** Composite, redistributing the news weight across the other three when news is unavailable. */
export function compositeScore(
  signals: { age: number; url: number; repost: number; news: number | null }
): number {
  if (signals.news === null) {
    // Redistribute the news weight equally across the 3 present signals.
    const w = 1 / 3;
    return signals.age * w + signals.url * w + signals.repost * w;
  }
  return (
    signals.age * WEIGHT_AGE +
    signals.url * WEIGHT_URL +
    signals.repost * WEIGHT_REPOST +
    signals.news * WEIGHT_NEWS
  );
}

export function tierFor(score: number): LegitimacyTier {
  if (score >= TIER_LEGITIMATE_MIN) return "legitimate";
  if (score >= TIER_CAUTION_MIN) return "caution";
  return "suspicious";
}

/** Score a job's legitimacy from the 4 signals. */
export async function scoreJobLegitimacy(job: LegitimacyInput, deps: LegitimacyDeps): Promise<LegitimacyResult> {
  const age = ageScore(job.postedAt, deps.nowMs);

  const url = job.jdUrl ? (await deps.urlReachable(job.jdUrl).catch(() => false) ? 1.0 : 0.0) : 0.0;

  const reposts = await deps.repostCount(job.title, job.company).catch(() => 0);
  const repost = repostScore(reposts);

  // PERPLEXITY_API_KEY absent (no newsSignal dep) → news = null → weight redistributed.
  const news = deps.newsSignal ? await deps.newsSignal(job.company).catch(() => 0) : null;

  const signals = { age, url, repost, news };
  const score = Math.max(0, Math.min(1, compositeScore(signals)));
  return { score, tier: tierFor(score), signals };
}

/** Default URL reachability via HEAD request (24h-cacheable in callers). */
export async function defaultUrlReachable(url: string): Promise<boolean> {
  try {
    const resp = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
    return resp.ok;
  } catch {
    return false;
  }
}
