/**
 * TC-070.1 — Cross-tenant RLS isolation.
 *
 * Proves: an authenticated session for org A cannot see org B's data,
 * even with a direct SQL SELECT. Zero rows returned, not a 403 from app code.
 * This is the database-layer trust wall proof.
 *
 * Covers: FR-070.3, AC-070.1.1, SR-070.2, FR-081.2
 *
 * Implementation note: we connect via app_user (non-superuser inheriting app_role)
 * because superusers bypass RLS even with FORCE ROW LEVEL SECURITY.
 * The app runtime always uses app_user — this test faithfully models production.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";

const ADMIN_DB_URL =
  process.env["DATABASE_URL"] ??
  "postgresql://trajct:trajct_dev_password@127.0.0.1:5434/trajct_dev";

// Non-superuser connection — RLS is enforced for this role
const APP_DB_URL =
  process.env["DATABASE_APP_USER_URL"] ??
  "postgresql://app_user:app_user_test_password@127.0.0.1:5434/trajct_dev";

describe("TC-070.1 Cross-tenant RLS isolation", () => {
  let adminSql: ReturnType<typeof postgres>;
  let appSql: ReturnType<typeof postgres>;

  beforeAll(async () => {
    adminSql = postgres(ADMIN_DB_URL, { max: 2 });
    appSql = postgres(APP_DB_URL, { max: 2 });

    // Seed two orgs, two users, one membership each (as admin/superuser)
    await adminSql`
      INSERT INTO orgs (id, name, slug, region)
      VALUES
        ('11111111-0000-0000-0000-000000000001', 'Org Alpha', 'org-alpha', 'uae'),
        ('22222222-0000-0000-0000-000000000002', 'Org Beta',  'org-beta',  'uae')
      ON CONFLICT (id) DO NOTHING
    `;

    await adminSql`
      INSERT INTO users (id, email, user_type, password_hash)
      VALUES
        ('aaaaaaaa-0000-0000-0000-000000000001', 'alice@org-alpha.test', 'employer', 'hash'),
        ('bbbbbbbb-0000-0000-0000-000000000002', 'bob@org-beta.test',   'employer', 'hash')
      ON CONFLICT (id) DO NOTHING
    `;

    await adminSql`
      INSERT INTO org_memberships (user_id, org_id, role)
      VALUES
        ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'admin'),
        ('bbbbbbbb-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', 'admin')
      ON CONFLICT DO NOTHING
    `;
  });

  afterAll(async () => {
    await adminSql`DELETE FROM org_memberships WHERE org_id IN ('11111111-0000-0000-0000-000000000001'::uuid, '22222222-0000-0000-0000-000000000002'::uuid)`;
    await adminSql`DELETE FROM users WHERE id IN ('aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'bbbbbbbb-0000-0000-0000-000000000002'::uuid)`;
    await adminSql`DELETE FROM orgs WHERE id IN ('11111111-0000-0000-0000-000000000001'::uuid, '22222222-0000-0000-0000-000000000002'::uuid)`;
    await adminSql.end();
    await appSql.end();
  });

  it("alice (org-alpha) cannot see org-beta rows via RLS", async () => {
    // Set RLS context as Alice (org-alpha) via GUC — non-superuser connection
    await appSql`SELECT set_config('app.current_user_id',  'aaaaaaaa-0000-0000-0000-000000000001', false)`;
    await appSql`SELECT set_config('app.current_org_id',   '11111111-0000-0000-0000-000000000001', false)`;

    // Alice attempts to SELECT org-beta's row — RLS should block it
    const rows = await appSql`SELECT id FROM orgs WHERE id = '22222222-0000-0000-0000-000000000002'`;

    expect(rows.length).toBe(0);
  });

  it("bob (org-beta) cannot see org-alpha memberships", async () => {
    await appSql`SELECT set_config('app.current_user_id',  'bbbbbbbb-0000-0000-0000-000000000002', false)`;
    await appSql`SELECT set_config('app.current_org_id',   '22222222-0000-0000-0000-000000000002', false)`;

    const rows = await appSql`SELECT user_id FROM org_memberships WHERE org_id = '11111111-0000-0000-0000-000000000001'`;

    expect(rows.length).toBe(0);
  });

  it("alice can see org-alpha rows (positive case)", async () => {
    await appSql`SELECT set_config('app.current_user_id',  'aaaaaaaa-0000-0000-0000-000000000001', false)`;
    await appSql`SELECT set_config('app.current_org_id',   '11111111-0000-0000-0000-000000000001', false)`;

    const rows = await appSql`SELECT id FROM orgs WHERE id = '11111111-0000-0000-0000-000000000001'`;

    expect(rows.length).toBe(1);
    expect(rows[0]?.id).toBe("11111111-0000-0000-0000-000000000001");
  });
});
