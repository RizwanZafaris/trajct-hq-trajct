/**
 * F-060 — Trust wall.
 *
 * CandidatePublicProjection is the ONLY type employer-side code may import from the engine.
 * This type contains no private fields: no diagnostics, no weaknesses, no raw scores,
 * no outcome history identifiable to the candidate.
 *
 * DO NOT add any field here without a trust-wall review. Every field is intentional.
 */
export interface CandidatePublicProjection {
  /** Pseudonymous identifier — never the real user_id in employer context */
  anonymizedId: string;
  /** Consent reference — must be non-null for this projection to be constructable */
  consentRef: string;
  /** Seniority band — derived, not verbatim from resume */
  seniorityBand: "entry" | "mid" | "senior" | "staff" | "principal" | "executive";
  /** Functional areas the candidate has consented to share */
  functionalAreas: string[];
  /** Region availability (not home address) */
  availableRegions: string[];
  /** Skill signals — never raw resume text, always derived/aggregated */
  skillSignals: string[];
  /** Availability status */
  availability: "active" | "passive" | "not-looking";
  /** Whether the candidate has consented to this employer seeing them */
  employerConsentGranted: boolean;
}
