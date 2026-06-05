/**
 * Shared error types and discriminated union for all API error responses.
 * F-001 diagnostic error codes are the full union — other features add their own codes here.
 *
 * Rule: NO endpoint error code that isn't defined here first.
 * These are shared by both api/ and web/ (typed discriminated union).
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Base error shape (FRD §4.x.7 format: { code, message, retryable })
// ---------------------------------------------------------------------------
export const BaseErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  retryable: z.boolean(),
  requestId: z.string().optional(),
});

export type BaseError = z.infer<typeof BaseErrorSchema>;

// ---------------------------------------------------------------------------
// F-001 Diagnostic upload error union (verbatim from FRD §4.1.7)
// ---------------------------------------------------------------------------
export const DiagnosticErrorCodeSchema = z.discriminatedUnion("code", [
  z.object({ code: z.literal("FILE_TOO_LARGE"),           message: z.string(), retryable: z.literal(false) }),
  z.object({ code: z.literal("MISSING_INPUT"),            message: z.string(), retryable: z.literal(false) }),
  z.object({ code: z.literal("UNSUPPORTED_FORMAT"),       message: z.string(), retryable: z.literal(false) }),
  z.object({ code: z.literal("NOT_A_RESUME"),             message: z.string(), retryable: z.literal(false) }),
  z.object({ code: z.literal("PARSE_FAILED"),             message: z.string(), retryable: z.literal(true) }),
  z.object({ code: z.literal("FILE_LOCKED"),              message: z.string(), retryable: z.literal(false) }),
  z.object({ code: z.literal("RESUME_TOO_SHORT"),         message: z.string(), retryable: z.literal(false) }),
  z.object({ code: z.literal("FILE_REJECTED_SECURITY"),   message: z.string(), retryable: z.literal(false) }),
  z.object({ code: z.literal("RATE_LIMITED"),             message: z.string(), retryable: z.literal(true),  retryAfterSeconds: z.number() }),
  z.object({ code: z.literal("ENGINE_UNAVAILABLE"),       message: z.string(), retryable: z.literal(true) }),
]);

export type DiagnosticErrorCode = z.infer<typeof DiagnosticErrorCodeSchema>;

// ---------------------------------------------------------------------------
// F-003 Career-profile-builder errors (FRD §4.3.7)
// ---------------------------------------------------------------------------
export const ProfileErrorCodeSchema = z.discriminatedUnion("code", [
  z.object({ code: z.literal("TOO_MANY_DOCS"),     message: z.string(), retryable: z.literal(false) }),
  z.object({ code: z.literal("UNSUPPORTED_FORMAT"), message: z.string(), retryable: z.literal(false) }),
  z.object({ code: z.literal("NOT_A_CAREER_DOC"),  message: z.string(), retryable: z.literal(false) }),
  z.object({ code: z.literal("PARSE_FAILED"),      message: z.string(), retryable: z.literal(false) }),
  z.object({ code: z.literal("MISSING_INPUT"),     message: z.string(), retryable: z.literal(false) }),
  z.object({ code: z.literal("ENGINE_UNAVAILABLE"), message: z.string(), retryable: z.literal(true) }),
]);
export type ProfileErrorCode = z.infer<typeof ProfileErrorCodeSchema>;

// ---------------------------------------------------------------------------
// F-004 Chat-driven résumé editing errors (FRD §4.4.7)
// ---------------------------------------------------------------------------
export const EditErrorCodeSchema = z.discriminatedUnion("code", [
  z.object({ code: z.literal("INSTRUCTION_TOO_LONG"),  message: z.string(), retryable: z.literal(false) }),
  z.object({ code: z.literal("INSTRUCTION_UNCLEAR"),   message: z.string(), retryable: z.literal(false) }),
  z.object({ code: z.literal("EDIT_CONFLICT"),         message: z.string(), retryable: z.literal(true) }),   // re-base then retry
  z.object({ code: z.literal("FABRICATION_REFUSED"),   message: z.string(), retryable: z.literal(false) }),
  z.object({ code: z.literal("COST_CEILING_HIT"),      message: z.string(), retryable: z.literal(false) }),
  z.object({ code: z.literal("RATE_LIMITED"),          message: z.string(), retryable: z.literal(true),  retryAfterSeconds: z.number() }),
  z.object({ code: z.literal("ENGINE_UNAVAILABLE"),    message: z.string(), retryable: z.literal(true) }),
]);
export type EditErrorCode = z.infer<typeof EditErrorCodeSchema>;

// ---------------------------------------------------------------------------
// F-005 Rate-a-job errors (FRD §4.5.7)
// ---------------------------------------------------------------------------
export const RateErrorCodeSchema = z.discriminatedUnion("code", [
  z.object({ code: z.literal("BAD_URL"),            message: z.string(), retryable: z.literal(false) }),
  z.object({ code: z.literal("EXTRACT_FAILED"),     message: z.string(), retryable: z.literal(false) }),  // paste path
  z.object({ code: z.literal("NOT_A_JOB_POSTING"),  message: z.string(), retryable: z.literal(false) }),
  z.object({ code: z.literal("RATE_LIMITED"),       message: z.string(), retryable: z.literal(true),  retryAfterSeconds: z.number() }),
  z.object({ code: z.literal("ENGINE_UNAVAILABLE"), message: z.string(), retryable: z.literal(true) }),
]);
export type RateErrorCode = z.infer<typeof RateErrorCodeSchema>;

// ---------------------------------------------------------------------------
// F-007 Interview-prep errors (FRD §4.7.7)
// ---------------------------------------------------------------------------
export const PrepErrorCodeSchema = z.discriminatedUnion("code", [
  z.object({ code: z.literal("COMPANY_NOT_FOUND"),  message: z.string(), retryable: z.literal(true) }),   // research then retry
  z.object({ code: z.literal("RATE_LIMITED"),       message: z.string(), retryable: z.literal(true),  retryAfterSeconds: z.number() }),
  z.object({ code: z.literal("ENGINE_UNAVAILABLE"), message: z.string(), retryable: z.literal(true) }),
]);
export type PrepErrorCode = z.infer<typeof PrepErrorCodeSchema>;

// ---------------------------------------------------------------------------
// F-015 Passive-monitoring config errors (FRD §4.15.7)
// ---------------------------------------------------------------------------
export const MonitorErrorCodeSchema = z.discriminatedUnion("code", [
  z.object({ code: z.literal("TARGET_LIMIT"),   message: z.string(), retryable: z.literal(false) }),
  z.object({ code: z.literal("INVALID_FILTER"), message: z.string(), retryable: z.literal(false) }),
]);
export type MonitorErrorCode = z.infer<typeof MonitorErrorCodeSchema>;

// ---------------------------------------------------------------------------
// Auth errors
// ---------------------------------------------------------------------------
export const AuthErrorCodeSchema = z.discriminatedUnion("code", [
  z.object({ code: z.literal("INVALID_CREDENTIALS"),   message: z.string(), retryable: z.literal(false) }),
  z.object({ code: z.literal("TOO_MANY_ATTEMPTS"),     message: z.string(), retryable: z.literal(true),  retryAfterSeconds: z.number() }),
  z.object({ code: z.literal("SESSION_EXPIRED"),       message: z.string(), retryable: z.literal(false) }),
  z.object({ code: z.literal("MFA_REQUIRED"),          message: z.string(), retryable: z.literal(false) }),
  z.object({ code: z.literal("ACCOUNT_LOCKED"),        message: z.string(), retryable: z.literal(true) }),
  z.object({ code: z.literal("BREACHED_PASSWORD"),     message: z.string(), retryable: z.literal(false) }),
  z.object({ code: z.literal("EMAIL_NOT_VERIFIED"),    message: z.string(), retryable: z.literal(false) }),
]);

export type AuthErrorCode = z.infer<typeof AuthErrorCodeSchema>;

// ---------------------------------------------------------------------------
// Billing errors
// ---------------------------------------------------------------------------
export const BillingErrorCodeSchema = z.discriminatedUnion("code", [
  z.object({ code: z.literal("PAYMENT_FAILED"),        message: z.string(), retryable: z.literal(true) }),
  z.object({ code: z.literal("DUPLICATE_CHARGE"),      message: z.string(), retryable: z.literal(false) }),
  z.object({ code: z.literal("AMOUNT_MISMATCH"),       message: z.string(), retryable: z.literal(false) }),
  z.object({ code: z.literal("SCA_REQUIRED"),          message: z.string(), retryable: z.literal(true) }),
  z.object({ code: z.literal("PSP_UNAVAILABLE"),       message: z.string(), retryable: z.literal(true) }),
  z.object({ code: z.literal("PAYMENT_REQUIRED"),      message: z.string(), retryable: z.literal(false) }),
  z.object({ code: z.literal("NOT_ENTITLED"),          message: z.string(), retryable: z.literal(false) }),
  z.object({ code: z.literal("COST_CEILING_HIT"),      message: z.string(), retryable: z.literal(false) }),
  z.object({ code: z.literal("GLOBAL_CEILING_HIT"),    message: z.string(), retryable: z.literal(true) }),
]);

export type BillingErrorCode = z.infer<typeof BillingErrorCodeSchema>;

// ---------------------------------------------------------------------------
// General errors
// ---------------------------------------------------------------------------
export const GeneralErrorCodeSchema = z.discriminatedUnion("code", [
  z.object({ code: z.literal("VALIDATION_ERROR"),      message: z.string(), retryable: z.literal(false), fields: z.record(z.string()).optional() }),
  z.object({ code: z.literal("NOT_FOUND"),             message: z.string(), retryable: z.literal(false) }),
  z.object({ code: z.literal("FORBIDDEN"),             message: z.string(), retryable: z.literal(false) }),
  z.object({ code: z.literal("INTERNAL_ERROR"),        message: z.string(), retryable: z.literal(true) }),
  z.object({ code: z.literal("RATE_LIMITED"),          message: z.string(), retryable: z.literal(true),  retryAfterSeconds: z.number() }),
  z.object({ code: z.literal("REGION_VIOLATION"),      message: z.string(), retryable: z.literal(false) }),
]);

export type GeneralErrorCode = z.infer<typeof GeneralErrorCodeSchema>;
