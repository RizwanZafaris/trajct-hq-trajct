import { z } from "zod";

// F-015: Job monitor
export const CreateMonitorSchema = z.object({
  queryName: z.string().max(255),
  keywords: z.array(z.string().max(100)).max(20),
  targetCompanies: z.array(z.string().uuid()).max(20).optional(),
  targetRoles: z.array(z.string().max(255)).max(10),
  locations: z.array(z.string().max(255)).max(10),
  frequency: z.enum(["realtime", "daily", "weekly"]).default("daily"),
});
export type CreateMonitor = z.infer<typeof CreateMonitorSchema>;

// F-005: Rate-a-job
export const RateJobRequestSchema = z.object({
  resumeId: z.string().uuid(),
  jobUrl: z.string().url().optional(),
  jdText: z.string().max(20000).optional(),
  idempotencyKey: z.string().max(255),
}).refine(d => d.jobUrl || d.jdText, { message: "Provide jobUrl or jdText" });
export type RateJobRequest = z.infer<typeof RateJobRequestSchema>;

export const RateJobResultSchema = z.object({
  id: z.string().uuid(),
  fitScore: z.number().int().min(0).max(100),
  band: z.enum(["A","B","C","D","E","F"]),
  reasons: z.array(z.object({
    issue: z.string(),
    fix: z.string(),
    severity: z.enum(["high", "med", "low"]),
    evidenceRef: z.string(),
  })),
  recommendations: z.array(z.string()),
});
export type RateJobResult = z.infer<typeof RateJobResultSchema>;

// F-011: LinkedIn optimization
export const LinkedInOptimizeRequestSchema = z.object({
  resumeId: z.string().uuid(),
  section: z.enum(["headline", "summary", "experience", "all"]).default("all"),
});
export type LinkedInOptimizeRequest = z.infer<typeof LinkedInOptimizeRequestSchema>;

// F-012: LinkedIn post
export const LinkedInPostRequestSchema = z.object({
  topic: z.string().max(500),
  tone: z.enum(["professional", "casual", "thought-leadership", "storytelling"]).default("professional"),
  voiceCalibrated: z.boolean().default(false),
  scheduledAt: z.string().datetime().optional(),
});
export type LinkedInPostRequest = z.infer<typeof LinkedInPostRequestSchema>;
