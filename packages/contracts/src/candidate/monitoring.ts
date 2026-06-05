import { z } from "zod";

// F-015: Job monitor (config). Limits are enforced in the service as 400 TARGET_LIMIT (exact code).
export const CreateMonitorSchema = z.object({
  queryName: z.string().max(255),
  keywords: z.array(z.string().max(100)).max(20).default([]),
  targetCompanies: z.array(z.string().max(255)).max(20).default([]),   // ≤20 (BR-015.1)
  targetRoles: z.array(z.string().max(255)).max(10).default([]),       // ≤10 (BR-015.1)
  locations: z.array(z.string().max(255)).max(10).default([]),
  filters: z.record(z.unknown()).default({}),                          // location/seniority/remote/visa
  fitThreshold: z.enum(["A", "B", "C"]).default("B"),                  // FR-015.8 (min band)
  capMode: z.enum(["instant", "digest"]).default("instant"),
  alertCapPerDay: z.number().int().min(1).max(50).default(5),          // FR-015.7 fair-use
  frequency: z.enum(["realtime", "daily", "weekly"]).default("daily"),
});
export type CreateMonitor = z.infer<typeof CreateMonitorSchema>;

// F-015 snooze/pause (FR-015.5 — never deletes setup).
export const MonitorSnoozeSchema = z.object({ snoozeUntil: z.string().datetime() });
export type MonitorSnooze = z.infer<typeof MonitorSnoozeSchema>;

// F-015 alert payload (FRD §4.15.7).
export const AlertPayloadSchema = z.object({
  alertId: z.string().uuid(),
  role: z.object({ company: z.string(), title: z.string(), url: z.string(), legitimacyTier: z.string() }),
  fitBand: z.enum(["A", "B", "C", "D", "F"]),
  whyItFits: z.string(),
  actions: z.array(z.enum(["rate", "tailor", "dismiss"])),
});
export type AlertPayload = z.infer<typeof AlertPayloadSchema>;

// F-015 alert decision (the honest gate; FRD §4.15.8 state model).
export const AlertDecisionSchema = z.object({
  action: z.enum(["dispatch", "suppress", "batch"]),
  reason: z.enum(["ok", "illegitimate", "below_threshold", "duplicate", "over_cap", "paused", "snoozed"]),
});
export type AlertDecision = z.infer<typeof AlertDecisionSchema>;

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
