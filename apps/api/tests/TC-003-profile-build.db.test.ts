/**
 * TC-003.3 / .7 — Profile build pipeline (dev mock NER, no LLM keys).
 *
 * .7  >10 docs → TOO_MANY_DOCS (thrown before any I/O)
 * .3  a non-career doc is SKIPPED (NOT_A_CAREER_DOC) while the career doc still processes
 * + the master profile is upserted (one per user).
 *
 * Covers: F-003 BR-003.1, FR-003.6, NFR-003.3
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";
import { ProfileService, type ProfileDoc } from "../src/candidate/profile/profile.service.js";

const DB_URL = process.env["DATABASE_URL"]!;
const USER = "03030303-0000-0000-0000-000000000003";

const CAREER = Buffer.from(`Jane Roe — Senior Engineer at Globex
Experience: Senior Engineer at Globex building payment systems. Led a platform team.
Education: MS Computer Science, State University.
Skills: TypeScript, Postgres, Kubernetes.`);
const NON_CAREER = Buffer.from("INVOICE #4821 — total amount due $1,250. Payment terms net 30. Thank you for your business.");

async function code(fn: () => Promise<unknown>): Promise<string> {
  try { await fn(); return "NO_ERROR"; }
  catch (e) { return ((e as { response?: { code?: string } }).response?.code) ?? "UNKNOWN"; }
}

describe("TC-003 profile build", () => {
  let sql: ReturnType<typeof postgres>;
  const svc = new ProfileService();

  beforeAll(async () => {
    sql = postgres(DB_URL, { max: 2 });
    await sql`INSERT INTO users (id, email, user_type, password_hash) VALUES (${USER}, 'tc003@test.dev', 'candidate', 'h') ON CONFLICT (id) DO NOTHING`;
  });
  afterAll(async () => {
    await sql`DELETE FROM candidate_profiles WHERE user_id = ${USER}`;
    await sql`DELETE FROM users WHERE id = ${USER}`;
    await sql.end();
  });

  it(".7 >10 docs → TOO_MANY_DOCS", async () => {
    const docs: ProfileDoc[] = Array.from({ length: 11 }, (_, i) => ({ buffer: CAREER, fileName: `d${i}.txt`, mime: "text/plain" }));
    expect(await code(() => svc.buildProfile(USER, docs))).toBe("TOO_MANY_DOCS");
  });

  it(".3 non-career doc skipped (NOT_A_CAREER_DOC), career doc processed, profile upserted", async () => {
    const result = await svc.buildProfile(USER, [
      { buffer: CAREER, fileName: "resume.txt", mime: "text/plain" },
      { buffer: NON_CAREER, fileName: "invoice.txt", mime: "text/plain" },
    ]);

    const skipped = result.doc_results.find((d) => d.fileName === "invoice.txt");
    const processed = result.doc_results.find((d) => d.fileName === "resume.txt");
    expect(skipped?.status).toBe("skipped");
    expect(skipped?.errorCode).toBe("NOT_A_CAREER_DOC");
    expect(processed?.status).toBe("processed");        // others still process (NFR-003.3)

    expect(result.profile_id).toBeTruthy();
    expect(result.skills).toContain("TypeScript");

    // One master profile per user.
    const rows = await sql`SELECT count(*)::int AS n FROM candidate_profiles WHERE user_id = ${USER}`;
    expect(rows[0]!["n"]).toBe(1);
  });
});
