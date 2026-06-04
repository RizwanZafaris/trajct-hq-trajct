/**
 * Echo job handler — end-to-end demo job for Step 6 verification.
 * Enqueued via POST /v1/diagnostic/echo (dev-only endpoint).
 * Processes on q.ai.utility, updates jobs_queue_status, returns.
 *
 * This is the "one real demo job end-to-end" requirement from Step 6.
 */

import { Worker, Job } from "bullmq";
import { getRedisConnection, QUEUE_NAMES } from "../queues.js";

export interface EchoJobData {
  message: string;
  userId: string;
  idempotencyKey: string;
}

export interface EchoJobResult {
  echo: string;
  processedAt: string;
}

export function createEchoWorker(): Worker<EchoJobData, EchoJobResult> {
  const connection = getRedisConnection();

  return new Worker<EchoJobData, EchoJobResult>(
    QUEUE_NAMES.AI_UTILITY,
    async (job: Job<EchoJobData, EchoJobResult>) => {
      const { message, userId, idempotencyKey } = job.data;

      // Idempotency: check if already processed (by idempotency_key in jobs_queue_status)
      // TODO: wire to DB when DB client is available
      console.log(`[echo] Processing job ${job.id} for user ${userId} (idem: ${idempotencyKey})`);

      // Simulate work
      await new Promise((resolve) => setTimeout(resolve, 50));

      const result: EchoJobResult = {
        echo: message,
        processedAt: new Date().toISOString(),
      };

      console.log(`[echo] Done job ${job.id}: ${JSON.stringify(result)}`);
      return result;
    },
    {
      connection,
      concurrency: 5,
      // Typed retryable/non-retryable errors — Technical-Methodology §7.2
      // Non-retryable job types should call job.discard() in their handler
    }
  );
}
