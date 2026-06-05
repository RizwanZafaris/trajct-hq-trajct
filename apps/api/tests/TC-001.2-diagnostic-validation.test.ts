/**
 * TC-001.2 — Diagnostic input validation (FRD §4.1.5 business rules).
 * These checks run BEFORE any I/O, so they need no Redis/DB.
 *
 * - missing résumé + missing target → MISSING_INPUT
 * - <150 words → RESUME_TOO_SHORT
 * - ≥150 words but not a résumé (no sections) → NOT_A_RESUME
 * - oversized file → FILE_TOO_LARGE
 *
 * Covers: F-001 BR-001.1/.3, AC-001.1.5/.6
 */

import { describe, it, expect } from "vitest";
import { DiagnosticService } from "../src/diagnostic/diagnostic.service.js";

const svc = new DiagnosticService();

async function code(fn: () => Promise<unknown>): Promise<string> {
  try { await fn(); return "NO_ERROR"; }
  catch (e) {
    const r = (e as { response?: { code?: string } }).response ?? (e as { code?: string });
    return (r as { code?: string }).code ?? "UNKNOWN";
  }
}

const RESUME = `John Doe
john@example.com | linkedin.com/in/johndoe
Experience: Senior Product Manager at Acme leading a team. Worked on payments.
Education: BS Computer Science, State University.
Skills: SQL, Python, product strategy, roadmapping, stakeholder management.
` + "additional relevant experience detail. ".repeat(40);

describe("TC-001.2 diagnostic validation", () => {
  it("missing résumé and target → MISSING_INPUT", async () => {
    expect(await code(() => svc.diagnose({ target: "" }, null))).toBe("MISSING_INPUT");
  });

  it("résumé present but no target → MISSING_INPUT", async () => {
    expect(await code(() => svc.diagnose({ resumeText: RESUME, target: "" }, null))).toBe("MISSING_INPUT");
  });

  it("<150 words → RESUME_TOO_SHORT", async () => {
    expect(await code(() => svc.diagnose({ resumeText: "too short resume", target: "Senior PM" }, null))).toBe("RESUME_TOO_SHORT");
  });

  it("≥150 words but no résumé sections → NOT_A_RESUME", async () => {
    const blob = "lorem ipsum dolor sit amet ".repeat(40); // 200 words, no sections
    expect(await code(() => svc.diagnose({ resumeText: blob, target: "Senior PM" }, null))).toBe("NOT_A_RESUME");
  });

  it("oversized file → FILE_TOO_LARGE", async () => {
    const big = Buffer.alloc(5 * 1024 * 1024 + 1);
    expect(await code(() => svc.diagnose({ resumeBuffer: big, resumeMime: "text/plain", resumeFileName: "r.txt", target: "PM" }, null))).toBe("FILE_TOO_LARGE");
  });
});
