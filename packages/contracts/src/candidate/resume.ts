import { z } from "zod";

export const ResumeUploadMetaSchema = z.object({
  fileName: z.string().max(255),
  fileSizeBytes: z.number().int().positive().max(5 * 1024 * 1024), // 5 MB — FR-001.1
  mimeType: z.enum(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword", "text/plain"]),
  idempotencyKey: z.string().max(255),
});
export type ResumeUploadMeta = z.infer<typeof ResumeUploadMetaSchema>;

export const ResumeSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  fileName: z.string().nullable(),
  wordCount: z.number().nullable(),
  charCount: z.number().nullable(),
  language: z.string(),
  parseStatus: z.enum(["pending", "parsed", "failed"]),
  createdAt: z.string().datetime(),
});
export type Resume = z.infer<typeof ResumeSchema>;

// F-002: Tailor request
export const TailorRequestSchema = z.object({
  resumeId: z.string().uuid(),
  companyId: z.string().uuid(),
  targetRole: z.string().max(255),
  targetJdText: z.string().max(20000).optional(),
  targetJdUrl: z.string().url().optional(),
  idempotencyKey: z.string().max(255),
});
export type TailorRequest = z.infer<typeof TailorRequestSchema>;

export const TailorResponseSchema = z.object({
  tailoredResumeId: z.string().uuid(),
  jobId: z.string().uuid(),
  status: z.literal("pending"),
  pollUrl: z.string().url(),
  estimatedSeconds: z.number(),
  ledgerEntryId: z.string().uuid().nullable(),
});
export type TailorResponse = z.infer<typeof TailorResponseSchema>;

export const TailorResultSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  generatedText: z.string().nullable(),
  generatedFileUrl: z.string().url().nullable(),
  fabricationScanPassed: z.boolean().nullable(),
  citations: z.array(z.object({ knowledgeId: z.string(), sourceRef: z.string() })),
  modelVersion: z.string().nullable(),
  version: z.number(),
});
export type TailorResult = z.infer<typeof TailorResultSchema>;
