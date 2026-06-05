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

// ---------------------------------------------------------------------------
// F-007 — Company-specific interview prep (FRD §4.7.6/.7). Evidence-grounded brief.
// ---------------------------------------------------------------------------
export const PrepGenerateRequestSchema = z
  .object({
    companyId: z.string().uuid().optional(),     // known company (persona) …
    target: z.string().max(255).optional(),      // … or free-text "Company / Role"
    profileId: z.string().uuid().optional(),     // for STAR mapping (F-010)
    prepType: z.enum(["standard", "deep", "leadership"]).default("standard"),
    idempotencyKey: z.string().max(255).optional(),
  })
  .refine((v) => !!v.companyId || !!(v.target && v.target.trim().length > 0), {
    message: "Provide a company or a target.",
  });
export type PrepGenerateRequest = z.infer<typeof PrepGenerateRequestSchema>;

export const PrepConfidenceSchema = z.enum(["high", "med", "low"]);
export type PrepConfidence = z.infer<typeof PrepConfidenceSchema>;

/** A claim is either cited (citeMarker set) or explicitly "general guidance" (BR-007.1, FR-007.4). */
export const PrepBriefQuestionSchema = z.object({
  question: z.string(),
  type: z.enum(["behavioral", "technical", "situational", "culture"]),
  rationale: z.string(),
  citeMarker: z.string().nullable(),
  general: z.boolean(),                          // true = general best-practice, not company-specific
  difficulty: z.enum(["easy", "medium", "hard"]),
});
export type PrepBriefQuestion = z.infer<typeof PrepBriefQuestionSchema>;

export const PrepValueSchema = z.object({ value: z.string(), citeMarker: z.string().nullable() });
export type PrepValue = z.infer<typeof PrepValueSchema>;

export const PrepBriefSchema = z.object({
  questions: z.array(PrepBriefQuestionSchema),
  format: z.string(),                            // stages / interview format
  values: z.array(PrepValueSchema),
  frameworks: z.array(z.string()),               // answer frameworks (STAR etc.)
});
export type PrepBrief = z.infer<typeof PrepBriefSchema>;

export const PrepCiteSchema = z.object({ marker: z.string(), sourceRef: z.string(), claim: z.string() });
export type PrepCite = z.infer<typeof PrepCiteSchema>;

export const PrepStarMappingSchema = z.object({ questionIndex: z.number().int(), storyId: z.string() });
export type PrepStarMapping = z.infer<typeof PrepStarMappingSchema>;

export const PrepBriefResultSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  brief: PrepBriefSchema,
  cites: z.array(PrepCiteSchema),
  confidence: PrepConfidenceSchema,              // low = thin research (FR-007.4)
  starMappings: z.array(PrepStarMappingSchema),
  notes: z.array(z.string()),                    // uncertainty notes for conflicting sources (FR-007.7)
  insiderDeclined: z.boolean(),                  // an insider-info ask was declined (FR-007.5)
});
export type PrepBriefResult = z.infer<typeof PrepBriefResultSchema>;

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
