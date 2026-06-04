/**
 * packages/core/engine — Public API (trust wall boundary)
 *
 * FRD ownership: F-050, F-051, F-052, F-053, F-054, F-055, F-056, F-058, F-059, F-060
 *
 * TRUST WALL (F-060): Employer-side code may import ONLY CandidatePublicProjection.
 * The lint rule (eslint-plugin-boundaries) enforces this; everything else here is for
 * candidate-side services and the worker.
 */

// --- Trust wall (F-060): the ONLY type employer code may use --------------
export type { CandidatePublicProjection } from "./trust-wall.js";

// --- F-050 cite-markers ---------------------------------------------------
export type { CiteMarker, ArtifactWithCitations } from "./cite-markers.js";
export { attachCiteMarkers, extractCiteMarkers, resolveCiteMarker, upsertKnowledgeRef } from "./cite-markers.js";

// --- F-050 outcome logging ------------------------------------------------
export type { OutcomeEvent, OutcomeRecord } from "./outcome.js";
export { logOutcome, getOutcome, OutcomeConsentMissingError } from "./outcome.js";

// --- F-051 outcome-learning loop ------------------------------------------
export type { CreditAssignResult } from "./outcome-loop.js";
export { assignCredit, CREDIT_DELTA } from "./outcome-loop.js";

// --- F-052 / F-054 persona ------------------------------------------------
export type { CompanyPersona, PersonaQuery, AtsKeywordBank, SynthesisResult } from "./persona.js";
export {
  getPersona, getOrSynthesize, synthesizePersona, upsertPersona,
  listStalePersonas, decayFreshness,
} from "./persona.js";

// --- F-053 enrichment (internal signal — not employer-facing) -------------
export type { CompanyEnrichmentResult } from "./enrichment.js";
export { enrichCompany, getCachedEnrichment, enrichmentAvailable } from "./enrichment.js";

// --- F-055 voice calibration ----------------------------------------------
export type { VoiceProfile, EngineComplete } from "./voice.js";
export { voiceExtract, voiceInject, getVoiceProfile } from "./voice.js";

// --- F-058 job discovery --------------------------------------------------
export type { DiscoveredJob, DiscoveryQuery, JobDiscoveryAdapter } from "./discovery/index.js";
export { runDiscovery, persistDiscoveredJobs } from "./discovery/index.js";

// --- SSRF-safe fetch (R6) — used by research/discovery; shared with Sprint B fetchers
export type { SafeFetchResult, SafeFetchOptions } from "./safe-fetch.js";
export { safeFetch, isPrivateIp, SSRFBlockedError } from "./safe-fetch.js";

// --- F-059 legitimacy filter ----------------------------------------------
export type { LegitimacyResult, LegitimacyTier, LegitimacyInput, LegitimacyDeps } from "./legitimacy.js";
export {
  scoreJobLegitimacy, ageScore, repostScore, compositeScore, tierFor, defaultUrlReachable,
} from "./legitimacy.js";
