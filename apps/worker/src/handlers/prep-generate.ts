/**
 * F-007 — interview prep generation (worker). Grounds a brief in the company persona (F-052)
 * and persists it. Honest-by-construction (see prep-brief.ts): thin research → general guidance,
 * insider asks declined, conflicting signals noted.
 *
 * [G3 lesson] The prep row MUST carry user_id (a NOT-NULL omission silently persists 0 rows — the
 * exact bug class from jobHunt's create_interview_prep). We UPDATE the API-created row scoped by
 * (id, user_id) so only the owner's row is written.
 */

import postgres from "postgres";
import { getPersona } from "@trajct/core/engine";
import { buildBrief, isInsiderRequest } from "./prep-brief.js";

export interface PrepInput {
  prepSessionId: string;
  companyId?: string;
  target?: string;
  profileId?: string;
  prepType: "standard" | "deep" | "leadership";
  userId: string;
  idempotencyKey: string;
}

let _sql: ReturnType<typeof postgres> | null = null;
function sql(): ReturnType<typeof postgres> {
  if (!_sql) _sql = postgres(process.env["DATABASE_URL"] ?? "postgresql://trajct:trajct_dev_password@localhost:5434/trajct_dev", { max: 3 });
  return _sql;
}

export async function runPrep(data: PrepInput): Promise<void> {
  const persona = data.companyId
    ? await getPersona({ companyId: data.companyId, requestingUserId: data.userId }).catch(() => null)
    : null;

  const insider = isInsiderRequest(data.target ?? "");
  const built = buildBrief(persona, { target: data.target ?? "", insider, prepType: data.prepType, starStoryIds: [] });

  await sql()`
    UPDATE prep_sessions SET
      brief = ${sql().json(built.brief as never)},
      cites = ${sql().json(built.cites as never)},
      confidence = ${built.confidence},
      star_mappings = ${sql().json(built.starMappings as never)},
      notes = ${sql().json(built.notes as never)},
      insider_declined = ${built.insiderDeclined},
      persona_snapshot = ${persona ? sql().json(persona as never) : null},
      model_version = ${"prep-mock-dev"},
      status = 'completed', completed_at = now()
    WHERE id = ${data.prepSessionId} AND user_id = ${data.userId}
  `;
  console.log(`[prep] ${data.prepSessionId} completed (confidence=${built.confidence}, cites=${built.cites.length}, insiderDeclined=${built.insiderDeclined})`);
}
