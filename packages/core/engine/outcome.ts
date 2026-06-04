/**
 * F-050 — Outcome logging.
 * Must ship from day one — you cannot learn from data you never captured.
 * Captures who got an interview, who got hired, which artifacts/knowledge drove it.
 */

export interface OutcomeEvent {
  userId: string;
  companyId: string;
  jobId?: string;
  outcome: "interview_win" | "interview_loss" | "offer" | "hire" | "rejection" | "withdraw";
  artifactIds: string[];
  citeMarkers: string[];
  timestamp: string;
  consentRef: string;
}

export interface OutcomeRecord extends OutcomeEvent {
  id: string;
  creditAssigned: boolean;
}

export declare function logOutcome(event: OutcomeEvent): Promise<OutcomeRecord>;
export declare function getOutcome(id: string): Promise<OutcomeRecord | null>;
