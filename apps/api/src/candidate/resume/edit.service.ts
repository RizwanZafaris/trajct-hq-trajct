import { Injectable, HttpException } from "@nestjs/common";
import { randomUUID, createHash } from "crypto";
import postgres from "postgres";
import { checkCap } from "@trajct/core/billing";
import { scanGrounding, GroundingScanError, companyTokens, type GroundingJudge } from "@trajct/core/engine";
import { apiGateway, hasLlmKeys } from "../../common/gateway.js";
import type { EditRequest, EditResult, EditDiff, EditMode, EditNavResult } from "@trajct/contracts";

/**
 * F-004 — Chat-driven résumé editing (synchronous; FRD §4.4.9 returns 200 inline).
 *
 * Invariants:
 *  - [BR-004.1/FR-004.7] Optimistic concurrency on the version chain. Editing a stale version
 *    → 409 EDIT_CONFLICT (also enforced by a UNIQUE(resume_id, version_no) race-loser).
 *  - [FR-004.6/BR-004.2] Every rebuild is grounding-scanned (FAIL-CLOSED). A scanner outage is
 *    NOT clean (503, version unchanged). Generated content that introduces ungrounded facts is
 *    refused (409 FABRICATION_REFUSED) — we never silently invent experience.
 *  - [FR-004.9] Instructions that ASK to fabricate are refused up front (409), with an explanation.
 *  - [FR-004.5] We only append a new version + return it. Nothing is ever auto-sent/applied/submitted.
 *  - [FR-004.4] Append-only chain + cursor (current/tip) → undo/redo ≥20 with no corruption.
 */

const MODE_COST_CENTS: Record<Exclude<EditMode, "auto">, number> = {
  quick_tweak: 5,        // fair-use; metered lightly
  rebuild_section: 30,
  full_rebuild: 50,
};

@Injectable()
export class EditService {
  private sql: ReturnType<typeof postgres> | null = null;
  private getSql(): ReturnType<typeof postgres> {
    if (!this.sql) {
      const url = process.env["DATABASE_URL"];
      if (!url) throw new Error("DATABASE_URL required");
      this.sql = postgres(url, { max: 3 });
    }
    return this.sql;
  }

  // ----- seed / read ------------------------------------------------------
  /** Seed the chain with v1 from an existing résumé's content (idempotent on resume_id). */
  async seedVersion(resumeId: string, userId: string, content: string): Promise<EditNavResult> {
    const sql = this.getSql();
    const [existing] = await sql`SELECT current_version_id FROM resume_edit_cursor WHERE resume_id = ${resumeId} AND user_id = ${userId}`;
    if (existing) return this.currentVersion(resumeId, userId);

    const v1 = randomUUID();
    await sql.begin(async (tx) => {
      await tx`
        INSERT INTO resume_versions (id, resume_id, user_id, version_no, parent_version_id, content, change_note, mode_applied, fabrication_scan_passed)
        VALUES (${v1}, ${resumeId}, ${userId}, 1, NULL, ${content}, 'Initial version', 'seed', true)
      `;
      await tx`
        INSERT INTO resume_edit_cursor (resume_id, user_id, current_version_id, tip_version_id)
        VALUES (${resumeId}, ${userId}, ${v1}, ${v1})
        ON CONFLICT (resume_id) DO NOTHING
      `;
    });
    return this.currentVersion(resumeId, userId);
  }

  /** The current editor head (seeds nothing). */
  async currentVersion(resumeId: string, userId: string): Promise<EditNavResult> {
    const sql = this.getSql();
    const [row] = await sql`
      SELECT v.id, v.version_no, v.content, v.parent_version_id, c.tip_version_id
      FROM resume_edit_cursor c JOIN resume_versions v ON v.id = c.current_version_id
      WHERE c.resume_id = ${resumeId} AND c.user_id = ${userId}
    `;
    if (!row) throw this.err(404, "NOT_FOUND", "No editable version — open the résumé first.", false);
    return {
      currentVersionId: row["id"] as string,
      versionNo: row["version_no"] as number,
      content: row["content"] as string,
      canUndo: row["parent_version_id"] != null,
      canRedo: (row["id"] as string) !== (row["tip_version_id"] as string),
    };
  }

