/**
 * TC-005 (pure) — JD extraction, job-detection, grounded never-blank scoring.
 * No DB / no network. Covers FR-005.5, NFR-005.2/.3, BR-005.1.
 */

import { describe, it, expect } from "vitest";
import { stripHtml, looksLikeJob, scoreDimensions, parseHeadline } from "../src/candidate/rate/rate.service.js";
import { RATE_DIMENSIONS } from "@trajct/contracts";

const PROFILE = "Senior Engineer at Globex. Built payment systems at Globex; led the platform team. Skills: TypeScript, Postgres, Kubernetes. 5 years experience.";

const JOB = [
  "Senior Engineer at Stripe",
  "Responsibilities: lead the platform team and build payment systems.",
  "Requirements: 5 years of experience with TypeScript and Postgres.",
  "We are hiring. Apply now. Benefits included.",
].join("\n");

const NEWS = "Breaking: the city council voted this morning on a new park budget. Residents gathered downtown to celebrate the announcement.";

describe("TC-005 stripHtml", () => {
  it("strips tags + decodes basic entities", () => {
    expect(stripHtml("<p>Hello&nbsp;<b>world</b></p>")).toBe("Hello world");
    expect(stripHtml("<script>evil()</script>Job: Engineer")).toBe("Job: Engineer");
  });
});

describe("TC-005 looksLikeJob (FR-005.5, BR-005.1)", () => {
  it("accepts a job posting", () => {
    expect(looksLikeJob(JOB)).toBe(true);
  });
  it("rejects a news article (TC-005.3)", () => {
    expect(looksLikeJob(NEWS)).toBe(false);
  });
});

describe("TC-005 scoreDimensions (NFR-005.2/.3 — grounded, never blank)", () => {
  it("returns all 6 dimensions, each scored with a non-empty explanation", () => {
    const dims = scoreDimensions(JOB, PROFILE);
    expect(dims).toHaveLength(6);
    expect(dims.map((d) => d.name)).toEqual([...RATE_DIMENSIONS]);
    for (const d of dims) {
      expect(d.score).toBeGreaterThanOrEqual(0);
      expect(d.score).toBeLessThanOrEqual(100);
      expect(d.explanation.trim().length).toBeGreaterThan(0);   // never blank
    }
  });
  it("a real job with strong overlap never scores zero overall", () => {
    const dims = scoreDimensions(JOB, PROFILE);
    const overall = Math.round(dims.reduce((s, d) => s + d.score, 0) / dims.length);
    expect(overall).toBeGreaterThan(0);                          // NFR-005.3
  });
});

describe("TC-005 parseHeadline", () => {
  it("pulls role + company from the JD head", () => {
    const { company, role } = parseHeadline(JOB);
    expect(role).toBe("Senior Engineer");
    expect(company).toBe("Stripe");
  });
});
