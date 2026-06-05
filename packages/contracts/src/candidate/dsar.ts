import { z } from "zod";

/**
 * F-093c — Data portability / delete (DSAR; FRD §4.93c). Candidate-facing export + account/data
 * deletion, identity-verified, within SLA. A GDPR/PDPB-class right and a trust feature.
 */

export const DsarRequestSchema = z.object({
  requestType: z.enum(["export", "delete"]),
  verificationToken: z.string().min(1),      // proof of a re-auth identity check (BR-093c.1)
});
export type DsarRequest = z.infer<typeof DsarRequestSchema>;

export const DsarRequestResultSchema = z.object({
  requestId: z.string().uuid(),
  requestType: z.enum(["export", "delete"]),
  status: z.enum(["processing", "completed", "failed"]),
  residualPiiCount: z.number().int().nullable(),        // delete: MUST be 0 (verified removal)
  anonymizedOutcomeCount: z.number().int().nullable(),  // delete: outcomes anonymized, not destroyed
  exportReady: z.boolean(),                             // export: bundle/link available
});
export type DsarRequestResult = z.infer<typeof DsarRequestResultSchema>;
