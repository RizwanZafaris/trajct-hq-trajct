/**
 * TC-004 (db) — chat-driven résumé editing end-to-end (dev mock, no LLM keys).
 *
 * .1  quick_tweak applies, shows a diff, appends a version; undo restores prior text (AC-004.1.1)
 *     rebuild_section leaves other sections byte-identical (AC-004.1.2, NFR-004.2)
 * .2  fabrication request → 409 FABRICATION_REFUSED (AC-004.1.3);
 *     vague instruction → 400 INSTRUCTION_UNCLEAR (AC-004.1.5);
 *     stale version → 409 EDIT_CONFLICT (AC-004.1.4)
 * .3  undo/redo never corrupts the chain incl. redo-cleared-after-edit (AC-004.1.7, NFR-004.4);
 *     over the cost ceiling → 423 COST_CEILING_HIT (AC-004.1.6)
 *
 * Covers: F-004 FR-004.1/.2/.3/.4/.5/.7/.8/.9, BR-004.1/.2/.5
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";
import { EditService } from "../src/candidate/resume/edit.service.js";
import { reserveCap, releaseCap } from "@trajct/core/billing";

const DB_URL = process.env["DATABASE_URL"]!;
const USER = "04040404-0000-0000-0000-000000000004";
const CAPUSER = "04040404-0000-0000-0000-0000000000ca";
const R1 = "0e040004-0000-0000-0000-000000000001";
const R2 = "0e040004-0000-0000-0000-000000000002";
const R3 = "0e040004-0000-0000-0000-000000000003";
const R4 = "0e040004-0000-0000-0000-000000000004";
const R5 = "0e040004-0000-0000-0000-000000000005";

const GOOD_PROFILE =
  "Senior Engineer at Globex. Built payment systems at Globex; led the platform team. Skills: TypeScript, Postgres, Kubernetes. MS Computer Science.";

const SEED = [
  "## SUMMARY",
  "Senior Engineer very experienced in payment systems at Globex.",
  "",
  "## EXPERIENCE",
  "Senior Engineer at Globex. Responsible in order to lead the platform team.",
  "Built payment systems very efficiently.",
  "",
  "## EDUCATION",
  "MS Computer Science.",
  "",
  "## SKILLS",
  "TypeScript, Postgres, Kubernetes.",
].join("\n");

async function outcome(fn: () => Promise<unknown>): Promise<{ status: number; code: string }> {
  try { await fn(); return { status: 200, code: "NO_ERROR" }; }
  catch (e) {
    const ex = e as { getStatus?: () => number; response?: { code?: string } };
    return { status: ex.getStatus?.() ?? 0, code: ex.response?.code ?? "UNKNOWN" };
  }
}

describe("TC-004 chat-edit", () => {
  let sql: ReturnType<typeof postgres>;
  const svc = new EditService();

  beforeAll(async () => {
    sql = postgres(DB_URL, { max: 2 });
    for (const u of [USER, CAPUSER]) {
      await sql`INSERT INTO users (id, email, user_type, password_hash) VALUES (${u}, ${u + "@test.dev"}, 'candidate', 'h') ON CONFLICT (id) DO NOTHING`;
      await sql`INSERT INTO candidate_profiles (id, user_id, parsed_text) VALUES (gen_random_uuid(), ${u}, ${GOOD_PROFILE}) ON CONFLICT (user_id) DO UPDATE SET parsed_text = ${GOOD_PROFILE}`;
    }
  });
  afterAll(async () => {
    await releaseCap(CAPUSER, "tc004-exhaust").catch(() => {});
    for (const u of [USER, CAPUSER]) {
      await sql`DELETE FROM resume_edit_cursor WHERE user_id = ${u}`;
      await sql`DELETE FROM resume_versions WHERE user_id = ${u}`;
      await sql`DELETE FROM candidate_profiles WHERE user_id = ${u}`;
      await sql`DELETE FROM users WHERE id = ${u}`;
    }
    await sql.end();
  });

  it(".1 quick_tweak applies, shows a diff, appends a version; undo restores (AC-004.1.1)", async () => {
    const v1 = await svc.seedVersion(R1, USER, SEED);
    expect(v1.versionNo).toBe(1);

    const r = await svc.applyEdit(R1, { versionId: v1.currentVersionId, instruction: "tighten the experience bullets", mode: "auto" }, USER);
    expect(r.modeApplied).toBe("quick_tweak");
    expect(r.fabricationScanPassed).toBe(true);                                  // FR-004.6
    expect(r.diff.changed.length + r.diff.added.length + r.diff.removed.length).toBeGreaterThan(0); // FR-004.2

    const [row] = await sql`SELECT version_no, content FROM resume_versions WHERE id = ${r.newVersionId}`;
    expect(row!["version_no"]).toBe(2);
    expect(row!["content"]).not.toContain("in order to");

    const back = await svc.undo(R1, USER);                                       // FR-004.4
    expect(back.versionNo).toBe(1);
    expect(back.content).toBe(SEED);                                             // exact restore
  });

  it(".1 rebuild_section leaves other sections byte-identical (AC-004.1.2, NFR-004.2)", async () => {
    const v1 = await svc.seedVersion(R2, USER, SEED);
    const r = await svc.applyEdit(R2, { versionId: v1.currentVersionId, instruction: "rebuild my experience section", mode: "rebuild_section", section: "EXPERIENCE" }, USER);
    expect(r.modeApplied).toBe("rebuild_section");

    const [row] = await sql`SELECT content FROM resume_versions WHERE id = ${r.newVersionId}`;
    const out = row!["content"] as string;
    expect(out).not.toContain("in order to");                                   // EXPERIENCE rebuilt
    // SUMMARY + EDUCATION + SKILLS byte-identical (filler intentionally preserved).
    expect(out).toContain("## SUMMARY\nSenior Engineer very experienced in payment systems at Globex.");
    expect(out).toContain("## EDUCATION\nMS Computer Science.");
    expect(out).toContain("## SKILLS\nTypeScript, Postgres, Kubernetes.");
  });

  it(".2 refuses fabrication, refuses vague, rejects a stale version", async () => {
    const v1 = await svc.seedVersion(R3, USER, SEED);

    const fab = await outcome(() => svc.applyEdit(R3, { versionId: v1.currentVersionId, instruction: "add a Director role at Meta I never held", mode: "auto" }, USER));
    expect(fab).toEqual({ status: 409, code: "FABRICATION_REFUSED" });          // AC-004.1.3

    const vague = await outcome(() => svc.applyEdit(R3, { versionId: v1.currentVersionId, instruction: "make it better", mode: "auto" }, USER));
    expect(vague).toEqual({ status: 400, code: "INSTRUCTION_UNCLEAR" });        // AC-004.1.5

    // Advance the head, then edit the now-stale v1 → conflict (AC-004.1.4).
    await svc.applyEdit(R3, { versionId: v1.currentVersionId, instruction: "tighten the summary", mode: "auto" }, USER);
    const stale = await outcome(() => svc.applyEdit(R3, { versionId: v1.currentVersionId, instruction: "tighten the skills", mode: "auto" }, USER));
    expect(stale).toEqual({ status: 409, code: "EDIT_CONFLICT" });
  });

  it(".3 undo/redo navigate the chain without corruption, incl. redo-cleared (AC-004.1.7)", async () => {
    const v1 = await svc.seedVersion(R4, USER, SEED);
    const e2 = await svc.applyEdit(R4, { versionId: v1.currentVersionId, instruction: "tighten the experience", mode: "auto" }, USER);
    await svc.applyEdit(R4, { versionId: e2.newVersionId, instruction: "rebuild my skills section", mode: "rebuild_section", section: "SKILLS" }, USER);

    let cur = await svc.currentVersion(R4, USER);
    expect(cur.versionNo).toBe(3);
    expect(cur.canRedo).toBe(false);
    expect(cur.canUndo).toBe(true);

    expect((await svc.undo(R4, USER)).versionNo).toBe(2);
    const atV1 = await svc.undo(R4, USER);
    expect(atV1.versionNo).toBe(1);
    expect(atV1.canUndo).toBe(false);                     // clamp at start
    expect(atV1.canRedo).toBe(true);
    expect((await svc.undo(R4, USER)).versionNo).toBe(1); // undo past start = no-op

    expect((await svc.redo(R4, USER)).versionNo).toBe(2);
    expect((await svc.redo(R4, USER)).versionNo).toBe(3);
    expect((await svc.redo(R4, USER)).versionNo).toBe(3); // redo past tip = no-op

    // Redo stack cleared after a new edit (FRD §4.4.10): undo to v2, branch to v4, then
    // redo must reach v4 — never the orphaned v3.
    await svc.undo(R4, USER); // → v2
    const at2 = await svc.currentVersion(R4, USER);
    const e4 = await svc.applyEdit(R4, { versionId: at2.currentVersionId, instruction: "tighten the summary", mode: "auto" }, USER);
    expect((await svc.currentVersion(R4, USER)).versionNo).toBe(4);
    await svc.undo(R4, USER); // → v2
    expect((await svc.redo(R4, USER)).currentVersionId).toBe(e4.newVersionId);
  });

  it(".3 over the cost ceiling → 423 COST_CEILING_HIT (AC-004.1.6)", async () => {
    const v1 = await svc.seedVersion(R5, CAPUSER, SEED);
    // Exhaust the paid ceiling (5000¢ default) with a persistent reservation → next edit can't reserve.
    await reserveCap(CAPUSER, 5000, "tc004-exhaust");
    const over = await outcome(() => svc.applyEdit(R5, { versionId: v1.currentVersionId, instruction: "tighten the summary", mode: "auto" }, CAPUSER));
    expect(over).toEqual({ status: 423, code: "COST_CEILING_HIT" });
  });
});
