/**
 * F-052 — Per-company persona synthesis.
 * Builds evidence-grounded per-company hiring personas from research docs + outcomes.
 */

export interface PersonaQuery {
  companyId: string;
  requestingUserId: string;
  consentRef?: string;
}

export interface CompanyPersona {
  companyId: string;
  version: string;
  synthesizedAt: string;
  hiringSignals: string[];
  cultureIndicators: string[];
  successPatterns: string[];
  evidenceRefs: string[];
  freshnessScore: number;
}

export declare function getPersona(query: PersonaQuery): Promise<CompanyPersona | null>;
export declare function synthesizePersona(companyId: string): Promise<CompanyPersona>;
