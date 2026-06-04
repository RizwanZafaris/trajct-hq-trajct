/**
 * Auth contracts — F-070 (Identity & org/tenant management).
 * Zod schemas for: signup, login, session response, logout.
 * These are the verbatim I/O from FRD §4.70.6/.7.
 *
 * Rule: api/ validates against these schemas. web/ uses the same types.
 * No endpoint without a contract here first.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Signup
// ---------------------------------------------------------------------------
export const SignupRequestSchema = z.object({
  email: z.string().email().max(320),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(128),
  displayName: z.string().min(1).max(255).optional(),
  userType: z.enum(["candidate", "employer"]),
});

export type SignupRequest = z.infer<typeof SignupRequestSchema>;

export const SignupResponseSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  userType: z.enum(["candidate", "employer"]),
  emailVerificationSent: z.boolean(),
});

export type SignupResponse = z.infer<typeof SignupResponseSchema>;

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
export const LoginRequestSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().max(128),
  mfaCode: z.string().length(6).optional(),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const SessionSchema = z.object({
  sessionId: z.string().uuid(),
  userId: z.string().uuid(),
  userType: z.enum(["candidate", "employer", "admin"]),
  displayName: z.string().nullable(),
  orgId: z.string().uuid().nullable(),
  orgRole: z.enum(["admin", "recruiter", "hiring_manager", "viewer"]).nullable(),
  expiresAt: z.string().datetime(),
  mfaRequired: z.boolean(),
});

export type Session = z.infer<typeof SessionSchema>;

export const LoginResponseSchema = z.object({
  session: SessionSchema,
  requiresMfa: z.boolean(),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// ---------------------------------------------------------------------------
// Me
// ---------------------------------------------------------------------------
export const MeResponseSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  userType: z.enum(["candidate", "employer", "admin"]),
  displayName: z.string().nullable(),
  emailVerified: z.boolean(),
  mfaEnabled: z.boolean(),
  orgId: z.string().uuid().nullable(),
  orgRole: z.enum(["admin", "recruiter", "hiring_manager", "viewer"]).nullable(),
});

export type MeResponse = z.infer<typeof MeResponseSchema>;

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------
export const LogoutResponseSchema = z.object({
  success: z.literal(true),
});

export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;
