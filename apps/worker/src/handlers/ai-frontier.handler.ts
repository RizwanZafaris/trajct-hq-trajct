/**
 * q.ai.frontier — Frontier-tier AI jobs (quality-critical, user-paid, compliance-adjacent).
 * Model tier: Frontier (Claude Sonnet-class or equivalent).
 *
 * Job types:
 *   diagnostic.score   → F-001 full diagnostic scoring
 *   resume.tailor      → F-002 per-company tailored resume generation
 *   prep.generate      → F-007 interview prep question generation
 *   jd.generate        → F-030 JD generation
 *   matching.run       → F-032 candidate matching run
 *   offer.evaluate     → F-022 offer evaluation
 *
 * Pre-hook: atomicCapReserve (packages/ai) — fail-closed.
 * Post-hook: writeUsageEvent (idempotent) + fabrication scan where applicable.
 * No charge for failed work (FR-073.4).
 */

import { Worker, Queue, type Job } from "bullmq";
import postgres from "postgres";
import { QUEUE_NAMES, getRedisConnection } from "../queues.js";

let _jsql: ReturnType<typeof postgres> | null = null;
function jsql(): ReturnType<typeof postgres> {
  if (!_jsql) _jsql = postgres(process.env["DATABASE_URL"] ?? "postgresql://trajct:trajct_dev_password@localhost:5434/trajct_dev", { max: 2 });
  return _jsql;
}

export interface DiagnosticScoreJobData {
  type: "diagnostic.score";
  diagnosticId: string;
  resumeId: string;
  targetJdText: string;
  companyId?: string;
  userId?: string;
  contextSignal?: string;
  idempotencyKey: string;
}

export interface TailorJobData {
  type: "resume.tailor";
  tailoredResumeId: string;
  resumeId: string;
  companyId: string;
  targetRole: string;
  targetJdText?: string;
  userId: string;
  ledgerEntryId: string;
  idempotencyKey: string;
}

export interface PrepGenerateJobData {
  type: "prep.generate";
  prepSessionId: string;
  companyId: string;
  resumeId?: string;
  prepType: "standard" | "deep" | "leadership";
  userId: string;
  idempotencyKey: string;
}

export interface JdGenerateJobData {
  type: "jd.generate";
  jobPostingId: string;
  orgId: string;
  requestData: object;
  idempotencyKey: string;
}

export interface MatchingRunJobData {
  type: "matching.run";
  jobPostingId: string;
  orgId: string;
  limit: number;
  includeHiddenGems: boolean;
  idempotencyKey: string;
}

export interface JourneyOrchestrateJobData {
  type: "journey.orchestrate";
  journeyId: string;
  userId: string;
  jobId: string;
  idempotencyKey: string;
}

export type FrontierJobData =
  | DiagnosticScoreJobData
  | TailorJobData
  | PrepGenerateJobData
  | JdGenerateJobData
  | MatchingRunJobData
  | JourneyOrchestrateJobData;

export function createFrontierWorker(): Worker<FrontierJobData> {
  const connection = getRedisConnection();

  return new Worker<FrontierJobData>(
    QUEUE_NAMES.AI_FRONTIER,
    async (job: Job<FrontierJobData>) => {
      const { type } = job.data;
      console.log(`[frontier] Job ${job.id} type=${type}`);

      switch (type) {
        case "diagnostic.score":   return handleDiagnosticScore(job.data);
        case "resume.tailor":      return handleTailor(job.data);
        case "prep.generate":      return handlePrepGenerate(job.data);
        case "jd.generate":        return handleJdGenerate(job.data);
        case "matching.run":       return handleMatchingRun(job.data);
        case "journey.orchestrate": return handleJourneyOrchestrate(job.data);
        default:
          throw new Error(`Unknown frontier job type`);
      }
    },
    { connection, concurrency: 3 }  // 3 concurrent frontier calls max (cost knob)
  );
}

async function handleDiagnosticScore(data: DiagnosticScoreJobData): Promise<void> {
  console.log(`[frontier:diagnostic] Score diagnostic ${data.diagnosticId}`);
  // TODO Sprint 1 (W5-7):
  // 1. Gateway.complete({ task: 'diagnostic.score', tier: 'mid', ... }) — Mid not Frontier
  //    (8s p95 budget requires a fast model; rubric structure compensates)
  // 2. Parse response → overall_score, band, reasons with evidence_refs
  // 3. Attach cite-markers (F-050)
  // 4. UPDATE diagnostic_results SET overall_score, band, reasons, status='completed'
  // 5. Enqueue q.notify: { type: 'notify.diagnostic_ready', userId, diagnosticId }
  throw new Error("Not implemented — Sprint 1");
}

