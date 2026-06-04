/**
 * F-001 — Diagnostic upload request/response contracts.
 * Limits are verbatim from FRD: 5 MB, 50k chars, 8s p95.
 * Error codes are the full discriminated union from errors.ts.
 */

import { z } from "zod";
import { DiagnosticErrorCodeSchema } from "./errors.js";

// ---------------------------------------------------------------------------
// F-001 Upload request
// ---------------------------------------------------------------------------
export const DiagnosticUploadRequestSchema = z.object({
  // File arrives as multipart; the contract specifies the metadata fields.
  // Actual file bytes are validated by the upload pipeline (size→type→ClamAV→semantic).
  fileName: z.string().max(255),
  fileSizeBytes: z.number().int().positive().max(5 * 1024 * 1024), // 5 MB — FRD §4.1.6 exact
  mimeType: z.enum([
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "text/plain",
  ]),
  targetCompanyId: z.string().uuid().optional(),
  targetRoleId: z.string().uuid().optional(),
  idempotencyKey: z.string().max(255),
});

export type DiagnosticUploadRequest = z.infer<typeof DiagnosticUploadRequestSchema>;

// ---------------------------------------------------------------------------
// F-001 Diagnostic result
// ---------------------------------------------------------------------------
export const DiagnosticScoreSchema = z.object({
  dimension: z.string(),
  score: z.number().min(0).max(100),
  rationale: z.string(),
  evidenceRefs: z.array(z.string()),
});

export const DiagnosticResultSchema = z.object({
  diagnosticId: z.string().uuid(),
  jobId: z.string().uuid(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  overallScore: z.number().min(0).max(100).nullable(),
  scores: z.array(DiagnosticScoreSchema),
  topStrengths: z.array(z.string()),
  topGaps: z.array(z.string()),
  wordCount: z.number().int().nullable(),
  citations: z.array(
    z.object({
      knowledgeId: z.string(),
      docType: z.string(),
      sourceRef: z.string(),
    })
  ),
  modelVersion: z.string(),
  promptVersion: z.string(),
  completedAt: z.string().datetime().nullable(),
  charCount: z.number().int().nullable(),
});

export type DiagnosticResult = z.infer<typeof DiagnosticResultSchema>;

// ---------------------------------------------------------------------------
// F-001 Upload response (immediate — job enqueued)
// ---------------------------------------------------------------------------
export const DiagnosticUploadResponseSchema = z.object({
  diagnosticId: z.string().uuid(),
  jobId: z.string().uuid(),
  status: z.literal("pending"),
  pollUrl: z.string().url(),
  estimatedSeconds: z.number().max(10), // p95 ≤ 8s — FRD NFR-001
});

export type DiagnosticUploadResponse = z.infer<typeof DiagnosticUploadResponseSchema>;

// ---------------------------------------------------------------------------
// F-001 Error union — every possible diagnostic failure (shared by api + web)
// ---------------------------------------------------------------------------
export type DiagnosticError = z.infer<typeof DiagnosticErrorCodeSchema>;

export { DiagnosticErrorCodeSchema };
