/**
 * q.research — Persona deep research + job discovery (lowest priority, long-running).
 *
 * Job types:
 *   persona.synthesize   → F-052 deep research pipeline for a company persona
 *   persona.refresh      → F-054 freshness check + incremental update
 *   loop.credit_assign   → F-051 outcome-loop credit assignment
 *   jobs.discover        → F-058 multi-source job discovery run
 */

import { Worker, type Job } from "bullmq";
import { QUEUE_NAMES, getRedisConnection } from "../queues.js";

export interface PersonaSynthesizeJobData {
  type: "persona.synthesize";
  companyId: string;
  companyName: string;
  companyDomain?: string;
  forceRefresh: boolean;
  idempotencyKey: string;
}

export interface PersonaRefreshJobData {
  type: "persona.refresh";
  companyId: string;
  idempotencyKey: string;
}

export interface CreditAssignJobData {
  type: "loop.credit_assign";
  outcomeId: string;
  userId: string;
  artifactIds: string[];
  idempotencyKey: string;
}

export interface JobsDiscoverJobData {
  type: "jobs.discover";
  monitorId?: string;
  adapters: string[];
  keywords: string[];
  locations: string[];
  idempotencyKey: string;
}

export type ResearchJobData =
  | PersonaSynthesizeJobData
  | PersonaRefreshJobData
  | CreditAssignJobData
  | JobsDiscoverJobData;

export function createResearchWorker(): Worker<ResearchJobData> {
  const connection = getRedisConnection();

  return new Worker<ResearchJobData>(
    QUEUE_NAMES.RESEARCH,
    async (job: Job<ResearchJobData>) => {
      const { type } = job.data;
      console.log(`[research] Job ${job.id} type=${type}`);

      switch (type) {
        case "persona.synthesize":  return handlePersonaSynthesize(job.data);
        case "persona.refresh":     return handlePersonaRefresh(job.data);
        case "loop.credit_assign":  return handleCreditAssign(job.data);
        case "jobs.discover":       return handleJobsDiscover(job.data);
        default: throw new Error(`Unknown research job type`);
      }
    },
    { connection, concurrency: 2 }  // research is expensive and low-priority
  );
}

async function handlePersonaSynthesize(data: PersonaSynthesizeJobData): Promise<void> {
  console.log(`[research:persona] Synthesize: ${data.companyName} (${data.companyId})`);
  // TODO Sprint 1:
  // Multi-step research pipeline:
  // 1. Web research (company about, careers, news, engineering blog)
  // 2. LinkedIn company page signals
  // 3. Chunking + embedding of research docs (enqueue q.embed)
  // 4. Synthesis prompt → company_personas UPDATE
  // All via packages/rag (when implemented)
  throw new Error("F-052 not implemented — Sprint 1");
}

async function handlePersonaRefresh(data: PersonaRefreshJobData): Promise<void> {
  console.log(`[research:refresh] Refresh persona ${data.companyId}`);
  // TODO: Incremental update — check news, recent job postings
  throw new Error("Not implemented");
}

async function handleCreditAssign(data: CreditAssignJobData): Promise<void> {
  console.log(`[research:credit] Credit assign outcome ${data.outcomeId}`);
  // TODO V1: Bayesian credit propagation from outcome → artifacts → knowledge
  throw new Error("F-051 not implemented — V1");
}

async function handleJobsDiscover(data: JobsDiscoverJobData): Promise<void> {
  console.log(`[research:discover] Discover jobs via ${data.adapters.join(",")}`);
  // TODO V1: Adapter framework → INSERT INTO discovered_jobs + F-059 legitimacy filter
  throw new Error("F-058 not implemented — V1");
}
