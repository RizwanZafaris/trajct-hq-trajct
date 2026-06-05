/**
 * F-015 — the alert gate (pure). Makes alerts rare, relevant, and fatigue-free; the decision the
 * monitoring cron applies before dispatching (FRD §4.15.8 state model). Order matters:
 *
 *   paused/snoozed → legitimacy (F-059) → fit threshold → dedupe → daily cap.
 *
 * Honest-by-construction: a ghost/recycled posting (BR-015.2) or a below-threshold role (BR-015.5)
 * NEVER alerts; a duplicate (BR-015.3) is suppressed; over the daily cap (BR-015.4) batches to a
 * digest instead of firing. Alerts are surface-only — the system never auto-applies (FR-015.9).
 */

import type { LegitimacyTier } from "./legitimacy.js";

export type AlertBand = "A" | "B" | "C" | "D" | "F";
export type AlertAction = "dispatch" | "suppress" | "batch";
export type AlertReason = "ok" | "illegitimate" | "below_threshold" | "duplicate" | "over_cap" | "paused" | "snoozed";

export interface AlertInput {
  legitimacyTier: LegitimacyTier;       // F-059 — only "legitimate" may alert
  fitBand: AlertBand;                   // candidate's personalized fit (not keyword match)
  fitThreshold: "A" | "B" | "C";        // monitor minimum band
  isDuplicate: boolean;                 // content+URL hash already alerted (BR-015.3)
  todayCount: number;                   // alerts already sent today
  capPerDay: number;                    // daily fair-use cap
  capMode: "instant" | "digest";        // digest always batches
  paused: boolean;
  snoozedUntilMs: number | null;        // snooze window end (epoch ms), or null
  nowMs: number;
}

export interface AlertResult { action: AlertAction; reason: AlertReason; }

const BAND_RANK: Record<AlertBand, number> = { A: 5, B: 4, C: 3, D: 2, F: 1 };

export function bandMeetsThreshold(band: AlertBand, threshold: "A" | "B" | "C"): boolean {
  return BAND_RANK[band] >= BAND_RANK[threshold];
}

export function decideAlert(input: AlertInput): AlertResult {
  if (input.paused) return { action: "suppress", reason: "paused" };
  if (input.snoozedUntilMs !== null && input.nowMs < input.snoozedUntilMs) {
    return { action: "suppress", reason: "snoozed" };
  }
  // BR-015.2 — legitimacy gate BEFORE any alert (ghost/recycled never alert).
  if (input.legitimacyTier !== "legitimate") return { action: "suppress", reason: "illegitimate" };
  // BR-015.5 — quality bar: below the fit threshold never alerts (no keyword-only noise).
  if (!bandMeetsThreshold(input.fitBand, input.fitThreshold)) return { action: "suppress", reason: "below_threshold" };
  // BR-015.3 — the same role is never alerted twice.
  if (input.isDuplicate) return { action: "suppress", reason: "duplicate" };
  // BR-015.4 — fair-use cap: digest mode, or over the daily cap → batch (no fatigue), don't drop.
  if (input.capMode === "digest" || input.todayCount >= input.capPerDay) {
    return { action: "batch", reason: "over_cap" };
  }
  return { action: "dispatch", reason: "ok" };
}
