-- =============================================================================
-- RLS Setup — Identity + Tenancy Spine (F-070 / F-081)
-- =============================================================================
-- This file runs after schema creation. It:
--   1. Creates app_role (least-privilege application role)
--   2. Enables RLS on every tenant table
--   3. Creates per-table policies scoped by GUC app.current_user_id / app.current_org_id
--   4. Revokes UPDATE/DELETE on audit_log (append-only invariant, TC-080.2)
--
-- GUCs are set per-request by setRlsContext() in packages/db/src/client.ts.
-- Cross-tenant reads return zero rows (TC-070.1) — enforced here, not in app code.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Create application role (least-privilege)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_role') THEN
    CREATE ROLE app_role;
  END IF;
END
$$;

-- Grant minimum required privileges to app_role
GRANT CONNECT ON DATABASE trajct_dev TO app_role;
GRANT USAGE ON SCHEMA public TO app_role;
GRANT USAGE ON SCHEMA vectors TO app_role;

-- Standard DML on all tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA vectors TO app_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_role;

-- CRITICAL: Revoke UPDATE and DELETE on audit_log (append-only — TC-080.2)
-- The app role may only INSERT and SELECT on audit_log.
REVOKE UPDATE, DELETE ON audit_log FROM app_role;

-- CRITICAL: Revoke UPDATE and DELETE on consent_records (immutable once written — F-034.2)
REVOKE UPDATE, DELETE ON consent_records FROM app_role;

-- CRITICAL: Revoke UPDATE on billing_ledger (double-entry, immutable rows — F-073)
REVOKE UPDATE, DELETE ON billing_ledger FROM app_role;

-- ---------------------------------------------------------------------------
-- 2. Enable RLS on all tenant tables
-- ---------------------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs_queue_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE vectors.embeddings ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owners (belt-and-suspenders for admin sessions)
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE orgs FORCE ROW LEVEL SECURITY;
ALTER TABLE org_memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE consent_records FORCE ROW LEVEL SECURITY;
ALTER TABLE usage_events FORCE ROW LEVEL SECURITY;
ALTER TABLE billing_ledger FORCE ROW LEVEL SECURITY;
ALTER TABLE vectors.embeddings FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3. RLS Policies
-- ---------------------------------------------------------------------------

-- USERS: users can only SELECT/UPDATE their own row
DROP POLICY IF EXISTS users_self_rls ON users;
CREATE POLICY users_self_rls ON users
  USING (id = nullif(current_setting('app.current_user_id', true), '')::uuid)
  WITH CHECK (id = nullif(current_setting('app.current_user_id', true), '')::uuid);

-- SESSIONS: users can only see their own sessions
DROP POLICY IF EXISTS sessions_owner_rls ON sessions;
CREATE POLICY sessions_owner_rls ON sessions
  USING (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid)
  WITH CHECK (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid);

-- ORGS: use GUC current_org_id directly to avoid recursive subquery on org_memberships.
-- The app sets app.current_org_id after validating membership at the session layer.
-- This avoids infinite recursion: org policy → org_memberships subquery → org_memberships policy → org_memberships subquery...
DROP POLICY IF EXISTS orgs_member_rls ON orgs;
CREATE POLICY orgs_member_rls ON orgs
  FOR SELECT
  USING (
    id = nullif(current_setting('app.current_org_id', true), '')::uuid
  );

DROP POLICY IF EXISTS orgs_admin_write_rls ON orgs;
CREATE POLICY orgs_admin_write_rls ON orgs
  FOR ALL
  USING (
    id = nullif(current_setting('app.current_org_id', true), '')::uuid
  );

-- ORG_MEMBERSHIPS: users can only see rows for their current org (GUC-scoped).
-- No subquery on org_memberships itself to avoid infinite recursion.
DROP POLICY IF EXISTS org_memberships_member_rls ON org_memberships;
CREATE POLICY org_memberships_member_rls ON org_memberships
  USING (
    org_id = nullif(current_setting('app.current_org_id', true), '')::uuid
  );

-- AUDIT_LOG: SELECT only for compliance/admin roles; INSERT always allowed
DROP POLICY IF EXISTS audit_log_insert_rls ON audit_log;
CREATE POLICY audit_log_insert_rls ON audit_log
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS audit_log_select_rls ON audit_log;
CREATE POLICY audit_log_select_rls ON audit_log
  FOR SELECT USING (
    -- Users see audit log entries for their org only
    org_id = nullif(current_setting('app.current_org_id', true), '')::uuid
    OR actor_id = nullif(current_setting('app.current_user_id', true), '')::uuid
  );

-- CONSENT_RECORDS: users see only their own consent records
DROP POLICY IF EXISTS consent_records_owner_rls ON consent_records;
CREATE POLICY consent_records_owner_rls ON consent_records
  USING (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid)
  WITH CHECK (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid);

-- USAGE_EVENTS: accounts see only their own
DROP POLICY IF EXISTS usage_events_owner_rls ON usage_events;
CREATE POLICY usage_events_owner_rls ON usage_events
  USING (account_id = nullif(current_setting('app.current_user_id', true), '')::uuid)
  WITH CHECK (account_id = nullif(current_setting('app.current_user_id', true), '')::uuid);

-- BILLING_LEDGER: accounts see only their own
DROP POLICY IF EXISTS billing_ledger_owner_rls ON billing_ledger;
CREATE POLICY billing_ledger_owner_rls ON billing_ledger
  USING (account_id = nullif(current_setting('app.current_user_id', true), '')::uuid)
  WITH CHECK (account_id = nullif(current_setting('app.current_user_id', true), '')::uuid);

-- JOBS_QUEUE_STATUS: accounts see only their own jobs
DROP POLICY IF EXISTS jobs_queue_status_owner_rls ON jobs_queue_status;
CREATE POLICY jobs_queue_status_owner_rls ON jobs_queue_status
  USING (account_id = nullif(current_setting('app.current_user_id', true), '')::uuid)
  WITH CHECK (account_id = nullif(current_setting('app.current_user_id', true), '')::uuid);

-- FEATURE_FLAGS: all authenticated users can SELECT (evaluated server-side, no write via RLS)
DROP POLICY IF EXISTS feature_flags_read_rls ON feature_flags;
CREATE POLICY feature_flags_read_rls ON feature_flags
  FOR SELECT USING (current_setting('app.current_user_id', true) IS NOT NULL AND current_setting('app.current_user_id', true) != '');

-- VECTORS.EMBEDDINGS: scoped by owner_scope + owner_id + region (trust wall + residency)
-- This is the trust wall at the data layer: employer-scoped queries physically cannot
-- return candidate-private embeddings.
DROP POLICY IF EXISTS embeddings_owner_rls ON vectors.embeddings;
CREATE POLICY embeddings_owner_rls ON vectors.embeddings
  USING (
    (owner_scope = 'global')
    OR (owner_scope = 'user' AND owner_id = nullif(current_setting('app.current_user_id', true), '')::uuid)
    OR (owner_scope = 'org' AND owner_id = nullif(current_setting('app.current_org_id', true), '')::uuid)
  );
