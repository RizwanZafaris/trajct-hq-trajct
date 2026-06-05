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
import { writeDecisionLog, exportUserData, deleteUserData } from "@trajct/core/compliance";

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
  // Fail-closed (F-080): writeDecisionLog throws on missing consent or DB failure.
  // The job retries; the result remains blocked until the log lands.
  const result = await writeDecisionLog({
    decisionType: data.decisionType,
    accountId: data.accountId,
    candidateAnonymizedId: data.candidateAnonymizedId,
    orgId: data.orgId,
    ...(data.jobId ? { jobId: data.jobId } : {}),
    inputsHash: data.inputsHash,
    idempotencyKey: data.idempotencyKey,   // [R3] dedup key (distinct from inputs_hash)
    modelVersion: data.modelVersion,
    promptVersion: data.promptVersion,
    rationale: data.rationale,
    consentRef: data.consentRef,
    region: data.region,
  });
  console.log(`[compliance:log] logged ${result.logId} (chain=${result.hashChain.slice(0, 12)})`);
  return { logId: result.logId };
}

async function handleDsarExport(data: DsarExportJobData): Promise<void> {
  console.log(`[compliance:export] DSAR export for user ${data.userId}`);
  // Identity verification happens at the API layer (F-082.5); the worker trusts the gate.
  const result = await exportUserData({ userId: data.userId, verificationToken: "verified-upstream", requestId: data.requestId });
  console.log(`[compliance:export] export ${result.status} for request ${data.requestId}`);
  // R2 upload + email delivery of the bundle is a Platform-sprint step (result.status='pending').
}

async function handleDsarDelete(data: DsarDeleteJobData): Promise<{ residualPiiCount: number }> {
  console.log(`[compliance:delete] DSAR delete for user ${data.userId}`);
  // Postgres: anonymize outcomes FIRST (FR-082.3), then erase private rows, then residual scan.
  const result = await deleteUserData({ userId: data.userId, verificationToken: "verified-upstream", requestId: data.requestId });
  console.log(`[compliance:delete] residualPii=${result.residualPiiCount} anonymizedOutcomes=${result.anonymizedOutcomeCount}`);
  if ((result.residualPiiCount ?? 1) > 0) {
    // Fail-closed: residual PII is a deletion failure (TC-082.6) → job retries / alerts.
    throw new Error(`DSAR delete incomplete: ${result.residualPiiCount} residual PII rows`);
  }
  // TODO (Platform sprint): vectors.embeddings + Redis + R2 sweep, deletion-confirmation email.
  return { residualPiiCount: result.residualPiiCount ?? 0 };
}
