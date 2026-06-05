/**
 * Internal — lightweight BullMQ enqueue helper for the engine.
 * NOT exported via index.ts (engine-private). Lets engine functions fire async
 * jobs (credit assignment, persona evolution) without importing the worker.
 *
 * Queue names mirror apps/worker/src/queues.ts QUEUE_NAMES.
 */

import { Queue } from "bullmq";
import { Redis } from "ioredis";

let _conn: Redis | null = null;
const _queues = new Map<string, Queue>();

function conn(): Redis {
  if (!_conn) {
    _conn = new Redis(process.env["REDIS_URL"] ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return _conn;
}

function queue(name: string): Queue {
  let q = _queues.get(name);
  if (!q) {
    q = new Queue(name, { connection: conn() });
    _queues.set(name, q);
  }
  return q;
}

/**
 * Fire-and-forget enqueue. Swallows errors (logs) — the engine write already
 * succeeded; a failed async enqueue must not roll back the primary operation.
 * Returns true if enqueued, false if it failed (e.g. Redis down).
 */
export async function enqueue(
  queueName: string,
  jobName: string,
  data: Record<string, unknown>,
  idempotencyKey?: string
): Promise<boolean> {
  try {
    await queue(queueName).add(jobName, data, idempotencyKey ? { jobId: idempotencyKey } : undefined);
    return true;
  } catch (err) {
    console.error(`[engine:enqueue] failed ${queueName}/${jobName}:`, err instanceof Error ? err.message : err);
    return false;
  }
}

export const ENGINE_QUEUES = {
  RESEARCH: "q.research",
  EMBED: "q.embed",
  AI_FRONTIER: "q.ai.frontier",
} as const;
