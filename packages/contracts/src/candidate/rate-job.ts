import { z } from "zod";

/**
 * F-005 — Rate-a-job by URL/JD. FRD §4.5.6 (input) / §4.5.7 (output).
 *
 * The candidate pastes any job URL or JD text; the system extracts the JD and returns an
 * instant 6-dimension fit rating + an overall A–F band, held ephemerally (rate_token, TTL 24 h)
 * until saved. Every dimension carries a non-empty, grounded explanation (FR-005.7, NFR-005.2);
 * a real job NEVER yields a blank/zero rating (NFR-005.3).
 */

// The six fit dimensions (FR-005.2), in display order.
export const RATE_DIMENSIONS = [
  "role_alignment",
  "stack_coverage",
  "evidence",
  "seniority",
  "logistics",
  "learning_curve",
] as const;
export const RateDimensionNameSchema = z.enum(RATE_DIMENSIONS);
export type RateDimensionName = z.infer<typeof RateDimensionNameSchema>;

export const RateDimensionSchema = z.object({
  name: RateDimensionNameSchema,
  score: z.number().int().min(0).max(100),
  explanation: z.string().min(1),         // NFR-005.2: never empty
});
export type RateDimension = z.infer<typeof RateDimensionSchema>;

// --- Input (FRD §4.5.6) — one of url/text required -------------------------
export const RateJobRequestSchema = z
  .object({
    jobUrl: z.string().url().max(2048).optional(),    // BR-005.4: http(s), ≤2,048
    jdText: z.string().max(20000).optional(),         // FR-005.1: ≤20,000 chars
  })
  .refine((v) => !!v.jobUrl || !!(v.jdText && v.jdText.trim().length > 0), {
    message: "Provide a job URL or paste the JD.",
  });
export type RateJobRequest = z.infer<typeof RateJobRequestSchema>;

// --- Output — success 200 (FRD §4.5.7) -------------------------------------
export const RateBandSchema = z.enum(["A", "B", "C", "D", "F"]);
export type RateBand = z.infer<typeof RateBandSchema>;

export const RateJobResultSchema = z.object({
  rateToken: z.string().uuid(),
  overallBand: RateBandSchema,
  overallScore: z.number().int().min(0).max(100),
  dimensions: z.array(RateDimensionSchema).length(6),
  company: z.string().nullable(),
  role: z.string().nullable(),
  truncated: z.boolean(),                 // JD >20k was truncated-with-notice (edge table)
});
export type RateJobResult = z.infer<typeof RateJobResultSchema>;

export const SaveRatingResultSchema = z.object({
  ratingId: z.string().uuid(),
  saved: z.literal(true),
});
export type SaveRatingResult = z.infer<typeof SaveRatingResultSchema>;
