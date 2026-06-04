/**
 * F-053 — Company enrichment layer (Apollo).
 * Port of jobHunt/agents/apollo_enrich.py (key-gated).
 *
 * INTERNAL — not exported to employer side (firmographic signals feed matching/persona,
 * but are not part of CandidatePublicProjection).
 *
 * If APOLLO_API_KEY is absent → returns null (NOT an error). Enrichment is optional signal.
 */

import postgres from "postgres";

export interface CompanyEnrichmentResult {
  companyId: string;
  employeeCount?: number | undefined;
  fundingStage?: string | undefined;
  techStack: string[];
  openRoles?: number | undefined;
  lastEnrichedAt: string;
}

let _sql: ReturnType<typeof postgres> | null = null;
function getSql(): ReturnType<typeof postgres> {
  if (!_sql) {
    const url = process.env["DATABASE_URL"];
    if (!url) throw new Error("DATABASE_URL required");
    _sql = postgres(url, { max: 3 });
  }
  return _sql;
}
export function __setSql(sql: ReturnType<typeof postgres>): void {
  _sql = sql;
}

export function enrichmentAvailable(): boolean {
  return !!process.env["APOLLO_API_KEY"];
}

/**
 * Enrich a company via Apollo. Returns null if APOLLO_API_KEY is absent (optional signal).
 * Caches the result in company_enrichment.
 */
export async function enrichCompany(companyId: string, domain?: string): Promise<CompanyEnrichmentResult | null> {
  if (!enrichmentAvailable()) {
    return null; // optional — absence is not an error
  }

  const apiKey = process.env["APOLLO_API_KEY"]!;
  try {
    const resp = await fetch("https://api.apollo.io/v1/organizations/enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
      body: JSON.stringify({ domain: domain ?? "" }),
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) return null;

    const data = (await resp.json()) as { organization?: Record<string, unknown> };
    const org = data.organization ?? {};
    const result: CompanyEnrichmentResult = {
      companyId,
      employeeCount: (org["estimated_num_employees"] as number | undefined),
      fundingStage: (org["latest_funding_stage"] as string | undefined),
      techStack: (org["technology_names"] as string[] | undefined) ?? [],
      lastEnrichedAt: new Date().toISOString(),
    };
    await cache(result);
    return result;
  } catch {
    return null; // best-effort
  }
}

export async function getCachedEnrichment(companyId: string): Promise<CompanyEnrichmentResult | null> {
  const sql = getSql();
  const [row] = await sql`SELECT * FROM company_enrichment WHERE company_id = ${companyId} LIMIT 1`;
  if (!row) return null;
  return {
    companyId,
    employeeCount: (row["employee_count"] as number | null) ?? undefined,
    fundingStage: (row["funding_stage"] as string | null) ?? undefined,
    techStack: (row["tech_stack"] as string[]) ?? [],
    openRoles: (row["open_roles"] as number | null) ?? undefined,
    lastEnrichedAt: (row["last_enriched_at"] as Date).toISOString(),
  };
}

async function cache(r: CompanyEnrichmentResult): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO company_enrichment (company_id, employee_count, funding_stage, tech_stack, open_roles, last_enriched_at)
    VALUES (${r.companyId}, ${r.employeeCount ?? null}, ${r.fundingStage ?? null}, ${sql.array(r.techStack)}, ${r.openRoles ?? null}, NOW())
    ON CONFLICT (company_id) DO UPDATE SET
      employee_count = EXCLUDED.employee_count,
      funding_stage = EXCLUDED.funding_stage,
      tech_stack = EXCLUDED.tech_stack,
      open_roles = EXCLUDED.open_roles,
      last_enriched_at = NOW()
  `;
}
