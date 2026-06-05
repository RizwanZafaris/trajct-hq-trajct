/**
 * @trajct/contracts — single source of truth for all API schemas.
 * Rule: NO endpoint exists without a contract here first.
 */

// Platform
export * from "./auth.js";
export * from "./org.js";
export * from "./errors.js";

// F-001 Diagnostic
export * from "./diagnostic.js";

// Candidate
export * from "./candidate/resume.js";
export * from "./candidate/profile.js";
export * from "./candidate/resume-edit.js";
export * from "./candidate/rate-job.js";
export * from "./candidate/prep.js";
export * from "./candidate/tracker.js";
export * from "./candidate/monitoring.js";

// Employer
export * from "./employer/jd.js";
export * from "./employer/matching.js";
export * from "./employer/pipeline.js";

// Engine
export * from "./engine/persona.js";
