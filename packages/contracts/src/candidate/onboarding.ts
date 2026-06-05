import { z } from "zod";

/**
 * F-091c — Onboarding / first-run (FRD §4.91c). A resumable guided stepper:
 * welcome → import → targets → diagnosis (the activation moment) → done.
 * The owner/first user is exempt (onboarded_at backfilled). Optional steps may be skipped and the
 * user still reaches a first diagnosis (FR-091c.4).
 */

export const ONBOARDING_STEPS = ["welcome", "import", "targets", "diagnosis", "done"] as const;
export const OnboardingStepSchema = z.enum(ONBOARDING_STEPS);
export type OnboardingStep = z.infer<typeof OnboardingStepSchema>;

// Steps a user may skip and still reach the activation goal (FR-091c.4).
export const OPTIONAL_STEPS: OnboardingStep[] = ["import", "targets"];

export const OnboardingAdvanceRequestSchema = z.object({
  step: OnboardingStepSchema,
  data: z.record(z.unknown()).optional(),
  skip: z.boolean().default(false),
});
export type OnboardingAdvanceRequest = z.infer<typeof OnboardingAdvanceRequestSchema>;

export const OnboardingStateSchema = z.object({
  currentStep: OnboardingStepSchema,
  completedSteps: z.array(OnboardingStepSchema),
  progress: z.number().min(0).max(1),
  onboarded: z.boolean(),          // true = finished or owner-exempt (FR-091c.3)
  exempt: z.boolean(),             // true = owner/backfilled (skipped onboarding entirely)
});
export type OnboardingState = z.infer<typeof OnboardingStateSchema>;
