import { z } from "zod";

// F-007: Interview prep
export const PrepSessionRequestSchema = z.object({
  companyId: z.string().uuid(),
  jobPostingId: z.string().uuid().optional(),
  resumeId: z.string().uuid().optional(),
  prepType: z.enum(["standard", "deep", "leadership"]).default("standard"),
  idempotencyKey: z.string().max(255),
});
export type PrepSessionRequest = z.infer<typeof PrepSessionRequestSchema>;

export const PrepQuestionSchema = z.object({
  question: z.string(),
  type: z.enum(["behavioral", "technical", "situational", "culture"]),
  context: z.string(),
  citeMarker: z.string(),
  modelAnswerHint: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
});
export type PrepQuestion = z.infer<typeof PrepQuestionSchema>;

export const PrepSessionResultSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  questions: z.array(PrepQuestionSchema),
  personaSnapshotVersion: z.string().nullable(),
  modelVersion: z.string().nullable(),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
});
export type PrepSessionResult = z.infer<typeof PrepSessionResultSchema>;

// F-008: Mock interview
export const MockInterviewStartSchema = z.object({
  prepSessionId: z.string().uuid().optional(),
  companyId: z.string().uuid(),
  mode: z.enum(["text", "voice", "video"]).default("text"),
});
export type MockInterviewStart = z.infer<typeof MockInterviewStartSchema>;

export const MockInterviewTurnSchema = z.object({
  sessionId: z.string().uuid(),
  role: z.enum(["candidate", "interviewer"]),
  content: z.string().max(5000),
});
export type MockInterviewTurn = z.infer<typeof MockInterviewTurnSchema>;
