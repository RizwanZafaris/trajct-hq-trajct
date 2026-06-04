import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

const connectionString = process.env["DATABASE_URL"];
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

/**
 * Application DB client.
 * Uses the app_role (least-privilege) by default.
 * RLS GUCs (app.current_user_id, app.current_org_id) are set per-request via setRlsContext().
 */
const sql = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(sql, { schema });

/**
 * Set RLS context for the current request.
 * Must be called before any RLS-protected query.
 * GUCs are used by Postgres RLS policies.
 */
export async function setRlsContext(userId: string, orgId: string | null): Promise<void> {
  await sql`SELECT set_config('app.current_user_id', ${userId}, true)`;
  if (orgId) {
    await sql`SELECT set_config('app.current_org_id', ${orgId}, true)`;
  }
}

export type Db = typeof db;
