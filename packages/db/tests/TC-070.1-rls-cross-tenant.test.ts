/**
 * TC-070.1 — Cross-tenant RLS isolation.
 *
 * Proves: an authenticated session for org A cannot see org B's data,
 * even with a direct SQL SELECT. Zero rows returned, not a 403 from app code.
 * This is the database-layer trust wall proof.
 *
 * Covers: FR-070.3, AC-070.1.1, SR-070.2, FR-081.2
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";

const TEST_DB_URL =
  process.env["DATABASE_URL"] ??
  "postgresql://trajct:trajct_dev_password@localhost:5432/trajct_dev";

describe("TC-070.1 Cross-tenant RLS isolation", () => {
  let sql: ReturnType<typeof postgres>;

  beforeAll(async () => {
    sql = postgres(TEST_DB_URL, { max: 2 });

    // Seed two orgs, two users, one membership each
    await sql`
      INSERT INTO orgs (id, name, slug, region)
      VALUES
        ('11111111-0000-0000-0000-000000000001', 'Org Alpha', 'org-alpha', 'uae'),
        ('22222222-0000-0000-0000-000000000002', 'Org Beta',  'org-beta',  'uae')
      ON CONFLICT (id) DO NOTHING
    `;

    await sql`
      INSERT INTO users (id, email, user_type, password_hash)
      VALUES
        ('aaaaaaaa-0000-0000-0000-000000000001', 'alice@org-alpha.test', 'employer', 'hash'),
        ('bbbbbbbb-0000-0000-0000-000000000002', 'bob@org-beta.test',   'employer', 'hash')
      ON CONFLICT (id) DO NOTHING
    `;

    await sql`
      INSERT INTO org_memberships (user_id, org_id, role)
      VALUES
        ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'admin'),
        ('bbbbbbbb-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', 'admin')
      ON CONFLICT DO NOTHING
    `;
  });

  afterAll(async () => {
    await sql`DELETE FROM org_memberships WHERE org_id IN ('11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002')`;
    await sql`DELETE FROM users WHERE id IN ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002')`;
    await sql`DELETE FROM orgs WHERE id IN ('11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002')`;
    await sql.end();
  });

  it("alice (org-alpha) cannot see org-beta rows via RLS", async () => {
    // Set RLS context as Alice (org-alpha)
    await sql`SELECT set_config('app.current_user_id',  'aaaaaaaa-0000-0000-0000-000000000001', true)`;
    await sql`SELECT set_config('app.current_org_id',   '11111111-0000-0000-0000-000000000001', true)`;

    // Alice attempts to SELECT org-beta's row
    const rows = await sql`SELECT id FROM orgs WHERE id = '22222222-0000-0000-0000-000000000002'`;

    // RLS returns zero rows — not a query error, simply invisible
    expect(rows.length).toBe(0);
  });

  it("bob (org-beta) cannot see org-alpha memberships", async () => {
    await sql`SELECT set_config('app.current_user_id',  'bbbbbbbb-0000-0000-0000-000000000002', true)`;
    await sql`SELECT set_config('app.current_org_id',   '22222222-0000-0000-0000-000000000002', true)`;

    const rows = await sql`SELECT user_id FROM org_memberships WHERE org_id = '11111111-0000-0000-0000-000000000001'`;

    expect(rows.length).toBe(0);
  });

  it("alice can see org-alpha rows (positive case)", async () => {
    await sql`SELECT set_config('app.current_user_id',  'aaaaaaaa-0000-0000-0000-000000000001', true)`;
    await sql`SELECT set_config('app.current_org_id',   '11111111-0000-0000-0000-000000000001', true)`;

    const rows = await sql`SELECT id FROM orgs WHERE id = '11111111-0000-0000-0000-000000000001'`;

    expect(rows.length).toBe(1);
    expect(rows[0]?.id).toBe("11111111-0000-0000-0000-000000000001");
  });
});
