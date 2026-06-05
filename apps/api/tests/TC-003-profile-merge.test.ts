/**
 * TC-003.2 / .4 / .6 — Profile merge pure logic.
 *
 * .2  de-dup: two docs with the same role → one merged role (bullets unioned)
 * .4  conflict: two docs, different end-dates for one role → conflict surfaced, NOT auto-resolved
 * .6  recommendations: profile lacking metrics → "Add quantified achievements" recommendation
 * + skill normalization (JS→JavaScript) and union.
 *
 * Covers: F-003 FR-003.3, FR-003.7, FR-003.5
 */

import { describe, it, expect } from "vitest";
import {
  mergeExperience, mergeSkills, generateRecommendations, normalizeSkill, type ExtractedDoc,
} from "../src/candidate/profile/profile-merge.js";

const doc = (over: Partial<ExtractedDoc>): ExtractedDoc => ({ experience: [], skills: [], keywords: [], education: [], ...over });

describe("TC-003 profile merge", () => {
  it(".2 de-dups overlapping roles across two docs (bullets unioned)", () => {
    const a = doc({ experience: [{ role: "Senior PM", company: "Acme Inc", start: "2020-01", end: "2022-01", bullets: ["Led payments"] }] });
    const b = doc({ experience: [{ role: "Senior PM", company: "Acme", start: "2020-01", end: "2022-01", bullets: ["Grew revenue"] }] });
    const { experience, conflicts } = mergeExperience([a, b]);
    expect(experience.length).toBe(1);                       // one de-duplicated role
    expect(experience[0]!.bullets.sort()).toEqual(["Grew revenue", "Led payments"]);
    expect(conflicts.length).toBe(0);
  });

  it(".4 surfaces a conflict on differing end-dates (never auto-resolves)", () => {
    const a = doc({ experience: [{ role: "Engineer", company: "Globex", start: "2019-06", end: "2021-06", bullets: [] }] });
    const b = doc({ experience: [{ role: "Engineer", company: "Globex", start: "2019-06", end: "2021-12", bullets: [] }] });
    const { conflicts } = mergeExperience([a, b]);
    expect(conflicts.length).toBe(1);
    expect(conflicts[0]!.field).toBe("end_date");
    expect(conflicts[0]!.values.sort()).toEqual(["2021-06", "2021-12"]);
  });

  it(".6 recommends quantification when bullets lack metrics", () => {
    const exp = [{ role: "PM", company: "Acme", start: "2020", end: null, bullets: ["Managed the roadmap", "Worked with teams"] }];
    const recs = generateRecommendations(exp, ["JavaScript", "Python", "SQL", "React", "Node.js"], true);
    expect(recs.some((r) => /quantified|metrics/i.test(r))).toBe(true);
  });

  it(".6 recommends a summary + more skills when sparse", () => {
    const recs = generateRecommendations([], ["SQL"], false);
    expect(recs.some((r) => /summary/i.test(r))).toBe(true);
    expect(recs.some((r) => /skills/i.test(r))).toBe(true);
  });

  it("normalizes + unions skills across docs (JS→JavaScript)", () => {
    expect(normalizeSkill("js")).toBe("JavaScript");
    const merged = mergeSkills([doc({ skills: ["js", "Python"] }), doc({ skills: ["JavaScript", "py"] })]);
    expect(merged).toContain("JavaScript");
    expect(merged).toContain("Python");
    expect(merged.filter((s) => s === "JavaScript").length).toBe(1); // unioned, not duplicated
  });
});
