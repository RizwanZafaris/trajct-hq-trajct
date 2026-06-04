/**
 * F-034.2 — Consent capture for screening.
 * Consent must be captured before any assessment begins. Immutable once written.
 */

export interface ConsentRecord {
  id: string;
  userId: string;
  orgId: string;
  jobId: string;
  region: string;
  purposes: string[];
  capturedAt: string;
  ipAddress?: string;
  expiresAt?: string;
}

export declare function captureConsent(
  userId: string,
  orgId: string,
  jobId: string,
  region: string,
  purposes: string[]
): Promise<ConsentRecord>;

export declare function verifyConsent(consentRef: string): Promise<ConsentRecord | null>;
