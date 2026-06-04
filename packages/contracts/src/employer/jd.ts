import { z } from "zod";

// F-030: JD generation (free, no auth required)
export const GenerateJdRequestSchema = z.object({
  title: z.string().max(255).min(2),
  level: z.enum(["junior", "mid", "senior", "staff", "principal", "executive"]),
  department: z.string().max(255).optional(),
  mustHaves: z.array(z.string().max(500)).max(10),
  niceToHaves: z.array(z.string().max(500)).max(10).optional(),
  location: z.string().max(255).optional(),
  remotePolicy: z.enum(["remote", "hybrid", "onsite"]).default("hybrid"),
  salaryMinUsd: z.number().int().min(0).optional(),
  salaryMaxUsd: z.number().int().min(0).optional(),
  currency: z.string().length(3).default("USD"),
  idempotencyKey: z.string().max(255),
});
export type GenerateJdRequest = z.infer<typeof GenerateJdRequestSchema>;

export const GeneratedJdSchema = z.object({
  jobId: z.string().uuid(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  generatedJd: z.string().nullable(),
  requiredSkills: z.array(z.string()).nullable(),
  inclusivityFlags: z.array(z.object({
    flaggedText: z.string(),
    reason: z.string(),
    suggestion: z.string(),
  })).nullable(),
  salaryHint: z.object({ min: z.number(), max: z.number(), currency: z.string() }).nullable(),
  modelVersion: z.string().nullable(),
});
export type GeneratedJd = z.infer<typeof GeneratedJdSchema>;

export const PublishJdRequestSchema = z.object({
  editedJd: z.string().max(50000).optional(),
  closesAt: z.string().datetime().optional(),
  screeningEnabled: z.literal(false).default(false),  // always false at this stage
});
export type PublishJdRequest = z.infer<typeof PublishJdRequestSchema>;

// F-031: JD analysis
export const AnalyzeJdRequestSchema = z.object({
  jdText: z.string().max(50000),
});
export type AnalyzeJdRequest = z.infer<typeof AnalyzeJdRequestSchema>;
