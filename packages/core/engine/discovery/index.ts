/**
 * F-058 — Discovery orchestrator. Runs adapters in parallel, dedups, persists.
 * F-059 legitimacy scoring is applied by the worker after discovery.
 */

import postgres from "postgres";
import { FirecrawlAdapter } from "./firecrawl.adapter.js";
import { FetchAdapter } from "./fetch.adapter.js";
import type { JobDiscoveryAdapter, DiscoveryQuery, DiscoveredJob } from "./types.js";

export type { JobDiscoveryAdapter, DiscoveryQuery, DiscoveredJob } from "./types.js";

const ADAPTERS: Record<string, () => JobDiscoveryAdapter> = {
  firecrawl: () => new FirecrawlAdapter(),
  fetch: () => new FetchAdapter(),
};

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

/** Run the named adapters in parallel; dedup by externalId + company. */
export async function runDiscovery(adapterNames: string[], query: DiscoveryQuery): Promise<DiscoveredJob[]> {
  const adapters = adapterNames
    .map((n) => ADAPTERS[n]?.())
    .filter((a): a is JobDiscoveryAdapter => !!a);

  const settled = await Promise.allSettled(adapters.map((a) => a.discover(query)));
  const all: DiscoveredJob[] = [];
  for (const r of settled) {
    if (r.status === "fulfilled") all.push(...r.value);
  }

  // Dedup by externalId + company domain.
  const seen = new Set<string>();
  const deduped: DiscoveredJob[] = [];
  for (const job of all) {
    const key = `${job.externalId}:${job.company.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(job);
  }
  return deduped;
}

/** Idempotent persist into discovered_jobs (skip existing externalId+adapter). */
export async function persistDiscoveredJobs(jobs: DiscoveredJob[]): Promise<{ inserted: number }> {
  const sql = getSql();
  let inserted = 0;
  for (const j of jobs) {
    const rows = await sql`
      INSERT INTO discovered_jobs
        (source_adapter, external_id, company_name, title, location, jd_text, jd_url,
         legitimacy_tier, legitimacy_score, last_seen_at)
      VALUES
        (${j.sourceAdapter}, ${j.externalId}, ${j.company}, ${j.title}, ${j.location},
         ${j.jdText}, ${j.jdUrl}, ${j.legitimacyTier ?? "unknown"}, ${j.legitimacyScore ?? null}, NOW())
      ON CONFLICT (source_adapter, external_id) DO UPDATE SET last_seen_at = NOW()
      RETURNING (xmax = 0) AS inserted
    `;
    if (rows[0]?.["inserted"]) inserted += 1;
  }
  return { inserted };
}
