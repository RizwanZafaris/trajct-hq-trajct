/**
 * q.ai.utility — Utility/mid-tier AI jobs (extraction, classification, cheap).
 * Model tier: Utility (cheapest capable — Haiku/Flash/Mistral-small).
 *
 * Job types:
 *   resume.semantic_check   → NOT_A_RESUME detection (FR-001.2)
 *   jd.inclusivity_check    → Bias/exclusionary language detection (FR-030.2)
 *   linkedin.optimize       → F-011 profile section optimization
 *   linkedin.post           → F-012 post generation
 *   outreach.draft          → F-013 outreach message drafting
 *   offer.evaluate          → F-022 offer evaluation
 *   rate_job.score          → F-005 rate-a-job fit scoring
 */

import { Worker, type Job } from "bullmq";
import { QUEUE_NAMES, getRedisConnection } from "../queues.js";

export interface SemanticCheckJobData {
  type: "resume.semantic_check";
  resumeId: string;
  parsedText: string;
  wordCount: number;
  idempotencyKey: string;
}

export interface InclusivityCheckJobData {
  type: "jd.inclusivity_check";
  jobPostingId: string;
  jdText: string;
  idempotencyKey: string;
}

export interface LinkedInOptimizeJobData {
  type: "linkedin.optimize";
  optimizationId: string;
  section: string;
  resumeId: string;
  userId: string;
  idempotencyKey: string;
}

export interface RateJobData {
  type: "rate_job.score";
  ratingId: string;
  resumeId: string;
  jdText: string;
  userId: string;
  idempotencyKey: string;
}

export type UtilityJobData = SemanticCheckJobData | InclusivityCheckJobData | LinkedInOptimizeJobData | RateJobData;

export function createUtilityWorker(): Worker<UtilityJobData> {
  const connection = getRedisConnection();

  return new Worker<UtilityJobData>(
    QUEUE_NAMES.AI_UTILITY,
    async (job: Job<UtilityJobData>) => {
      const { type } = job.data;
      console.log(`[utility] Job ${job.id} type=${type}`);

      switch (type) {
        case "resume.semantic_check":  return handleSemanticCheck(job.data);
        case "jd.inclusivity_check":   return handleInclusivityCheck(job.data);
        case "linkedin.optimize":      return handleLinkedInOptimize(job.data);
        case "rate_job.score":         return handleRateJob(job.data);
        default: throw new Error(`Unknown utility job type`);
      }
    },
    { connection, concurrency: 10 }
  );
}

async function handleSemanticCheck(data: SemanticCheckJobData): Promise<{ isResume: boolean; reason?: string }> {
  console.log(`[utility:semantic] Check resume ${data.resumeId}`);
  // TODO Sprint 1: Prompt: "Is this document a resume/CV? Check for contact block,
  //  experience, education, skills. Reply JSON {isResume, reason}."
  // If !isResume → UPDATE resumes SET parse_status='failed', error='NOT_A_RESUME'
  throw new Error("Not implemented — Sprint 1");
}

async function handleInclusivityCheck(data: InclusivityCheckJobData): Promise<{ flags: object[] }> {
  console.log(`[utility:inclusivity] Check JD ${data.jobPostingId}`);
  // TODO Sprint 1: Detect gendered/exclusionary language, return flagged phrases + suggestions
  throw new Error("Not implemented — Sprint 1");
}

async function handleLinkedInOptimize(data: LinkedInOptimizeJobData): Promise<{ optimizedText: string }> {
  console.log(`[utility:linkedin] Optimize section=${data.section} for user ${data.userId}`);
  throw new Error("Not implemented — V1");
}

async function handleRateJob(data: RateJobData): Promise<{ fitScore: number; band: string; reasons: object[] }> {
  console.log(`[utility:rate] Rate job for user ${data.userId}`);
  throw new Error("Not implemented — V1");
}
