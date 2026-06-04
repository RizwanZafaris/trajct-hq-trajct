import { z } from "zod";

export const ApplicationStatusEnum = z.enum([
  "wishlist", "applied", "phone_screen", "interview", "offer", "rejected", "withdrawn", "hired"
]);

// F-018: Application tracker
export const CreateApplicationSchema = z.object({
  companyName: z.string().max(255),
  roleTitle: z.string().max(255),
  jobUrl: z.string().url().optional(),
  jobPostingId: z.string().uuid().optional(),
  resumeId: z.string().uuid().optional(),
  tailoredResumeId: z.string().uuid().optional(),
  appliedAt: z.string().datetime().optional(),
  notes: z.string().max(5000).optional(),
});
export type CreateApplication = z.infer<typeof CreateApplicationSchema>;

export const UpdateApplicationSchema = z.object({
  status: ApplicationStatusEnum.optional(),
  followUpDueAt: z.string().datetime().optional(),
  salaryOfferedUsd: z.number().int().optional(),
  notes: z.string().max(5000).optional(),
  outcomeType: z.enum(["interview_win", "interview_loss", "offer", "hire", "rejection", "withdraw"]).optional(),
});
export type UpdateApplication = z.infer<typeof UpdateApplicationSchema>;

export const ApplicationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  companyName: z.string(),
  roleTitle: z.string(),
  status: ApplicationStatusEnum,
  appliedAt: z.string().datetime().nullable(),
  followUpDueAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Application = z.infer<typeof ApplicationSchema>;

// F-020: Follow-up cadence
export const FollowUpDraftRequestSchema = z.object({
  applicationId: z.string().uuid(),
  stepNumber: z.number().int().min(1).max(5).default(1),
  channel: z.enum(["email", "linkedin", "phone"]).default("email"),
});
export type FollowUpDraftRequest = z.infer<typeof FollowUpDraftRequestSchema>;

// F-022: Offer evaluation
export const OfferEvalRequestSchema = z.object({
  applicationId: z.string().uuid().optional(),
  companyName: z.string().max(255),
  roleTitle: z.string().max(255),
  baseSalaryUsd: z.number().int().min(0),
  totalCompUsd: z.number().int().min(0).optional(),
  equityDetails: z.record(z.unknown()).optional(),
  benefits: z.record(z.unknown()).optional(),
  location: z.string().max(255).optional(),
  remotePolicy: z.enum(["remote", "hybrid", "onsite"]).optional(),
});
export type OfferEvalRequest = z.infer<typeof OfferEvalRequestSchema>;
