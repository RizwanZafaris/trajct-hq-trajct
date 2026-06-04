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
