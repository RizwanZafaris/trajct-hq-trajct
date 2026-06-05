/**
 * Shared Gateway for synchronous API-side LLM calls (e.g. F-003 profile NER), wired to the
 * real metering sink (F-076). Heavy/async generation goes through the worker instead.
 */

import { Gateway } from "@trajct/ai";
import { recordUsageEvent } from "@trajct/core/billing";

let _gw: Gateway | null = null;

export function apiGateway(): Gateway {
  if (!_gw) {
    _gw = new Gateway({
      usageSink: async (e) => {
        await recordUsageEvent({
          accountId: e.accountId,
          action: e.action,
          costCents: e.costCents,
          idempotencyKey: e.idempotencyKey,
          modelVersion: e.modelVersion,
          taskTier: e.taskTier as "frontier" | "mid" | "utility" | "embed",
        });
      },
    });
  }
  return _gw;
}

export function hasLlmKeys(): boolean {
  return !!(process.env["ANTHROPIC_API_KEY"] || process.env["OPENAI_API_KEY"] || process.env["OPENROUTER_API_KEY"] || process.env["GOOGLE_API_KEY"]);
}