  // ----- apply ------------------------------------------------------------
  async applyEdit(resumeId: string, req: EditRequest, userId: string): Promise<EditResult> {
    // BR-004.5 — instruction length (exact code, independent of the validation pipe).
    if (req.instruction.length > 2000) throw this.err(400, "INSTRUCTION_TOO_LONG", "Keep instructions under 2,000 characters.", false);
    if (req.mode === "rebuild_section" && !req.section) throw this.err(400, "INSTRUCTION_UNCLEAR", "Which section should I rebuild?", false);

    const sql = this.getSql();
    const profileText = await this.profileText(userId);

    // FR-004.9 — refuse instructions that ask to invent experience (before any spend).
    if (requestsFabrication(req.instruction, profileText)) {
      throw this.err(409, "FABRICATION_REFUSED", "I won't add experience you don't have.", false);
    }
    if (isUnclear(req.instruction)) {
      throw this.err(400, "INSTRUCTION_UNCLEAR", "Tell me what to change — e.g. \"tighten the second bullet in my current role.\"", false);
    }

    // Load the current head + verify the caller is editing it (BR-004.1 optimistic concurrency).
    const [cur] = await sql`
      SELECT v.id, v.version_no, v.content
      FROM resume_edit_cursor c JOIN resume_versions v ON v.id = c.current_version_id
      WHERE c.resume_id = ${resumeId} AND c.user_id = ${userId}
    `;
    if (!cur) throw this.err(404, "NOT_FOUND", "No editable version — open the résumé first.", false);
    if ((cur["id"] as string) !== req.versionId) {
      throw this.err(409, "EDIT_CONFLICT", "This résumé changed — re-base on the latest?", true);
    }

    const mode = classifyMode(req.instruction, req.mode, req.section);
    const instructionHash = createHash("sha256").update(`${mode}|${req.section ?? ""}|${req.instruction}`).digest("hex");

    // Idempotency (FRD §4.4.10): same base + same instruction → return the existing child.
    const [dup] = await sql`
      SELECT id, content, change_note, mode_applied, diff, fabrication_scan_passed
      FROM resume_versions
      WHERE resume_id = ${resumeId} AND parent_version_id = ${req.versionId} AND instruction_hash = ${instructionHash}
    `;
    if (dup) {
      return {
        newVersionId: dup["id"] as string,
        diff: (dup["diff"] as EditDiff) ?? { added: [], removed: [], changed: [] },
        changeNote: (dup["change_note"] as string) ?? "",
        modeApplied: (dup["mode_applied"] as EditMode) ?? mode,
        fabricationScanPassed: (dup["fabrication_scan_passed"] as boolean) ?? true,
      };
    }

    // FR-004.8 / BR-004.3 — halting spend cap (fail-closed: cap-service down → deny = 423).
    const cost = MODE_COST_CENTS[mode];
    let capAllowed = false;
    try {
      const cap = await checkCap({ accountId: userId, projectedCost: cost, tier: "paid" });
      capAllowed = cap.allowed;
    } catch {
      capAllowed = false; // FAIL-CLOSED
    }
    if (!capAllowed) throw this.err(423, "COST_CEILING_HIT", "Temporarily paused to protect quality — resets next cycle.", false);

    // Generate the edited content (mode-aware). Real LLM down → 503, version unchanged.
    const before = cur["content"] as string;
    let after: string;
    try {
      after = await this.generate(mode, before, req.instruction, req.section, profileText, userId, instructionHash);
    } catch {
      throw this.err(503, "ENGINE_UNAVAILABLE", "Try again shortly.", true);
    }

    // FR-004.6 — grounding scan on every rebuild. FAIL-CLOSED: scanner outage = 503 (unchanged).
    let scan;
    try {
      scan = await scanGrounding(after, profileText, this.judge(userId, instructionHash));
    } catch (e) {
      if (e instanceof GroundingScanError) throw this.err(503, "ENGINE_UNAVAILABLE", "Couldn't verify the edit — try again shortly.", true);
      throw e;
    }
    // BR-004.2 — an edit that introduced ungrounded facts is refused (never silently kept).
    if (!scan.clean) throw this.err(409, "FABRICATION_REFUSED", "That edit would add details not in your profile, so I stopped.", false);

    const diff = computeDiff(before, after);
    const changeNote = buildChangeNote(mode, diff, req.section);
    const newId = randomUUID();

    try {
      await sql.begin(async (tx) => {
        // Globally-monotonic per résumé (NOT parent+1): undo-then-edit branches must not reuse a
        // number. Two concurrent edits from the same head still collide on the UNIQUE constraint
        // → one gets 409 (BR-004.1). The cursor check above already rejected stale-version edits.
        const [seq] = await tx`SELECT (COALESCE(max(version_no), 0) + 1)::int AS next_no FROM resume_versions WHERE resume_id = ${resumeId}`;
        const nextNo = seq!["next_no"] as number;
        await tx`
          INSERT INTO resume_versions
            (id, resume_id, user_id, version_no, parent_version_id, content, change_note, mode_applied, instruction, instruction_hash, section, diff, fabrication_scan_passed)
          VALUES
            (${newId}, ${resumeId}, ${userId}, ${nextNo}, ${req.versionId}, ${after}, ${changeNote}, ${mode}, ${req.instruction}, ${instructionHash}, ${req.section ?? null}, ${tx.json(diff as never)}, true)
        `;
        // Advance the head; tip moves forward → redo stack cleared (standard editor semantics).
        await tx`
          UPDATE resume_edit_cursor SET current_version_id = ${newId}, tip_version_id = ${newId}, updated_at = now()
          WHERE resume_id = ${resumeId} AND user_id = ${userId}
        `;
      });
    } catch (e) {
      // UNIQUE(resume_id, version_no) violated → another edit won the race (BR-004.1).
      if (e instanceof Error && /resume_versions_resume_version_uq|duplicate key/i.test(e.message)) {
        throw this.err(409, "EDIT_CONFLICT", "This résumé changed — re-base on the latest?", true);
      }
      throw e;
    }

    return { newVersionId: newId, diff, changeNote, modeApplied: mode, fabricationScanPassed: true };
  }

