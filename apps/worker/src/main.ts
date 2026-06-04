/**
 * Worker entrypoint — BullMQ workers for all named queues.
 * Same codebase as apps/api but different entrypoint (Technical-Methodology §0-A2).
 */

import { createQueues, QUEUE_NAMES, getRedisConnection } from "./queues.js";
import { createEchoWorker } from "./handlers/echo.handler.js";

console.log("[worker] Starting Trajct worker process...");

// Verify Redis connection on startup
const redis = getRedisConnection();
redis.on("error", (err: Error) => {
  console.error("[worker] Redis error:", err.message);
  // Fail-closed: if Redis is unavailable, workers can't process jobs
  // Log and keep trying to reconnect (IORedis handles reconnect automatically)
});
redis.on("connect", () => {
  console.log("[worker] Redis connected");
});

// Create all queues (for enqueuing from other processes)
const queues = createQueues();

// Start workers
const echoWorker = createEchoWorker();

echoWorker.on("completed", (job, result) => {
  console.log(`[echo] Job ${job.id} completed:`, result);
});

echoWorker.on("failed", (job, err) => {
  console.error(`[echo] Job ${job?.id} failed:`, err.message);

  // q.compliance DLQ depth > 0 → CRITICAL (Technical-Methodology §7.2)
  if (job?.queueName === QUEUE_NAMES.COMPLIANCE) {
    console.error("[worker] CRITICAL: compliance queue job failed — DLQ depth increasing. Check immediately.");
  }
});

// Graceful shutdown
async function shutdown(): Promise<void> {
  console.log("[worker] Shutting down gracefully...");
  await echoWorker.close();
  await Promise.all(Object.values(queues).map((q) => q.close()));
  await redis.quit();
  console.log("[worker] Shutdown complete.");
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());

console.log("[worker] All workers started. Listening for jobs...");
console.log("[worker] Queues:", Object.values(QUEUE_NAMES).join(", "));
