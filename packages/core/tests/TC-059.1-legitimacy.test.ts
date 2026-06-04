/**
 * TC-059.1 — Ghost-posting / legitimacy filter (pure scorer).
 *
 * - Age > 60d → signal 1 = 0.0;  Age < 7d → signal 1 = 1.0
 * - URL 404 → signal 2 = 0.0
 * - Repost count > 3 in 90d → signal 3 = 0.0
 * - Composite < 0.5 → tier 'suspicious'
 * - PERPLEXITY_API_KEY absent (no newsSignal) → weight redistributed gracefully
 *
 * Covers: F-059
 */

import { describe, it, expect } from "vitest";
import {
  ageScore, repostScore, compositeScore, tierFor, scoreJobLegitimacy,
} from "../engine/legitimacy.js";

const DAY = 24 * 3600 * 1000;
const NOW = 1_900_000_000_000; // fixed clock

describe("TC-059.1 Legitimacy filter", () => {
  it("age > 60d → 0.0", () => {
    expect(ageScore(new Date(NOW - 90 * DAY).toISOString(), NOW)).toBe(0.0);
  });

  it("age < 7d → 1.0", () => {
    expect(ageScore(new Date(NOW - 2 * DAY).toISOString(), NOW)).toBe(1.0);
  });

  it("age between 7 and 60 → linear ramp", () => {
    const s = ageScore(new Date(NOW - 33.5 * DAY).toISOString(), NOW);
    expect(s).toBeGreaterThan(0.4);
    expect(s).toBeLessThan(0.6);
  });

  it("repost count > 3 → 0.0; 0 reposts → 1.0", () => {
    expect(repostScore(4)).toBe(0.0);
    expect(repostScore(0)).toBe(1.0);
  });

  it("composite < 0.5 → suspicious", () => {
    const score = compositeScore({ age: 0, url: 0, repost: 0.4, news: 0 });
    expect(score).toBeLessThan(0.5);
    expect(tierFor(score)).toBe("suspicious");
  });

  it("all-strong signals → legitimate", () => {
    const score = compositeScore({ age: 1, url: 1, repost: 1, news: 1 });
    expect(score).toBeCloseTo(1.0);
    expect(tierFor(score)).toBe("legitimate");
  });

  it("PERPLEXITY absent (news=null) → redistributes across 3 signals", () => {
    // No news; the other three are perfect → composite should be 1.0 (not 0.75).
    const score = compositeScore({ age: 1, url: 1, repost: 1, news: null });
    expect(score).toBeCloseTo(1.0);
  });

  it("scoreJobLegitimacy: 404 URL drives signal 2 to 0; news omitted redistributes", async () => {
    const result = await scoreJobLegitimacy(
      { title: "Eng", company: "Acme", jdUrl: "https://x.test/job", postedAt: new Date(NOW - 90 * DAY).toISOString() },
      {
        nowMs: NOW,
        urlReachable: async () => false, // 404
        repostCount: async () => 5,      // heavy repost
        // newsSignal omitted → PERPLEXITY absent path
      }
    );
    expect(result.signals.url).toBe(0.0);
    expect(result.signals.age).toBe(0.0);
    expect(result.signals.repost).toBe(0.0);
    expect(result.signals.news).toBeNull();
    expect(result.tier).toBe("suspicious");
  });
});
