import { z } from "zod";

// F-038: Scorecard submission
export const SubmitScorecardSchema = z.object({
  cardId: z.string().uuid(),
  dimensions: z.array(z.object({
    name: z.string().max(100),
    score: z.number().int().min(1).max(5),
    notes: z.string().max(2000).optional(),
  })).min(1).max(20),
  overallRecommendation: z.enum(["strong_yes", "yes", "maybe", "no", "strong_no"]),
});
export type SubmitScorecard = z.infer<typeof SubmitScorecardSchema>;

// F-037: Bulk actions
export const BulkActionSchema = z.object({
  cardIds: z.array(z.string().uuid()).min(1).max(100),
  action: z.enum(["reject", "advance", "archive"]),
  reason: z.string().max(1000).optional(),
});
export type BulkAction = z.infer<typeof BulkActionSchema>;

// F-039: Analytics query
export const AnalyticsQuerySchema = z.object({
  jobPostingId: z.string().uuid().optional(),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  metrics: z.array(z.enum(["ttf", "cph", "funnel", "bias", "quality"])).default(["ttf", "funnel"]),
});
export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;
