import { z } from "zod";

export const ProfileUpsertSchema = z.object({
  headline: z.string().max(500).optional(),
  summary: z.string().max(5000).optional(),
  yearsExperience: z.number().int().min(0).max(50).optional(),
  seniorityBand: z.enum(["entry", "mid", "senior", "staff", "principal", "executive"]).optional(),
  currentTitle: z.string().max(255).optional(),
  currentCompany: z.string().max(255).optional(),
  targetTitles: z.array(z.string().max(255)).max(10).optional(),
  targetIndustries: z.array(z.string().max(100)).max(10).optional(),
  targetLocations: z.array(z.string().max(255)).max(10).optional(),
  availability: z.enum(["active", "passive", "not-looking"]).optional(),
  openToRemote: z.boolean().optional(),
  salaryMinUsd: z.number().int().min(0).optional(),
  salaryMaxUsd: z.number().int().min(0).optional(),
  visaStatus: z.string().max(100).optional(),
  skills: z.array(z.string().max(100)).max(100).optional(),
  languages: z.array(z.object({ name: z.string(), level: z.string() })).max(10).optional(),
});
export type ProfileUpsert = z.infer<typeof ProfileUpsertSchema>;

export const ProfileSchema = ProfileUpsertSchema.extend({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  isDiscoverable: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Profile = z.infer<typeof ProfileSchema>;

// ---------------------------------------------------------------------------
// F-003 — Career profile builder (build from documents). FRD §4.3.7 output.
// ---------------------------------------------------------------------------
export const ExperienceItemSchema = z.object({
  role: z.string(),
  company: z.string(),
  start: z.string().nullable(),          // "YYYY-MM" or "YYYY"
  end: z.string().nullable(),            // null = present
  bullets: z.array(z.string()),
});
export type ExperienceItem = z.infer<typeof ExperienceItemSchema>;

export const EducationItemSchema = z.object({
  degree: z.string(),
  institution: z.string(),
  year: z.string().nullable(),
});
export type EducationItem = z.infer<typeof EducationItemSchema>;

/** A fact that conflicts across documents — surfaced for the user, NEVER auto-resolved (FR-003.7). */
export const ProfileConflictSchema = z.object({
  field: z.string(),                     // e.g. "end_date"
  role: z.string().optional(),
  company: z.string().optional(),
  values: z.array(z.string()),           // the differing values
});
export type ProfileConflict = z.infer<typeof ProfileConflictSchema>;

export const DocResultSchema = z.object({
  fileName: z.string(),
  status: z.enum(["processed", "skipped"]),
  errorCode: z.string().nullable(),      // NOT_A_CAREER_DOC | PARSE_FAILED | UNSUPPORTED_FORMAT
});
export type DocResult = z.infer<typeof DocResultSchema>;

export const BuildProfileResultSchema = z.object({
  profile_id: z.string().uuid(),
  experience: z.array(ExperienceItemSchema),
  skills: z.array(z.string()),
  keywords: z.array(z.string()),
  education: z.array(EducationItemSchema),
  recommendations: z.array(z.string()),
  conflicts: z.array(ProfileConflictSchema),
  doc_results: z.array(DocResultSchema),   // per-document outcome (item errors don't fail the batch)
});
export type BuildProfileResult = z.infer<typeof BuildProfileResultSchema>;
