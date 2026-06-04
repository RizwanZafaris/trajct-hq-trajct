/**
 * @trajct/contracts — single source of truth for all API schemas.
 *
 * Rule: NO endpoint exists without a contract here first.
 * Zod schemas drive: (1) runtime validation, (2) TypeScript types, (3) generated OpenAPI 3.1.
 */

export * from "./auth.js";
export * from "./org.js";
export * from "./diagnostic.js";
export * from "./errors.js";
