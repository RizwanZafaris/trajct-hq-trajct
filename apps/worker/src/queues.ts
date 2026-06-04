/**
 * Named BullMQ queues — Technical-Methodology §7.2.
 *
 * Priorities (higher = processed first):
 *   q.compliance   → 10 (highest — a stuck write means decisions not served)
 *   q.ai.frontier  → 8
 *   q.ingest       → 6
 *   q.ai.utility   → 4
 *   q.embed        → 3
 *   q.notify       → 2
 *   q.research     → 1 (lowest — persona deep research, long-running, background)
 *
 * DLQ: each queue has a failed job retention; q.compliance DLQ depth > 0 → CRITICAL alert.
 */

import { Queue } from "bullmq";
import { Redis } from "ioredis";

export const QUEUE_NAMES = {
  INGEST: "q.ingest",
  AI_FRONTIER: "q.ai.frontier",
  AI_UTILITY: "q.ai.utility",
  EMBED: "q.embed",
  NOTIFY: "q.notify",
  RESEARCH: "q.research",
  COMPLIANCE: "q.compliance",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

const redisUrl = process.env["REDIS_URL"] ?? "redis://localhost:6379";

// Singleton Redis connection for BullMQ
let _connection: Redis | null = null;

export function getRedisConnection(): Redis {
  if (!_connection) {
    _connection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return _connection;
}

const defaultJobOptions = {
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 5000 },
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 2000,
  },
};

export function createQueues(): Record<QueueName, Queue> {
  const connection = getRedisConnection();
  const opts = { connection, defaultJobOptions };

  return {
    [QUEUE_NAMES.COMPLIANCE]: new Queue(QUEUE_NAMES.COMPLIANCE, { ...opts, defaultJobOptions: { ...defaultJobOptions, priority: 10 } }),
    [QUEUE_NAMES.AI_FRONTIER]: new Queue(QUEUE_NAMES.AI_FRONTIER, { ...opts, defaultJobOptions: { ...defaultJobOptions, priority: 8 } }),
    [QUEUE_NAMES.INGEST]: new Queue(QUEUE_NAMES.INGEST, { ...opts, defaultJobOptions: { ...defaultJobOptions, priority: 6 } }),
    [QUEUE_NAMES.AI_UTILITY]: new Queue(QUEUE_NAMES.AI_UTILITY, { ...opts, defaultJobOptions: { ...defaultJobOptions, priority: 4 } }),
    [QUEUE_NAMES.EMBED]: new Queue(QUEUE_NAMES.EMBED, { ...opts, defaultJobOptions: { ...defaultJobOptions, priority: 3 } }),
    [QUEUE_NAMES.NOTIFY]: new Queue(QUEUE_NAMES.NOTIFY, { ...opts, defaultJobOptions: { ...defaultJobOptions, priority: 2 } }),
    [QUEUE_NAMES.RESEARCH]: new Queue(QUEUE_NAMES.RESEARCH, { ...opts, defaultJobOptions: { ...defaultJobOptions, priority: 1 } }),
  } as Record<QueueName, Queue>;
}
