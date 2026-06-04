/**
 * TC-052.1 — Persona synthesis freshness gate + upsert.
 *
 * - upsertPersona round-trips and sets freshness=1.0, version bumps on re-upsert
 * - getOrSynthesize on a FRESH persona (freshness>0.3) → returns cache (no change)
 * - getOrSynthesize on a NEW company (no row) → returns null (enqueue is fire-and-forget)
 * - prior version is snapshotted to persona_versions on re-synthesis
 *
 * Covers: F-052
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";
import { upsertPersona, getPersona, getOrSynthesize, __setSql, type SynthesisResult } from "../engine/persona.js";

const DB_URL = process.env["DATABASE_URL"]!;
const COMPANY = "ffffffff-0000-0000-0000-0000000052a1";

const synth: SynthesisResult = {
  hiringSignals: ["ships fast", "values ownership"],
  cultureIndicators: ["async", "writing-first"],
  successPatterns: ["quantified impact"],
  rejectionPatterns: ["buzzword-heavy"],
  atsKeywordBank: { required: ["typescript"], boost: ["postgres"], banned: ["ninja"] },
  evidenceRefs: ["https://acme.test/careers"],
  quality: "high",
};

describe("TC-052.1 Persona synthesis", () => {
  let sql: ReturnType<typeof postgres>;

  beforeAll(async () => {
    sql = postgres(DB_URL, { max: 2 });
    __setSql(sql);
    await sql`DELETE FROM persona_versions WHERE company_id = ${COMPANY}`;
    await sql`DELETE FROM company_personas WHERE company_id = ${COMPANY}`;
  });

  afterAll(async () => {
    await sql`DELETE FROM persona_versions WHERE company_id = ${COMPANY}`;
    await sql`DELETE FROM company_personas WHERE company_id = ${COMPANY}`;
    await sql.end();
  });

  it("upsertPersona stores synthesis with freshness=1.0", async () => {
    const p = await upsertPersona(COMPANY, synth, "Acme");
    expect(p.companyId).toBe(COMPANY);
    expect(p.freshnessScore).toBe(1.0);
    expect(p.atsKeywordBank.required).toContain("typescript");
    expect(p.quality).toBe("high");

    const read = await getPersona({ companyId: COMPANY, requestingUserId: "system" });
    expect(read?.hiringSignals).toContain("ships fast");
  });

  it("getOrSynthesize returns the cached persona when fresh (freshness>0.3)", async () => {
    const cached = await getOrSynthesize(COMPANY, "Acme");
    expect(cached).not.toBeNull();
    expect(cached!.freshnessScore).toBeGreaterThan(0.3);
  });

  it("re-upsert bumps version and snapshots the prior version", async () => {
    await upsertPersona(COMPANY, { ...synth, quality: "medium" }, "Acme");
    const versions = await sql`SELECT COUNT(*)::int AS n FROM persona_versions WHERE company_id = ${COMPANY}`;
    expect(versions[0]!["n"]).toBeGreaterThanOrEqual(1);

    const [row] = await sql`SELECT version FROM company_personas WHERE company_id = ${COMPANY}`;
    expect(row!["version"]).toBeGreaterThanOrEqual(2);
  });

  it("getOrSynthesize on an unknown company returns null (enqueue is async)", async () => {
    const unknown = await getOrSynthesize("ffffffff-0000-0000-0000-0000000052ff", "Nobody");
    expect(unknown).toBeNull();
  });
});
