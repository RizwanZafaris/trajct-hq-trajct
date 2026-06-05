/**
 * TC-001.1 — Score→band mapping (BR-001.9 EXACT thresholds).
 * A≥85 · B 70–84 · C 55–69 · D 40–54 · F<40. The boundaries are the acceptance criteria.
 *
 * Covers: F-001 BR-001.9
 */

import { describe, it, expect } from "vitest";
import { scoreToBand, DiagnoseRequestSchema, DiagnosticResultSchema } from "../src/diagnostic.js";

describe("TC-001.1 band mapping (BR-001.9)", () => {
  it("exact boundaries", () => {
    expect(scoreToBand(100)).toBe("A");
    expect(scoreToBand(85)).toBe("A");   // A ≥ 85
    expect(scoreToBand(84)).toBe("B");
    expect(scoreToBand(70)).toBe("B");   // B 70–84
    expect(scoreToBand(69)).toBe("C");
    expect(scoreToBand(55)).toBe("C");   // C 55–69
    expect(scoreToBand(54)).toBe("D");
    expect(scoreToBand(40)).toBe("D");   // D 40–54
    expect(scoreToBand(39)).toBe("F");
    expect(scoreToBand(0)).toBe("F");    // F < 40
  });

  it("clamps + rounds out-of-range/fractional input", () => {
    expect(scoreToBand(150)).toBe("A");
    expect(scoreToBand(-10)).toBe("F");
    expect(scoreToBand(84.6)).toBe("A"); // rounds to 85
  });

  it("request schema enforces FRD limits (50k résumé, 20k target)", () => {
    expect(() => DiagnoseRequestSchema.parse({ target: "x".repeat(20_001) })).toThrow();
    expect(() => DiagnoseRequestSchema.parse({ resume_text: "x".repeat(50_001), target: "role" })).toThrow();
    expect(DiagnoseRequestSchema.parse({ target: "Senior PM", context: "laid_off" }).context).toBe("laid_off");
  });

  it("result schema accepts a valid diagnostic", () => {
    const r = DiagnosticResultSchema.parse({
      score: 62, band: "C",
      reasons: [{ issue: "i", fix: "f", evidence_ref: "e", severity: "high" }],
      dimensions: [{ dimension: "role_fit", score: 60, rationale: "r" }],
      confidence: "high", diag_token: "00000000-0000-0000-0000-000000000001",
      citations: [], modelVersion: "m",
    });
    expect(r.band).toBe("C");
  });
});
