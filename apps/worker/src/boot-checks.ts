/**
 * [FIX R9] Boot-time safety asserts. Malware scanning must NOT be silently skippable in
 * production: if NODE_ENV==='production' and no CLAMAV_HOST is configured, the process must
 * refuse to start (a "dev skip" that ships is a security hole). Pure function (throws) so it
 * is unit-testable; the entrypoint turns a throw into process.exit(1).
 */

export class BootCheckError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BootCheckError";
  }
}

export interface BootEnv {
  NODE_ENV?: string | undefined;
  CLAMAV_HOST?: string | undefined;
}

/** Throws BootCheckError if malware scanning is not configured in production. */
export function assertMalwareScanningConfigured(env: BootEnv = process.env): void {
  if (env.NODE_ENV === "production" && !env.CLAMAV_HOST) {
    throw new BootCheckError(
      "Malware scanning is not configured (CLAMAV_HOST unset) in production. " +
      "Refusing to start — uploads would be accepted unscanned (FR-001.10). Set CLAMAV_HOST."
    );
  }
}

/** Run all boot checks. Exits the process on failure (entrypoint use). */
export function runBootChecks(env: BootEnv = process.env): void {
  assertMalwareScanningConfigured(env);
}
