/**
 * Org contracts — F-070/F-072e (org creation, invite, role management).
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Create org
// ---------------------------------------------------------------------------
export const CreateOrgRequestSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  domain: z.string().max(255).optional(),
  region: z.enum(["uae", "ksa", "sg", "global"]).default("global"),
});

export type CreateOrgRequest = z.infer<typeof CreateOrgRequestSchema>;

export const CreateOrgResponseSchema = z.object({
  orgId: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  tier: z.enum(["free", "starter", "growth", "enterprise"]),
  verificationStatus: z.enum(["unverified", "email_verified", "domain_verified", "manual_verified"]),
  region: z.string(),
});

export type CreateOrgResponse = z.infer<typeof CreateOrgResponseSchema>;

// ---------------------------------------------------------------------------
// Invite member
// ---------------------------------------------------------------------------
export const InviteMemberRequestSchema = z.object({
  email: z.string().email().max(320),
  role: z.enum(["admin", "recruiter", "hiring_manager", "viewer"]),
});

export type InviteMemberRequest = z.infer<typeof InviteMemberRequestSchema>;

export const InviteMemberResponseSchema = z.object({
  inviteId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["admin", "recruiter", "hiring_manager", "viewer"]),
  expiresAt: z.string().datetime(),
});

export type InviteMemberResponse = z.infer<typeof InviteMemberResponseSchema>;

// ---------------------------------------------------------------------------
// Change member role
// ---------------------------------------------------------------------------
export const ChangeMemberRoleRequestSchema = z.object({
  userId: z.string().uuid(),
  newRole: z.enum(["admin", "recruiter", "hiring_manager", "viewer"]),
  reason: z.string().max(500).optional(),
});

export type ChangeMemberRoleRequest = z.infer<typeof ChangeMemberRoleRequestSchema>;

export const ChangeMemberRoleResponseSchema = z.object({
  userId: z.string().uuid(),
  orgId: z.string().uuid(),
  role: z.enum(["admin", "recruiter", "hiring_manager", "viewer"]),
  changedBy: z.string().uuid(),
  changedAt: z.string().datetime(),
});

export type ChangeMemberRoleResponse = z.infer<typeof ChangeMemberRoleResponseSchema>;
