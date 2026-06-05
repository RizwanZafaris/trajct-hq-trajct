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

// F-005 Rate-a-job is defined in ./rate-job.ts (FRD §4.5 — 6-dimension rating).

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
