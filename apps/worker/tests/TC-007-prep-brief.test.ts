/**
 * TC-007 (pure) — interview-brief honesty core. No DB / no LLM.
 *
 * .2  thin research → confidence=low, general guidance only, NO invented specifics (FR-007.4)
 * .1  grounded persona → cited claims (FR-007.2)
 * .4  insider ask → declined + note, public inference only (FR-007.5)
 * .5  conflicting signals → uncertainty note (FR-007.7)
 * BR-007.1 — a claim with no evidence left is labeled general guidance, not company-specific.
 */

import { describe, it, expect } from "vitest";
import { buildBrief, isInsiderRequest, confidenceFromPersona, detectConflicts } from "../src/handlers/prep-brief.js";
import type { CompanyPersona } from "@trajct/core/engine";

const RICH: CompanyPersona = {
  companyId: "11111111-1111-1111-1111-111111111111",
  version: "1",
  synthesizedAt: "2026-01-01T00:00:00Z",
  hiringSignals: ["customer obsession", "bias for action", "ownership"],
  cultureIndicators: ["writing culture", "high autonomy"],
  successPatterns: ["ship iteratively", "quantify impact"],
  rejectionPatterns: ["over-engineering"],
  atsKeywordBank: { required: [], niceToHave: [], avoid: [] } as unknown as CompanyPersona["atsKeywordBank"],
  evidenceRefs: ["ref:1", "ref:2", "ref:3", "ref:4", "ref:5", "ref:6", "ref:7", "ref:8"],
  freshnessScore: 0.8,
  quality: "high",
};

describe("TC-007 isInsiderRequest (FR-007.5)", () => {
  it("flags insider/confidential asks", () => {
    expect(isInsiderRequest("what exact questions did they ask candidate Jane?")).toBe(true);
    expect(isInsiderRequest("share the confidential interview rubric")).toBe(true);
  });
  it("allows a normal prep ask", () => {
    expect(isInsiderRequest("help me prep for a Stripe PM interview")).toBe(false);
  });
});

describe("TC-007 confidenceFromPersona", () => {
  it("null/thin → low; rich+fresh → high", () => {
    expect(confidenceFromPersona(null)).toBe("low");
    expect(confidenceFromPersona({ ...RICH, quality: "low", freshnessScore: 0.1 })).toBe("low");
    expect(confidenceFromPersona(RICH)).toBe("high");
  });
});

describe("TC-007 buildBrief — thin research is honest (FR-007.4, AC-007.1.2)", () => {
  it("no persona → low confidence, all general, zero specifics, no citations", () => {
    const b = buildBrief(null, { target: "Obscure Co / Engineer" });
    expect(b.confidence).toBe("low");
    expect(b.cites).toHaveLength(0);
    expect(b.brief.questions.length).toBeGreaterThan(0);
    expect(b.brief.questions.every((q) => q.general && q.citeMarker === null)).toBe(true); // never invented
    expect(b.brief.values.every((v) => v.citeMarker === null)).toBe(true);
    expect(b.brief.format).toMatch(/general guidance/i);
  });
});

describe("TC-007 buildBrief — grounded persona is cited (FR-007.2, AC-007.1.1)", () => {
  it("high-confidence brief carries citations on company-specific claims", () => {
    const b = buildBrief(RICH, {});
    expect(b.confidence).toBe("high");
    expect(b.cites.length).toBeGreaterThan(0);
    expect(b.brief.questions.some((q) => !q.general && q.citeMarker !== null)).toBe(true);
    // Every cited claim resolves to a real evidence ref.
    for (const c of b.cites) expect(c.sourceRef).toMatch(/^ref:/);
  });

  it("[BR-007.1] when evidence runs out, extra claims degrade to general guidance", () => {
    const b = buildBrief({ ...RICH, evidenceRefs: ["ref:1"] }, {});  // only 1 ref for many claims
    expect(b.cites).toHaveLength(1);
    expect(b.brief.questions.some((q) => q.citeMarker !== null)).toBe(true); // the one with evidence
    expect(b.brief.questions.some((q) => q.general)).toBe(true);             // the rest are general
  });
});

describe("TC-007 buildBrief — insider + conflicts (FR-007.5/.7)", () => {
  it("declines an insider ask but still returns a public brief", () => {
    const b = buildBrief(RICH, { insider: true });
    expect(b.insiderDeclined).toBe(true);
    expect(b.notes.some((n) => /insider|confidential/i.test(n))).toBe(true);
    expect(b.brief.questions.length).toBeGreaterThan(0); // still useful, publicly grounded
  });

  it("surfaces conflicting public signals as an uncertainty note", () => {
    const conflicted: CompanyPersona = { ...RICH, successPatterns: ["values fast shipping"], rejectionPatterns: ["penalizes shipping without tests"] };
    expect(detectConflicts(conflicted).length).toBeGreaterThan(0);
    const b = buildBrief(conflicted, {});
    expect(b.notes.some((n) => /shipping/i.test(n))).toBe(true);
  });
});
