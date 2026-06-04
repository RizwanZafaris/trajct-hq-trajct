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

export declare function evaluateScreening(req: ScreeningRequest): Promise<ScreeningResult>;
