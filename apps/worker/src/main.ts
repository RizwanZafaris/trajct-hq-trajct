/**
 * Worker entrypoint — BullMQ workers for all named queues.
 * Same codebase as apps/api but different entrypoint (Technical-Methodology §0-A2).
 *
 * Queue priority (highest first):
 *   q.compliance   → 10  (P1: a failure means decisions not served)
 *   q.ai.frontier  → 8   (paid user-facing generation)
 *   q.ingest       → 6   (upload pipeline — user is waiting)
 *   q.ai.utility   → 4   (classification, cheap extractions)
 *   q.embed        → 3   (RAG pipeline, async)
 *   q.notify       → 2   (notifications, can lag slightly)
 *   q.research     → 1   (persona research, background)
 */

import { createQueues, QUEUE_NAMES, getRedisConnection } from "./queues.js";
import { runBootChecks, BootCheckError } from "./boot-checks.js";
import { createEchoWorker }       from "./handlers/echo.handler.js";
import { createIngestWorker }     from "./handlers/ingest.handler.js";
import { createFrontierWorker }   from "./handlers/ai-frontier.handler.js";
import { createUtilityWorker }    from "./handlers/ai-utility.handler.js";
import { createEmbedWorker }      from "./handlers/embed.handler.js";
import { createNotifyWorker }     from "./handlers/notify.handler.js";
import { createResearchWorker }   from "./handlers/research.handler.js";
import { createComplianceWorker } from "./handlers/compliance.handler.js";

// [R9] Fail-fast boot guards (malware scanning must be configured in production).
try {
  runBootChecks();
} catch (err) {
  if (err instanceof BootCheckError) {
    console.error(`[worker] CRITICAL boot check failed: ${err.message}`);
    process.exit(1);
  }
  throw err;
}

console.log("[worker] Starting Trajct worker process...");

const redis = getRedisConnection();
redis.on("error",   (err: Error) => console.error("[worker] Redis error:", err.message));
redis.on("connect", ()           => console.log("[worker] Redis connected"));

// Create all queues (for enqueuing from API or other workers)
const queues = createQueues();

// Start all workers
const workers = {
  compliance: createComplianceWorker(),  // highest priority first
  frontier:   createFrontierWorker(),
  ingest:     createIngestWorker(),
  utility:    createUtilityWorker(),
  embed:      createEmbedWorker(),
  notify:     createNotifyWorker(),
  research:   createResearchWorker(),
  echo:       createEchoWorker(),
};

// Wire common event handlers
for (const [name, worker] of Object.entries(workers)) {
  worker.on("completed", (job, result) => {
    console.log(`[${name}] Job ${job.id} completed`, result != null ? JSON.stringify(result).slice(0, 100) : "");
  });

  worker.on("failed", (job, err) => {
    const isCompliance = job?.queueName === QUEUE_NAMES.COMPLIANCE;
    const level = isCompliance ? "CRITICAL" : "ERROR";
    console.error(`[${name}] ${level}: Job ${job?.id} failed (attempt ${job?.attemptsMade}/${job?.opts.attempts ?? 3}): ${err.message}`);

    if (isCompliance) {
      console.error("[worker] CRITICAL: compliance queue DLQ depth increasing. Page on-call.");
    }
  });

  worker.on("stalled", (jobId) => {
    console.warn(`[${name}] Job ${jobId} stalled — will be retried`);
  });
}

console.log("[worker] All workers started. Listening for jobs...");
console.log("[worker] Queues:", Object.values(QUEUE_NAMES).join(", "));

// Graceful shutdown
async function shutdown(): Promise<void> {
  console.log("[worker] Shutting down gracefully...");
  await Promise.all(Object.values(workers).map(w => w.close()));
  await Promise.all(Object.values(queues).map(q => q.close()));
  await redis.quit();
  console.log("[worker] Shutdown complete.");
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown());
process.on("SIGINT",  () => void shutdown());
