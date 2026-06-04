-- =============================================================================
-- 002b — Engine / compliance Postgres roles  [FIX R1]
-- Runs after 002_feature_schema.sql, before 003_engine_schema.sql (grants reference these).
--
-- The architect fix (R1) requires the decision log to use role-targeted RLS:
--   trajct_app        — writes decisions (INSERT-only on compliance_decision_log)
--   trajct_compliance — reads decisions (SELECT-only; the compliance console connects here)
--   trajct_engine     — reads outcome_events for credit assignment (incl. anonymized rows)
--
-- ADR-009 records why three roles instead of one: the trust wall demands that the
-- write path (app) and the audit-read path (compliance) be separable, so a compromised
-- app role can append decisions but never read the full hiring-decision history.
-- =============================================================================

-- Ensure app_role exists (it is normally created in policies/001_rls_setup.sql; guard here
-- so this migration is order-independent for CI and fresh-DB runs).
DO $$ BEGIN CREATE ROLE app_role          NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE trajct_app        NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE trajct_engine     NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE trajct_compliance NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT USAGE ON SCHEMA public  TO trajct_app, trajct_engine, trajct_compliance;
GRANT USAGE ON SCHEMA vectors TO trajct_app, trajct_engine;

-- The runtime application login (app_role / app_user) acts AS trajct_app + trajct_engine,
-- so role-targeted RLS policies (TO trajct_app / TO trajct_engine) apply to it.
-- trajct_compliance is deliberately NOT granted to app_role — the audit-read path is separate.
GRANT trajct_app    TO app_role;
GRANT trajct_engine TO app_role;
