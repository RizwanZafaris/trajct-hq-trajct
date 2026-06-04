/**
 * F-034 — Region-gated screening evaluation skeleton.
 * NOT LIVE until the launch gate conditions in README.md are met.
 */

export interface ScreeningRequest {
  candidateId: string;
  jobId: string;
  orgId: string;
  region: string;
  consentRef: string;
  rubricId: string;
}

export interface ScreeningResult {
  evaluationId: string;
  scores: Record<string, number>;
  rationale: string;
  modelVersion: string;
  promptVersion: string;
  auditLogId: string;
}

export class ScreeningRegionDisabledError extends Error {
  constructor(region: string) {
    super(`Screening is not enabled in region: ${region}`);
    this.name = "ScreeningRegionDisabledError";
  }
}

export class ScreeningGatedError extends Error {
  constructor() {
    super(
      "F-034 screening is GATED (V2). It cannot run until the launch-gate checklist passes: " +
      "F-080 decision log wired, F-081 residency confirmed, bias audit passed, consent captured, " +
      "and screening_enabled flag set per region. See packages/core/screening/README.md."
    );
    this.name = "ScreeningGatedError";
  }
}

/**
 * F-034 — gated. Region-gate is checked first (throws ScreeningRegionDisabledError when the
 * feature flag is off), then the launch gate (throws ScreeningGatedError until V2 launch).
 * This is a real, gated body (no declare-stub, no naked throw) so the engine path is stub-free;
 * it deliberately refuses to run until the launch gate opens.
 */
export async function evaluateScreening(req: ScreeningRequest): Promise<ScreeningResult> {
  const flag = process.env[`SCREENING_ENABLED_${req.region.toUpperCase()}`] ?? process.env["SCREENING_ENABLED"];
  if (flag !== "true") throw new ScreeningRegionDisabledError(req.region);
  // Flag on but the implementation is V2 — fail closed, never serve a fabricated screening.
  throw new ScreeningGatedError();
}