async function handleTailor(data: TailorJobData): Promise<void> {
  console.log(`[frontier:tailor] Tailor resume ${data.tailoredResumeId}`);
  // TODO Sprint 1 (W8-9):
  // 1. Cap reserve (already done at API layer; commit here on success, release on failure)
  // 2. Fetch persona (company_personas table or synthesize)
  // 3. Gateway.complete({ task: 'resume.tailor', tier: 'frontier', consentRef: undefined })
  // 4. CRITICAL: fabrication_scan must pass before storing or billing
  //    If fails → UPDATE status='failed', release cap, do NOT charge (FR-073.4)
  // 5. On success → upload generated PDF to R2, UPDATE tailored_resumes, commit charge
  throw new Error("Not implemented — Sprint 1");
}

async function handlePrepGenerate(data: PrepGenerateJobData): Promise<void> {
  console.log(`[frontier:prep] Generate prep ${data.prepSessionId}`);
  // TODO V1: Fetch persona → generate questions → UPDATE prep_sessions
  throw new Error("Not implemented — V1");
}

async function handleJdGenerate(data: JdGenerateJobData): Promise<void> {
  console.log(`[frontier:jd] Generate JD ${data.jobPostingId}`);
  // TODO Sprint 1 (W10):
  // 1. Cap check (free tier → cheaper model than strict frontier)
  // 2. Generate JD content
  // 3. Run inclusivity check in same pass (utility tier)
  // 4. UPDATE job_postings SET generated_jd, inclusivity_flags, status='completed'
  throw new Error("Not implemented — Sprint 1");
}

async function handleMatchingRun(data: MatchingRunJobData): Promise<void> {
  console.log(`[frontier:matching] Run matching for job ${data.jobPostingId}`);
  // TODO V1:
  // Stage 1: SQL prefilter (consent, region, availability, hard skills)
  // Stage 2: pgvector similarity (one feature among many)
  // Stage 3: Deterministic rubric score
  // Stage 4: LLM writes rationale ONLY (not the score)
  // Trust wall: only CandidatePublicProjection fields in matching_results
  throw new Error("Not implemented — V1");
}

// --- F-056 journey saga orchestration -------------------------------------

async function handleJourneyOrchestrate(data: JourneyOrchestrateJobData): Promise<void> {
  console.log(`[frontier:journey] Orchestrate ${data.journeyId} for ${data.userId}/${data.jobId}`);
  const connection = getRedisConnection();

  // Saga steps — each is an independent, idempotent child job (deduped by jobId).
  const frontier = new Queue(QUEUE_NAMES.AI_FRONTIER, { connection });
  const research = new Queue(QUEUE_NAMES.RESEARCH, { connection });
  const childIds: string[] = [];

  // Step 1: tailored résumé (G2 equivalent)
  const tailorId = `journey-${data.journeyId}-tailor`;
  await frontier.add("resume.tailor", {
    type: "resume.tailor", tailoredResumeId: tailorId, resumeId: "", companyId: data.jobId,
    targetRole: "", userId: data.userId, ledgerEntryId: "", idempotencyKey: tailorId,
  }, { jobId: tailorId });
  childIds.push(tailorId);

  // Step 2: interview prep (G3 equivalent)
  const prepId = `journey-${data.journeyId}-prep`;
  await frontier.add("prep.generate", {
    type: "prep.generate", prepSessionId: prepId, companyId: data.jobId,
    prepType: "standard", userId: data.userId, idempotencyKey: prepId,
  }, { jobId: prepId });
  childIds.push(prepId);

  // Step 3: people / job discovery (people-finder equivalent)
  const discoverId = `journey-${data.journeyId}-discover`;
  await research.add("jobs.discover", {
    type: "jobs.discover", adapters: ["fetch"], keywords: [], locations: [], idempotencyKey: discoverId,
  }, { jobId: discoverId });
  childIds.push(discoverId);

  // Mark the journey running with its child job ids.
  await jsql()`
    UPDATE journeys SET status = 'running', child_job_ids = ${jsql().array(childIds)}, updated_at = NOW()
    WHERE id = ${data.journeyId}
  `;
  console.log(`[frontier:journey] ${data.journeyId} running with ${childIds.length} child jobs`);
}