  // ----- undo / redo ------------------------------------------------------
  async undo(resumeId: string, userId: string): Promise<EditNavResult> {
    const sql = this.getSql();
    const [cur] = await sql`
      SELECT v.id, v.parent_version_id FROM resume_edit_cursor c JOIN resume_versions v ON v.id = c.current_version_id
      WHERE c.resume_id = ${resumeId} AND c.user_id = ${userId}
    `;
    if (!cur) throw this.err(404, "NOT_FOUND", "Nothing to undo.", false);
    const parent = cur["parent_version_id"] as string | null;
    if (parent) {
      await sql`UPDATE resume_edit_cursor SET current_version_id = ${parent}, updated_at = now() WHERE resume_id = ${resumeId} AND user_id = ${userId}`;
    }
    return this.currentVersion(resumeId, userId);
  }

  async redo(resumeId: string, userId: string): Promise<EditNavResult> {
    const sql = this.getSql();
    // The redo target is current's child on the path to tip (walk up from tip).
    const [next] = await sql`
      WITH RECURSIVE up AS (
        SELECT v.id, v.parent_version_id FROM resume_edit_cursor c JOIN resume_versions v ON v.id = c.tip_version_id
          WHERE c.resume_id = ${resumeId} AND c.user_id = ${userId}
        UNION ALL
        SELECT v.id, v.parent_version_id FROM resume_versions v JOIN up ON v.id = up.parent_version_id
      )
      SELECT up.id FROM up
      JOIN resume_edit_cursor c ON c.resume_id = ${resumeId} AND c.user_id = ${userId}
      WHERE up.parent_version_id = c.current_version_id
      LIMIT 1
    `;
    if (next) {
      await sql`UPDATE resume_edit_cursor SET current_version_id = ${next["id"] as string}, updated_at = now() WHERE resume_id = ${resumeId} AND user_id = ${userId}`;
    }
    return this.currentVersion(resumeId, userId);
  }

  // ----- helpers ----------------------------------------------------------
  private async profileText(userId: string): Promise<string> {
    const [p] = await this.getSql()`SELECT parsed_text FROM candidate_profiles WHERE user_id = ${userId} LIMIT 1`;
    return ((p?.["parsed_text"] as string | null) ?? "").trim();
  }

  /** A gateway-backed grounding judge when keys exist; undefined (heuristic-only) in dev. */
  private judge(userId: string, key: string): GroundingJudge | undefined {
    if (!hasLlmKeys()) return undefined;
    return async (generated, profile) => {
      const resp = await apiGateway().complete({
        task: "resume.edit_scan", taskTier: "utility", accountId: userId, idempotencyKey: `edit-scan-${key}`,
        jsonMode: true, maxTokens: 600,
        messages: [
          { role: "system", content: `Verify the edited résumé introduces NO company/role/title/date/metric absent from the profile. Reply ONLY JSON {"clean":true|false,"ungrounded":["..."]}.` },
          { role: "user", content: `## Profile:\n${profile.slice(0, 8000)}\n\n## Edited:\n${generated.slice(0, 8000)}` },
        ],
      });
      const j = JSON.parse(resp.content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "")) as { clean?: boolean; ungrounded?: string[] };
      return { clean: j.clean === true, ungrounded: (j.ungrounded ?? []).map(String) };
    };
  }

  private async generate(mode: Exclude<EditMode, "auto">, before: string, instruction: string, section: string | undefined, profileText: string, userId: string, key: string): Promise<string> {
    if (!hasLlmKeys()) {
      // Dev mock: grounded, deterministic transforms only (never introduces new facts).
      if (mode === "rebuild_section") return rebuildSection(before, section ?? "");
      if (mode === "full_rebuild") return tighten(before);
      return tighten(before); // quick_tweak
    }
    const system = `You edit a résumé. Mode: ${mode}.${section ? ` Section: ${section}.` : ""}
Use ONLY facts present in the candidate profile. NEVER invent a company, role, title, date, or metric.
${mode === "rebuild_section" ? "Rebuild ONLY the named section; leave every other section byte-identical." : ""}
${mode === "quick_tweak" ? "Make the smallest change that satisfies the instruction." : ""}
Return ONLY the full updated résumé text.`;
    const resp = await apiGateway().complete({
      task: "resume.edit", taskTier: mode === "quick_tweak" ? "mid" : "frontier",
      accountId: userId, idempotencyKey: `edit-${key}`, maxTokens: 2500, temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: `## Profile (ground truth):\n${profileText.slice(0, 8000)}\n\n## Current résumé:\n${before.slice(0, 10000)}\n\n## Instruction:\n${instruction}` },
      ],
    });
    return resp.content;
  }

  private err(status: number, code: string, message: string, retryable: boolean): HttpException {
    return new HttpException({ code, message, retryable }, status);
  }
}

