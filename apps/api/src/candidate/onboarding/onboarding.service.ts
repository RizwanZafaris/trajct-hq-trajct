import { Injectable } from "@nestjs/common";
import postgres from "postgres";
import { ONBOARDING_STEPS } from "@trajct/contracts";
import type { OnboardingAdvanceRequest, OnboardingState, OnboardingStep } from "@trajct/contracts";

/**
 * F-091c — Onboarding / first-run. Resumable stepper; the owner/first user is exempt
 * (onboarded_at backfilled, FR-091c.3). Reaching the diagnosis step is the activation goal
 * (BR-091c.2) — at that point onboarded_at is stamped.
 */

const COMPLETABLE = ONBOARDING_STEPS.filter((s) => s !== "done"); // welcome..diagnosis

export function nextStep(step: OnboardingStep): OnboardingStep {
  const i = ONBOARDING_STEPS.indexOf(step);
  return ONBOARDING_STEPS[Math.min(i + 1, ONBOARDING_STEPS.length - 1)] as OnboardingStep;
}
export function progressOf(completed: OnboardingStep[]): number {
  const done = new Set(completed.filter((s) => s !== "done"));
  return Math.min(1, done.size / COMPLETABLE.length);
}

@Injectable()
export class OnboardingService {
  private sql: ReturnType<typeof postgres> | null = null;
  private getSql(): ReturnType<typeof postgres> {
    if (!this.sql) {
      const url = process.env["DATABASE_URL"];
      if (!url) throw new Error("DATABASE_URL required");
      this.sql = postgres(url, { max: 3 });
    }
    return this.sql;
  }

  async getState(userId: string): Promise<OnboardingState> {
    const [u] = await this.getSql()`SELECT onboarded_at FROM users WHERE id = ${userId} LIMIT 1`;
    const [cursor] = await this.getSql()`SELECT current_step, completed_steps FROM onboarding_state WHERE user_id = ${userId} LIMIT 1`;

    // Owner/backfilled and never started the stepper → exempt (FR-091c.3).
    if (u?.["onboarded_at"] && !cursor) {
      return { currentStep: "done", completedSteps: [...COMPLETABLE], progress: 1, onboarded: true, exempt: true };
    }
    if (!cursor) {
      return { currentStep: "welcome", completedSteps: [], progress: 0, onboarded: false, exempt: false };
    }
    const completed = (cursor["completed_steps"] as OnboardingStep[]) ?? [];
    return {
      currentStep: cursor["current_step"] as OnboardingStep,
      completedSteps: completed,
      progress: progressOf(completed),
      onboarded: !!u?.["onboarded_at"],
      exempt: false,
    };
  }

  /** Record the step (skippable for optional steps) and advance the cursor. Resumable. */
  async advance(userId: string, req: OnboardingAdvanceRequest): Promise<OnboardingState> {
    const [cur] = await this.getSql()`SELECT completed_steps, data FROM onboarding_state WHERE user_id = ${userId} LIMIT 1`;
    const completed = new Set<OnboardingStep>((cur?.["completed_steps"] as OnboardingStep[]) ?? []);
    completed.add(req.step);
    const next = nextStep(req.step);
    const mergedData = { ...((cur?.["data"] as object) ?? {}), ...(req.data ?? {}) };

    await this.getSql()`
      INSERT INTO onboarding_state (user_id, current_step, completed_steps, data, updated_at)
      VALUES (${userId}, ${next}, ${this.getSql().json([...completed] as never)}, ${this.getSql().json(mergedData as never)}, now())
      ON CONFLICT (user_id) DO UPDATE SET
        current_step = ${next}, completed_steps = ${this.getSql().json([...completed] as never)},
        data = ${this.getSql().json(mergedData as never)}, updated_at = now()
    `;

    // [BR-091c.2] Reaching diagnosis (or done) is activation — stamp onboarded_at once.
    if (req.step === "diagnosis" || next === "done") {
      await this.getSql()`UPDATE users SET onboarded_at = COALESCE(onboarded_at, now()), updated_at = now() WHERE id = ${userId}`;
    }
    return this.getState(userId);
  }
}
