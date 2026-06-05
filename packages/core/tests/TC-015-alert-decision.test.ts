/**
 * TC-015 — the alert gate (pure). Rare, relevant, fatigue-free (FRD §4.15.8).
 * Covers FR-015.2/.6/.7/.8, BR-015.2/.3/.4/.5, AC-015.1.2/.3/.5/.6.
 */

import { describe, it, expect } from "vitest";
import { decideAlert, bandMeetsThreshold, type AlertInput } from "../engine/alert-decision.js";

const BASE: AlertInput = {
  legitimacyTier: "legitimate", fitBand: "A", fitThreshold: "B",
  isDuplicate: false, todayCount: 0, capPerDay: 5, capMode: "instant",
  paused: false, snoozedUntilMs: null, nowMs: 1000,
};

describe("TC-015 decideAlert", () => {
  it("clean, legitimate, in-cap fit → dispatch", () => {
    expect(decideAlert(BASE)).toEqual({ action: "dispatch", reason: "ok" });
  });
  it("[BR-015.2/AC-015.1.2] ghost/illegitimate posting → suppress (no alert)", () => {
    expect(decideAlert({ ...BASE, legitimacyTier: "suspicious" })).toEqual({ action: "suppress", reason: "illegitimate" });
    expect(decideAlert({ ...BASE, legitimacyTier: "caution" })).toEqual({ action: "suppress", reason: "illegitimate" });
  });
  it("[BR-015.5/AC-015.1.5] below fit threshold → suppress (quality bar)", () => {
    expect(decideAlert({ ...BASE, fitBand: "C", fitThreshold: "B" })).toEqual({ action: "suppress", reason: "below_threshold" });
  });
  it("[BR-015.3/AC-015.1.3] duplicate role → suppress (never alert twice)", () => {
    expect(decideAlert({ ...BASE, isDuplicate: true })).toEqual({ action: "suppress", reason: "duplicate" });
  });
  it("[BR-015.4/AC-015.1.6] over daily cap → batch (digest, not dropped)", () => {
    expect(decideAlert({ ...BASE, todayCount: 5, capPerDay: 5 })).toEqual({ action: "batch", reason: "over_cap" });
  });
  it("digest mode always batches", () => {
    expect(decideAlert({ ...BASE, capMode: "digest" })).toEqual({ action: "batch", reason: "over_cap" });
  });
  it("[AC-015.1.8] paused → suppress; [AC-015.1.4] snoozed → suppress, then auto-resumes", () => {
    expect(decideAlert({ ...BASE, paused: true })).toEqual({ action: "suppress", reason: "paused" });
    expect(decideAlert({ ...BASE, snoozedUntilMs: 2000, nowMs: 1000 })).toEqual({ action: "suppress", reason: "snoozed" });
    expect(decideAlert({ ...BASE, snoozedUntilMs: 500, nowMs: 1000 })).toEqual({ action: "dispatch", reason: "ok" }); // window elapsed
  });
  it("legitimacy is gated BEFORE dedupe (ordering)", () => {
    expect(decideAlert({ ...BASE, legitimacyTier: "suspicious", isDuplicate: true }).reason).toBe("illegitimate");
  });
  it("bandMeetsThreshold", () => {
    expect(bandMeetsThreshold("A", "B")).toBe(true);
    expect(bandMeetsThreshold("B", "B")).toBe(true);
    expect(bandMeetsThreshold("C", "B")).toBe(false);
  });
});
