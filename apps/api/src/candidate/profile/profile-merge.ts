/**
 * F-003 — Pure profile merge/dedup/conflict/recommendation logic (no I/O, no LLM).
 * FR-003.3 de-dup; FR-003.7 conflict surfacing (never auto-resolve); FR-003.5 heuristic recs.
 */

import type { ExperienceItem, EducationItem, ProfileConflict } from "@trajct/contracts";

export interface ExtractedDoc {
  experience: ExperienceItem[];
  skills: string[];
  keywords: string[];
  education: EducationItem[];
}

const SKILL_SYNONYMS: Record<string, string> = {
  js: "JavaScript", javascript: "JavaScript",
  ts: "TypeScript", typescript: "TypeScript",
  py: "Python", python: "Python",
  "node": "Node.js", "nodejs": "Node.js", "node.js": "Node.js",
  "postgres": "PostgreSQL", "postgresql": "PostgreSQL",
  "k8s": "Kubernetes", "kubernetes": "Kubernetes",
  "ml": "Machine Learning", "ai": "Artificial Intelligence",
  "pm": "Product Management", "product management": "Product Management",
};

export function normalizeCompany(s: string): string {
  return s.toLowerCase().replace(/\b(inc|llc|ltd|corp|co|gmbh|plc)\b\.?/g, "").replace(/[^a-z0-9]/g, "").trim();
}
export function normalizeRole(s: string): string {
  return s.toLowerCase().replace(/\b(sr|senior)\b/g, "senior").replace(/\b(jr|junior)\b/g, "junior").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}
export function normalizeSkill(s: string): string {
  const key = s.toLowerCase().trim();
  return SKILL_SYNONYMS[key] ?? s.trim();
}

function expKey(e: ExperienceItem): string {
  return `${normalizeCompany(e.company)}|${normalizeRole(e.role)}|${e.start ?? ""}`;
}

/**
 * Merge experiences across docs, de-duplicating on (normalized company, role, start).
 * Bullets are unioned. Returns merged experience + any cross-doc conflicts (e.g. differing end-dates).
 */
export function mergeExperience(docs: ExtractedDoc[]): { experience: ExperienceItem[]; conflicts: ProfileConflict[] } {
  const byKey = new Map<string, ExperienceItem>();
  const endValues = new Map<string, Set<string>>(); // key → set of distinct non-null end values
  const conflicts: ProfileConflict[] = [];

  for (const doc of docs) {
    for (const e of doc.experience) {
      const key = expKey(e);
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, { ...e, bullets: [...new Set(e.bullets)] });
      } else {
        existing.bullets = [...new Set([...existing.bullets, ...e.bullets])];
        // Prefer a non-null end if the existing one is null (most recent source wins on present-status).
        if (!existing.end && e.end) existing.end = e.end;
      }
      if (e.end) {
        const set = endValues.get(key) ?? new Set<string>();
        set.add(e.end);
        endValues.set(key, set);
      }
    }
  }

  // FR-003.7: differing end-dates for one role → conflict (surface, do NOT auto-pick).
  for (const [key, ends] of endValues) {
    if (ends.size > 1) {
      const item = byKey.get(key)!;
      conflicts.push({ field: "end_date", role: item.role, company: item.company, values: [...ends] });
    }
  }

  // Sort experience by start desc (most recent first); nulls (present) handled via end.
  const experience = [...byKey.values()].sort((a, b) => (b.start ?? "").localeCompare(a.start ?? ""));
  return { experience, conflicts };
}

export function mergeSkills(docs: ExtractedDoc[]): string[] {
  const set = new Map<string, string>(); // normalizedLower → display
  for (const doc of docs) {
    for (const s of doc.skills) {
      const norm = normalizeSkill(s);
      set.set(norm.toLowerCase(), norm);
    }
  }
  return [...set.values()].sort();
}

export function mergeKeywords(docs: ExtractedDoc[]): string[] {
  return [...new Set(docs.flatMap((d) => d.keywords).map((k) => k.trim()).filter(Boolean))].slice(0, 50);
}

export function mergeEducation(docs: ExtractedDoc[]): EducationItem[] {
  const seen = new Set<string>();
  const out: EducationItem[] = [];
  for (const doc of docs) {
    for (const e of doc.education) {
      const key = `${e.degree.toLowerCase()}|${e.institution.toLowerCase()}`;
      if (!seen.has(key)) { seen.add(key); out.push(e); }
    }
  }
  return out;
}

/** Heuristic-first recommendations (FR-003.5 — avoid LLM cost). */
export function generateRecommendations(experience: ExperienceItem[], skills: string[], summaryPresent: boolean): string[] {
  const recs: string[] = [];

  // Roles with bullets that lack any quantification.
  const metricRe = /\d|\bpercent\b|%|\$|x\b/i;
  const rolesNoMetrics = experience.filter((e) => e.bullets.length > 0 && !e.bullets.some((b) => metricRe.test(b)));
  if (rolesNoMetrics.length > 0) {
    recs.push(`Add quantified achievements (%, $, team size) to your top ${Math.min(3, rolesNoMetrics.length)} roles.`);
  }
  if (!summaryPresent) recs.push("Add a 2–3 line professional summary at the top.");
  if (skills.length < 5) recs.push("Expand your skills list — aim for at least 5 relevant skills.");

  // Experience gap > 12 months between consecutive roles.
  const dated = experience.filter((e) => e.start).sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""));
  for (let i = 1; i < dated.length; i++) {
    const prevEnd = dated[i - 1]!.end;
    const nextStart = dated[i]!.start;
    if (prevEnd && nextStart && monthsBetween(prevEnd, nextStart) > 12) {
      recs.push(`Consider addressing the employment gap between ${prevEnd} and ${nextStart}.`);
      break;
    }
  }
  return recs;
}

function monthsBetween(a: string, b: string): number {
  const pa = a.split("-").map(Number);
  const pb = b.split("-").map(Number);
  const ma = (pa[0] ?? 0) * 12 + ((pa[1] ?? 1) - 1);
  const mb = (pb[0] ?? 0) * 12 + ((pb[1] ?? 1) - 1);
  return Math.abs(mb - ma);
}
