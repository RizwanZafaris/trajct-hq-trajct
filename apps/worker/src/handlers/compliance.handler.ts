/**
 * q.compliance — Decision log writes (HIGHEST PRIORITY).
 *
 * DLQ depth > 0 → CRITICAL alert (a stuck compliance write means decisions are
 * not being served, by design — fail-closed F-080).
 *
 * Job types:
 *   compliance.log_decision  → F-080 decision audit log write
 *   compliance.dsar_export   → F-082 DSAR data export
 *   compliance.dsar_delete   → F-082 DSAR deletion (all stores)
 *
 * Every job here uses the fail-closed pattern:
 * if the write fails → the result is NOT served to the user.
 */

import { Worker, type Job } from "bullmq";
import { QUEUE_NAMES, getRedisConnection } from "../queues.js";

export interface DecisionLogJobData {
  type: "compliance.log_decision";
  decisionType: "screening" | "matching" | "recommendation";
  accountId: string;
  candidateAnonymizedId: string;
  orgId: string;
  jobId?: string;
  inputsHash: string;
  modelVersion: string;
  promptVersion: string;
  rationale: string;
  consentRef: string;
  region: string;
  resultRef: string;  // reference to the result waiting to be served
  idempotencyKey: string;
}

export interface DsarExportJobData {
  type: "compliance.dsar_export";
  userId: string;
  requestId: string;
  idempotencyKey: string;
}

export interface DsarDeleteJobData {
  type: "compliance.dsar_delete";
  userId: string;
  requestId: string;
  idempotencyKey: string;
}

export type ComplianceJobData = DecisionLogJobData | DsarExportJobData | DsarDeleteJobData;

export function createComplianceWorker(): Worker<ComplianceJobData> {
  const connection = getRedisConnection();

  const worker = new Worker<ComplianceJobData>(
    QUEUE_NAMES.COMPLIANCE,
    async (job: Job<ComplianceJobData>) => {
      const { type } = job.data;
      console.log(`[compliance] Job ${job.id} type=${type}`);

      switch (type) {
        case "compliance.log_decision":  return handleDecisionLog(job.data);
        case "compliance.dsar_export":   return handleDsarExport(job.data);
        case "compliance.dsar_delete":   return handleDsarDelete(job.data);
        default: throw new Error(`Unknown compliance job type`);
      }
    },
    {
      connection,
      concurrency: 1,  // serialize compliance writes — no race conditions
    }
  );

  // DLQ depth alert — ANY failure here is P1
  worker.on("failed", (job, err) => {
    console.error(`[compliance] CRITICAL: Job ${job?.id} FAILED: ${err.message}`);
    console.error(`[compliance] CRITICAL: DLQ depth growing — decision log writes failing.`);
    console.error(`[compliance] CRITICAL: Decisions may be blocked (fail-closed). Check immediately.`);
    // TODO: Trigger PagerDuty/BetterStack alert
  });

  return worker;
}

async function handleDecisionLog(data: DecisionLogJobData): Promise<{ logId: string }> {
  console.log(`[compliance:log] Decision type=${data.decisionType} consent=${data.consentRef}`);
  // TODO Sprint 1 (wire with F-001 diagnostic and F-002 tailor):
  // 1. Compute hash_chain = SHA-256(prev_hash || JSON.stringify(entry))
  // 2. INSERT INTO audit_log (action='screening.evaluate', payload={...data}, hash_chain)
  // 3. Only AFTER successful insert → signal that resultRef can be served
  // 4. If insert fails → throw (job retried, result remains blocked)
  throw new Error("F-080 compliance log not implemented — Sprint 1");
}

async function handleDsarExport(data: DsarExportJobData): Promise<void> {
  console.log(`[compliance:export] DSAR export for user ${data.userId}`);
  // TODO: Collect all user data from Postgres, vectors, R2 → generate export bundle
  // Upload to R2 (exports bucket, short-TTL presigned URL) → email link to user
  throw new Error("F-082 DSAR export not implemented");
}

async function handleDsarDelete(data: DsarDeleteJobData): Promise<{ residualPiiCount: number }> {
  console.log(`[compliance:delete] DSAR delete for user ${data.userId}`);
  // TODO: orchestrated deletion:
  // 1. Postgres: cascade-delete user rows; anonymize outcome data (FR-082.3)
  // 2. vectors.embeddings: DELETE WHERE owner_id = userId
  // 3. Redis: clear session + cap counter keys
  // 4. R2: delete resume files, generated PDFs
  // 5. Scan for residual PII → residualPiiCount MUST = 0 (TC-082.6)
  // 6. Email deletion confirmation to user
  throw new Error("F-082 DSAR delete not implemented");
}
