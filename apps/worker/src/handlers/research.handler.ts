/**
 * q.research — Persona deep research, freshness, credit assignment, job discovery.
 *
 * Job types:
 *   persona.synthesize   → F-052 deep research + AI synthesis → upsertPersona
 *   persona.refresh      → F-054 freshness check (news), re-synthesize if stale
 *   persona.evolve       → F-051 persona evolution after offer/hire
 *   loop.credit_assign   → F-051 credit assignment
 *   jobs.discover        → F-058 multi-source discovery + F-059 legitimacy scoring
 */

import { Worker, type Job } from "bullmq";
import { QUEUE_NAMES, getRedisConnection } from "../queues.js";
import { gateway, SYSTEM_ACCOUNT_ID } from "../gateway.js";
import {
  assignCredit, upsertPersona, getPersona, listStalePersonas, decayFreshness,
  runDiscovery, persistDiscoveredJobs, scoreJobLegitimacy, defaultUrlReachable,
  type SynthesisResult, type DiscoveredJob,
} from "@trajct/core/engine";

export interface PersonaSynthesizeJobData {
  type: "persona.synthesize";
  companyId: string; companyName: string; companyDomain?: string;
  forceRefresh: boolean; idempotencyKey: string;
}
export interface PersonaRefreshJobData { type: "persona.refresh"; companyId?: string; idempotencyKey: string; }
export interface PersonaEvolveJobData { type: "loop.persona_evolve"; companyId: string; reason: string; idempotencyKey: string; }
export interface CreditAssignJobData { type: "loop.credit_assign"; outcomeId: string; userId: string; artifactIds: string[]; idempotencyKey: string; }
export interface JobsDiscoverJobData {
  type: "jobs.discover"; monitorId?: string; adapters: string[];
  keywords: string[]; locations: string[]; companies?: string[]; idempotencyKey: string;
}

export type ResearchJobData =
  | PersonaSynthesizeJobData | PersonaRefreshJobData | PersonaEvolveJobData
  | CreditAssignJobData | JobsDiscoverJobData;

export function createResearchWorker(): Worker<ResearchJobData> {
  const connection = getRedisConnection();
  return new Worker<ResearchJobData>(
    QUEUE_NAMES.RESEARCH,
    async (job: Job<ResearchJobData>) => {
      const { type } = job.data;
      console.log(`[research] Job ${job.id} type=${type}`);
      switch (type) {
        case "persona.synthesize":   return handlePersonaSynthesize(job.data);
        case "persona.refresh":      return handlePersonaRefresh(job.data);
        case "loop.persona_evolve":  return handlePersonaEvolve(job.data);
        case "loop.credit_assign":   return handleCreditAssign(job.data);
        case "jobs.discover":        return handleJobsDiscover(job.data);
        default: throw new Error(`Unknown research job type`);
      }
    },
    { connection, concurrency: 2 }
  );
}

// --- F-052 persona synthesis ----------------------------------------------

const SYNTH_SYSTEM = `You are a hiring-intelligence analyst. From the research provided about a company,
synthesize a hiring persona. Reply ONLY with strict JSON (no prose):
{
  "hiring_signals": [<string>, ...],
  "culture_indicators": [<string>, ...],
  "success_patterns": [<string>, ...],
  "rejection_patterns": [<string>, ...],
  "ats_keyword_bank": { "required": [<string>], "boost": [<string>], "banned": [<string>] },
  "quality": "high" | "medium" | "low"
}`;

async function handlePersonaSynthesize(data: PersonaSynthesizeJobData): Promise<void> {
  console.log(`[research:persona] Synthesize ${data.companyName} (${data.companyId})`);

  // Step 1-3: best-effort web research (degrades gracefully without API keys).
  const research = await gatherResearch(data.companyName, data.companyDomain);

  // Step 4: synthesis via Gateway (frontier tier; model resolves from env).
  let result: SynthesisResult;
  try {
    const resp = await gateway().complete({
      task: "engine.persona_synth",
      taskTier: "frontier",
      accountId: SYSTEM_ACCOUNT_ID,
      idempotencyKey: `persona-synth:${data.companyId}:${data.idempotencyKey}`,
      jsonMode: true,
      maxTokens: 2000,
      messages: [
        { role: "system", content: SYNTH_SYSTEM },
        { role: "user", content: `Company: ${data.companyName}\n\nResearch:\n${research.text.slice(0, 12000)}` },
      ],
    });
    result = parseSynthesis(resp.content, research.evidenceRefs);
  } catch (err) {
    console.error(`[research:persona] synthesis failed, storing low-quality stub:`, err instanceof Error ? err.message : err);
    result = {
      hiringSignals: [], cultureIndicators: [], successPatterns: [], rejectionPatterns: [],
      atsKeywordBank: { required: [], boost: [], banned: [] },
      evidenceRefs: research.evidenceRefs, quality: "low",
    };
  }

  // Step 6: upsert (snapshots prior version, bumps version, freshness=1.0).
  await upsertPersona(data.companyId, result, data.companyName);
  console.log(`[research:persona] ${data.companyName} synthesized (quality=${result.quality})`);
}

