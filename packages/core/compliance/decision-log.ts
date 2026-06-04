/**
 * F-080 — Compliance & decision audit logging.
 *
 * FAIL-CLOSED: throws DecisionLogWriteError on any failure.
 * The caller (worker q.compliance) must NOT serve the decision if this throws.
 *
 * CONSENT REQUIRED: throws ConsentMissingError if consentRef is absent or invalid.
 * This is a placeholder that will throw if called without consent — by design (F-080 stub).
 */

export interface DecisionLogEntry {
  decisionType: "screening" | "matching" | "recommendation";
  accountId: string;
  candidateAnonymizedId: string;
  orgId: string;
  jobId?: string;
  inputsHash: string;
  modelVersion: string;
  promptVersion: string;
  rationale: string;
  consentRef: string;
  region: string;
  timestamp: string;
}

export interface DecisionLogResult {
  logId: string;
  hashChain: string;
}

export class DecisionLogWriteError extends Error {
  constructor(reason: string) {
    super(`Decision log write failed: ${reason}. Decision will NOT be served.`);
    this.name = "DecisionLogWriteError";
  }
}

export class ConsentMissingError extends Error {
  constructor() {
    super("writeDecisionLog requires a valid consentRef. Cannot log or serve a decision without consent.");
    this.name = "ConsentMissingError";
  }
}

export declare function writeDecisionLog(entry: DecisionLogEntry): Promise<DecisionLogResult>;
