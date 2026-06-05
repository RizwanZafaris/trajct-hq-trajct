/**
 * F-001 — Honest diagnostic contracts. Field names + limits VERBATIM from FRD §4.1.6/.7
 * (these sections ARE the acceptance criteria). Error codes are the full union in errors.ts.
 */

import { z } from "zod";
import { DiagnosticErrorCodeSchema } from "./errors.js";

// ---------------------------------------------------------------------------
// Request (FRD §4.1.6) — file arrives via multipart; resume_text is the paste path.
// One of {resume_file, resume_text} required; target (URL or JD text) required.
// ---------------------------------------------------------------------------
export const DiagnoseRequestSchema = z.object({
  resume_text: z.string().max(50_000).optional(),         // ≤ 50,000 chars — FR-001.1
  target: z.string().min(1).max(20_000),                  // URL (https://…) or JD text ≤ 20,000
  context: z.enum(["employed", "laid_off", "fresher", "switcher", "returner", "unknown"]).optional(),
  locale: z.string().max(10).optional(),                  // BCP-47
});
export type DiagnoseRequest = z.infer<typeof DiagnoseRequestSchema>;

// ---------------------------------------------------------------------------
// Result (FRD §4.1.7)
// ---------------------------------------------------------------------------
export const DiagnosticReasonSchema = z.object({
  issue: z.string(),
  fix: z.string(),
  evidence_ref: z.string(),                               // must be resolvable (BR-001.6) or dropped
  severity: z.enum(["high", "med", "low"]),
});
export type DiagnosticReason = z.infer<typeof DiagnosticReasonSchema>;

// 6 scoring dimensions (FR-001-class; ported from scoring_agent.py). Internal/diagnostic detail.
export const DiagnosticDimensionSchema = z.object({
  dimension: z.enum(["role_fit", "skill_coverage", "evidence_quality", "seniority_match", "logistics", "growth_fit"]),
  score: z.number().int().min(0).max(100),
  rationale: z.string(),
});
export type DiagnosticDimension = z.infer<typeof DiagnosticDimensionSchema>;

export const DiagnosticResultSchema = z.object({
  score: z.number().int().min(0).max(100),                // BR-001.9
  band: z.enum(["A", "B", "C", "D", "F"]),                // A≥85 B70-84 C55-69 D40-54 F<40
  reasons: z.array(DiagnosticReasonSchema).max(7),        // 3–7 typical; fewer allowed (BR-001.6 "few issues")
  dimensions: z.array(DiagnosticDimensionSchema),         // the 6-dim breakdown
  confidence: z.enum(["high", "med", "low"]),             // low if JD unparsed
  diag_token: z.string().uuid(),                          // transient handle, TTL 24h (BR-001.7)
  locale_notice: z.string().optional(),                   // present if downgraded to English
  citations: z.array(z.object({ knowledgeId: z.string(), docType: z.string(), sourceRef: z.string() })),
  modelVersion: z.string(),
});
export type DiagnosticResult = z.infer<typeof DiagnosticResultSchema>;

// ---------------------------------------------------------------------------
// Submit response (immediate — scoring is async; poll by diag_token)
// ---------------------------------------------------------------------------
export const DiagnoseSubmitResponseSchema = z.object({
  diag_token: z.string().uuid(),
  status: z.literal("processing"),
  poll_url: z.string(),
  estimated_seconds: z.number().max(15),                  // p95 ≤ 8s, p99 ≤ 15s (FR-001.3)
});
export type DiagnoseSubmitResponse = z.infer<typeof DiagnoseSubmitResponseSchema>;

// ---------------------------------------------------------------------------
// Poll response
// ---------------------------------------------------------------------------
export const DiagnosePollResponseSchema = z.object({
  diag_token: z.string().uuid(),
  status: z.enum(["processing", "completed", "failed"]),
  result: DiagnosticResultSchema.nullable(),
  error_code: z.string().nullable(),
});
export type DiagnosePollResponse = z.infer<typeof DiagnosePollResponseSchema>;

// ---------------------------------------------------------------------------
// Error union — every possible diagnostic failure (shared by api + web)
// ---------------------------------------------------------------------------
export type DiagnosticError = z.infer<typeof DiagnosticErrorCodeSchema>;
export { DiagnosticErrorCodeSchema };

/** Band mapping — BR-001.9 EXACT thresholds. The single source of truth. */
export function scoreToBand(score: number): "A" | "B" | "C" | "D" | "F" {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  if (s >= 85) return "A";   // A ≥ 85
  if (s >= 70) return "B";   // B 70–84
  if (s >= 55) return "C";   // C 55–69
  if (s >= 40) return "D";   // D 40–54
  return "F";                // F < 40
}
