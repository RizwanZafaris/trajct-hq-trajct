/**
 * TC-004 (pure) — classification, fabrication-intent, clarity, grounded transforms, diff.
 * No DB / no LLM. Covers FR-004.1/.9, BR-004.2, AC-004.1.3/.5, NFR-004.2.
 */

import { describe, it, expect } from "vitest";
import {
  classifyMode, requestsFabrication, isUnclear, tighten, rebuildSection, computeDiff,
} from "../src/candidate/resume/edit.service.js";

const PROFILE = "Senior Engineer at Globex. Built payment systems at Globex; led the platform team. Skills: TypeScript, Postgres.";

describe("TC-004 classifyMode (FR-004.1)", () => {
  it("honours an explicit mode", () => {
    expect(classifyMode("anything", "full_rebuild")).toBe("full_rebuild");
  });
  it("auto → quick_tweak for a surgical instruction", () => {
    expect(classifyMode("tighten bullet 2 in my current role", "auto")).toBe("quick_tweak");
  });
  it("auto → rebuild_section when a section is named", () => {
    expect(classifyMode("rebuild my experience section", "auto")).toBe("rebuild_section");
  });
  it("auto → full_rebuild for a from-scratch instruction", () => {
    expect(classifyMode("rewrite the whole thing from scratch", "auto")).toBe("full_rebuild");
  });
});

describe("TC-004 requestsFabrication (FR-004.9, AC-004.1.3)", () => {
  it("refuses adding a role at a company not in the profile", () => {
    expect(requestsFabrication("add a Director role at Meta I never held", PROFILE)).toBe(true);
  });
  it("refuses explicit invention", () => {
    expect(requestsFabrication("invent a 5-year stint at Google", PROFILE)).toBe(true);
  });
  it("allows a grounded edit", () => {
    expect(requestsFabrication("tighten my Globex bullets", PROFILE)).toBe(false);
    expect(requestsFabrication("rebuild my experience section", PROFILE)).toBe(false);
  });
});

describe("TC-004 isUnclear (AC-004.1.5)", () => {
  it("flags a purely vague instruction", () => {
    expect(isUnclear("make it better")).toBe(true);
    expect(isUnclear("Improve it.")).toBe(true);
  });
  it("accepts an actionable instruction", () => {
    expect(isUnclear("shorten the summary to two lines")).toBe(false);
  });
});

describe("TC-004 grounded transforms + diff (NFR-004.2)", () => {
  const SEED = [
    "## SUMMARY",
    "Senior Engineer very experienced in payment systems at Globex.",
    "",
    "## EXPERIENCE",
    "Senior Engineer at Globex. Responsible in order to lead the platform team.",
    "",
    "## SKILLS",
    "TypeScript, Postgres",
  ].join("\n");

  it("rebuild_section leaves other sections byte-identical", () => {
    const out = rebuildSection(SEED, "EXPERIENCE");
    // EXPERIENCE changed…
    expect(out).toContain("Responsible to lead the platform team.");
    expect(out).not.toContain("in order to");
    // …SUMMARY + SKILLS untouched (byte-identical, filler preserved).
    expect(out).toContain("Senior Engineer very experienced in payment systems at Globex.");
    expect(out).toContain("## SKILLS\nTypeScript, Postgres");
  });

  it("tighten introduces no new facts (companies preserved, filler removed)", () => {
    const out = tighten("Built payment systems very efficiently at Globex.");
    expect(out).toBe("Built payment systems efficiently at Globex.");
  });

  it("computeDiff reports changed spans", () => {
    const d = computeDiff("Responsible in order to lead.", "Responsible to lead.");
    expect(d.changed.length + d.added.length + d.removed.length).toBeGreaterThan(0);
  });
});
