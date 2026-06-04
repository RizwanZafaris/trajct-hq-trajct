/**
 * packages/core/engine — Public API (trust wall boundary)
 *
 * FRD ownership: F-050 (Outcome logging + cite-markers), F-051 (Outcome-learning loop),
 *               F-052 (Per-company persona synthesis), F-057 (Provider-agnostic AI layer),
 *               F-060 (Trust wall)
 *
 * TRUST WALL (F-060): This index is the ONLY thing employer-side code may import.
 * CandidatePublicProjection is the only type crossing the boundary.
 * Engine internals are private — the lint rule (eslint-plugin-boundaries) enforces this.
 */

// Trust wall: the only type employer code may use
export type { CandidatePublicProjection } from "./trust-wall";

// Cite-markers substrate (F-050) — used by both candidate and employer artifacts
export type { CiteMarker, ArtifactWithCitations } from "./cite-markers";
export { attachCiteMarkers, resolveCiteMarker } from "./cite-markers";

// Outcome logging (F-050) — required from day one even before the learning loop is live
export type { OutcomeEvent, OutcomeRecord } from "./outcome";
export { logOutcome, getOutcome } from "./outcome";

// Persona synthesis (F-052) — public interface only
export type { CompanyPersona, PersonaQuery } from "./persona";
export { getPersona, synthesizePersona } from "./persona";