// --- pure helpers (exported for unit tests) --------------------------------

/** FR-004.9 — does the instruction ask to invent experience absent from the profile? */
export function requestsFabrication(instruction: string, profileText: string): boolean {
  const lower = instruction.toLowerCase();
  if (/\b(invent|fabricate|fabricated|make up|made up|made-up|pretend|falsify|fake)\b/.test(lower)) return true;
  if (/\bnever\s+(had|held|worked|did|done)\b/.test(lower)) return true;
  const adds = /\b(add|include|insert|put|give me|append|create)\b/.test(lower) &&
               /\b(job|role|position|title|experience|stint|gig|employer|company|degree|certification)\b/.test(lower);
  if (adds) {
    const profLower = profileText.toLowerCase();
    const introduced = companyTokens(instruction).filter((c) => !profLower.includes(c.toLowerCase()));
    if (introduced.length > 0) return true;
  }
  return false;
}

/** AC-004.1.5 — a purely vague instruction should ask to clarify, not guess destructively. */
export function isUnclear(instruction: string): boolean {
  const t = instruction.trim().toLowerCase().replace(/[.!?]+$/g, "");
  const vague = new Set(["make it better", "improve it", "fix it", "do better", "make it good", "better", "help", "improve", "fix", "make it nicer", "polish it"]);
  return vague.has(t);
}

export function classifyMode(instruction: string, requested: EditMode, section?: string): Exclude<EditMode, "auto"> {
  if (requested !== "auto") return requested;
  const lower = instruction.toLowerCase();
  if (/\b(from scratch|start over|whole|entire|everything|full rebuild|rebuild the (whole|entire))\b/.test(lower)) return "full_rebuild";
  if (section || /\b(rebuild|rewrite|redo|regenerate)\b.*\b(section|summary|experience|education|skills|projects)\b/.test(lower)) return "rebuild_section";
  return "quick_tweak";
}

/** Grounded "tighten" — removes filler only; introduces no new facts. */
export function tighten(text: string): string {
  return text
    .replace(/\bin order to\b/gi, "to")
    .replace(/\b(very|really|quite|basically|actually)\s+/gi, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ");
}

/** Rebuild only the named "## SECTION" block; all other sections stay byte-identical (NFR-004.2). */
export function rebuildSection(content: string, section: string): string {
  const target = section.trim().toLowerCase();
  const lines = content.split("\n");
  const out: string[] = [];
  let inTarget = false;
  for (const line of lines) {
    const header = /^##\s+(.+)$/.exec(line);
    if (header) {
      inTarget = (header[1] ?? "").trim().toLowerCase() === target;
      out.push(line);
      continue;
    }
    out.push(inTarget ? tighten(line) : line);
  }
  return out.join("\n");
}

export function computeDiff(before: string, after: string): EditDiff {
  const b = before.split("\n");
  const a = after.split("\n");
  const bSet = new Set(b);
  const aSet = new Set(a);
  const removed = b.filter((l) => !aSet.has(l) && l.trim() !== "");
  const added = a.filter((l) => !bSet.has(l) && l.trim() !== "");
  const changed: Array<{ before: string; after: string }> = [];
  const n = Math.min(removed.length, added.length);
  for (let i = 0; i < n; i++) changed.push({ before: removed[i] as string, after: added[i] as string });
  return { added: added.slice(n), removed: removed.slice(n), changed };
}

function buildChangeNote(mode: Exclude<EditMode, "auto">, diff: EditDiff, section?: string): string {
  const touched = diff.added.length + diff.removed.length + diff.changed.length;
  const what =
    mode === "rebuild_section" ? `Rebuilt the ${section ?? ""} section`.trim() :
    mode === "full_rebuild" ? "Rebuilt the résumé" :
    "Tightened the wording";
  return `${what} — ${touched} line${touched === 1 ? "" : "s"} changed. Nothing was added that isn't already in your profile.`;
}
