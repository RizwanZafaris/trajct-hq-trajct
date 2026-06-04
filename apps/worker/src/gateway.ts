/**
 * Shared Gateway for worker handlers — wired with the real metering sink (F-076).
 * Engine background work is metered against a system account.
 */

import { Gateway } from "@trajct/ai";
import { recordUsageEvent } from "@trajct/core/billing";

/** System account that engine/background AI spend is metered against. */
export const SYSTEM_ACCOUNT_ID = "00000000-0000-0000-0000-0000000000aa";

let _gw: Gateway | null = null;

export function gateway(): Gateway {
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