interface ResearchBundle { text: string; evidenceRefs: string[]; }

async function gatherResearch(companyName: string, domain?: string): Promise<ResearchBundle> {
  const urls: string[] = [];
  if (domain) {
    const base = domain.startsWith("http") ? domain : `https://${domain}`;
    urls.push(base, `${base}/careers`, `${base}/about`);
  }
  const texts: string[] = [];
  const evidenceRefs: string[] = [];
  await Promise.all(urls.map(async (url) => {
    try {
      const resp = await fetch(url, { headers: { "User-Agent": "Trajct/1.0 Persona-Research" }, signal: AbortSignal.timeout(8000) });
      if (resp.ok) {
        const html = await resp.text();
        texts.push(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 6000));
        evidenceRefs.push(url);
      }
    } catch { /* best-effort */ }
  }));
  if (texts.length === 0) texts.push(`Company name: ${companyName}. No public research available.`);
  return { text: texts.join("\n\n"), evidenceRefs };
}

function parseSynthesis(raw: string, evidenceRefs: string[]): SynthesisResult {
  try {
    const j = JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "")) as Record<string, unknown>;
    const bank = (j["ats_keyword_bank"] as Record<string, string[]> | undefined) ?? {};
    return {
      hiringSignals: (j["hiring_signals"] as string[]) ?? [],
      cultureIndicators: (j["culture_indicators"] as string[]) ?? [],
      successPatterns: (j["success_patterns"] as string[]) ?? [],
      rejectionPatterns: (j["rejection_patterns"] as string[]) ?? [],
      atsKeywordBank: { required: bank["required"] ?? [], boost: bank["boost"] ?? [], banned: bank["banned"] ?? [] },
      evidenceRefs,
      quality: (["high", "medium", "low"].includes(String(j["quality"])) ? j["quality"] : "medium") as SynthesisResult["quality"],
    };
  } catch {
    return { hiringSignals: [], cultureIndicators: [], successPatterns: [], rejectionPatterns: [], atsKeywordBank: { required: [], boost: [], banned: [] }, evidenceRefs, quality: "low" };
  }
}

// --- F-054 freshness ------------------------------------------------------

async function handlePersonaRefresh(data: PersonaRefreshJobData): Promise<void> {
  const stale = data.companyId
    ? [{ companyId: data.companyId, companyName: "" }]
    : await listStalePersonas(20);

  for (const { companyId } of stale) {
    // Minor decay heuristic: drop freshness so the next read re-synthesizes if needed.
    // A full news-signal check would run here when PERPLEXITY_API_KEY is configured.
    const persona = await getPersona({ companyId, requestingUserId: "system" });
    const newScore = Math.max(0, (persona?.freshnessScore ?? 0.5) - 0.2);
    await decayFreshness(companyId, newScore);
    console.log(`[research:refresh] ${companyId} freshness → ${newScore.toFixed(2)}`);
  }
}

async function handlePersonaEvolve(data: PersonaEvolveJobData): Promise<void> {
  // Evolution re-runs synthesis with accumulated outcome credit as additional context.
  console.log(`[research:evolve] ${data.companyId} (${data.reason})`);
  const persona = await getPersona({ companyId: data.companyId, requestingUserId: "system" });
  if (persona) {
    await decayFreshness(data.companyId, 0.0); // force re-synthesis on next read
  }
}

// --- F-051 credit assignment ----------------------------------------------

async function handleCreditAssign(data: CreditAssignJobData): Promise<void> {
  const result = await assignCredit(data.outcomeId);
  console.log(`[research:credit] outcome ${data.outcomeId}: ${result.knowledgeUpdated} knowledge refs, delta=${result.delta}, evolve=${result.triggeredPersonaEvolve}`);
}

// --- F-058 discovery + F-059 legitimacy -----------------------------------

async function handleJobsDiscover(data: JobsDiscoverJobData): Promise<void> {
  const jobs = await runDiscovery(data.adapters, {
    keywords: data.keywords,
    locations: data.locations,
    ...(data.companies ? { companies: data.companies } : {}),
    limit: 20,
  });

  const nowMs = Date.now();
  const scored: DiscoveredJob[] = await Promise.all(jobs.map(async (job) => {
    const legit = await scoreJobLegitimacy(
      { title: job.title, company: job.company, jdUrl: job.jdUrl, postedAt: job.postedAt },
      {
        nowMs,
        urlReachable: defaultUrlReachable,
        repostCount: async () => 0, // TODO: COUNT discovered_jobs same title+company in 90d
        // newsSignal omitted → PERPLEXITY weight redistributed
      }
    );
    return { ...job, legitimacyScore: legit.score, legitimacyTier: legit.tier };
  }));

  const { inserted } = await persistDiscoveredJobs(scored);
  console.log(`[research:discover] ${data.adapters.join(",")} → ${scored.length} jobs, ${inserted} new`);
}
