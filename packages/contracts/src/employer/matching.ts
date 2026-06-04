import { z } from "zod";

// F-032: Candidate matching
export const RunMatchingRequestSchema = z.object({
  jobPostingId: z.string().uuid(),
  limit: z.number().int().min(1).max(50).default(20),
  includeHiddenGems: z.boolean().default(true),  // F-035
  idempotencyKey: z.string().max(255),
});
export type RunMatchingRequest = z.infer<typeof RunMatchingRequestSchema>;

export const MatchedCandidateSchema = z.object({
  matchId: z.string().uuid(),
  anonymizedId: z.string().uuid(),         // trust wall: never real user_id
  fitScore: z.number().int().min(0).max(100),
  band: z.enum(["A","B","C","D","E","F"]),
  matchFactors: z.array(z.object({
    factor: z.string(),
    value: z.string(),
    rationale: z.string(),
  })),
  isHiddenGem: z.boolean(),
  consentRef: z.string().uuid(),
  status: z.enum(["pending_review", "shortlisted", "rejected", "screening"]),
});
export type MatchedCandidate = z.infer<typeof MatchedCandidateSchema>;

// Advance / reject — requires human decision (FR-034.6 / no auto-decision)
export const CandidateDecisionSchema = z.object({
  matchId: z.string().uuid(),
  decision: z.enum(["shortlist", "reject"]),
  reason: z.string().max(1000).optional(),
}).refine(d => !(d.decision === "reject" && !d.reason?.trim()), {
  message: "Rejection reason required per why-rejected requirement (F-036)",
});
export type CandidateDecision = z.infer<typeof CandidateDecisionSchema>;

// F-038: Pipeline
export const PipelineStageCreateSchema = z.object({
  name: z.string().max(255),
  orderIndex: z.number().int().min(0),
  stageType: z.enum(["applied", "screen", "phone", "interview", "offer", "hired", "rejected", "custom"]).default("custom"),
});
export type PipelineStageCreate = z.infer<typeof PipelineStageCreateSchema>;

export const MoveCandidateSchema = z.object({
  cardId: z.string().uuid(),
  targetStageId: z.string().uuid(),
  note: z.string().max(2000).optional(),
});
export type MoveCandidate = z.infer<typeof MoveCandidateSchema>;
