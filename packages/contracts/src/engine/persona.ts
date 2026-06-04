import { z } from "zod";

// F-052: Company persona
export const PersonaSynthesisRequestSchema = z.object({
  companyId: z.string().uuid(),
  companyName: z.string().max(255),
  companyDomain: z.string().max(255).optional(),
  forceRefresh: z.boolean().default(false),
  idempotencyKey: z.string().max(255),
});
export type PersonaSynthesisRequest = z.infer<typeof PersonaSynthesisRequestSchema>;

export const CompanyPersonaSchema = z.object({
  companyId: z.string().uuid(),
  version: z.string(),
  hiringSignals: z.array(z.string()),
  cultureIndicators: z.array(z.string()),
  successPatterns: z.array(z.string()),
  rejectionPatterns: z.array(z.string()),
  evidenceRefs: z.array(z.string()),
  freshnessScore: z.number().min(0).max(1),
  lastResearchAt: z.string().datetime().nullable(),
  nextRefreshAt: z.string().datetime().nullable(),
});
export type CompanyPersona = z.infer<typeof CompanyPersonaSchema>;

// F-058: Job discovery
export const JobDiscoveryQuerySchema = z.object({
  adapters: z.array(z.string()).min(1),
  keywords: z.array(z.string().max(100)).max(10),
  locations: z.array(z.string().max(255)).max(5),
  limit: z.number().int().min(1).max(100).default(20),
  idempotencyKey: z.string().max(255),
});
export type JobDiscoveryQuery = z.infer<typeof JobDiscoveryQuerySchema>;

// F-050: Outcome logging
export const LogOutcomeRequestSchema = z.object({
  userId: z.string().uuid(),
  companyId: z.string().uuid(),
  jobId: z.string().uuid().optional(),
  outcome: z.enum(["interview_win", "interview_loss", "offer", "hire", "rejection", "withdraw"]),
  artifactIds: z.array(z.string().uuid()).max(10),
  applicationId: z.string().uuid().optional(),
  consentRef: z.string().uuid(),
});
export type LogOutcomeRequest = z.infer<typeof LogOutcomeRequestSchema>;
