-- =============================================================================
-- Engine schema (Sprint A) — F-050, F-051, F-052, F-055, F-056, F-080
-- Idempotent: layers on top of 001_schema.sql + 002_feature_schema.sql.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- F-050 — Outcome events (one row per logged outcome)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS outcome_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  job_id uuid,
  outcome varchar(50) NOT NULL,            -- interview_win|interview_loss|offer|hire|rejection|withdraw
  artifact_ids uuid[] NOT NULL DEFAULT '{}',
  cite_markers text[] NOT NULL DEFAULT '{}',
  consent_ref uuid NOT NULL,
  idempotency_key varchar(255) UNIQUE,     -- dedup logOutcome retries
  credit_assigned boolean NOT NULL DEFAULT false,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE outcome_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS outcome_events_user_isolation ON outcome_events;
CREATE POLICY outcome_events_user_isolation ON outcome_events
  USING (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid)
  WITH CHECK (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid);
CREATE INDEX IF NOT EXISTS outcome_events_user_idx ON outcome_events(user_id);
CREATE INDEX IF NOT EXISTS outcome_events_company_idx ON outcome_events(company_id);

-- ---------------------------------------------------------------------------
-- F-050 — Knowledge refs (citable knowledge atoms + outcome credit score)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS knowledge_refs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_id varchar(255) NOT NULL UNIQUE,
  doc_type varchar(50) NOT NULL,
  source_ref text,
  confidence numeric(4,3) CHECK (confidence BETWEEN 0 AND 1),
  outcome_score numeric(4,3) NOT NULL DEFAULT 0.5 CHECK (outcome_score BETWEEN 0 AND 1),
  region varchar(10) NOT NULL DEFAULT 'global',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- F-052 — Company personas: extend the 002 table with synthesis fields
-- ---------------------------------------------------------------------------
ALTER TABLE company_personas ADD COLUMN IF NOT EXISTS ats_keyword_bank jsonb NOT NULL DEFAULT '{"required":[],"boost":[],"banned":[]}';
ALTER TABLE company_personas ADD COLUMN IF NOT EXISTS quality varchar(10);
ALTER TABLE company_personas ADD COLUMN IF NOT EXISTS last_synthesized_at timestamptz;
-- 002 created version as varchar; engine treats it as an integer (version bump). Convert.
ALTER TABLE company_personas ALTER COLUMN version DROP DEFAULT;
ALTER TABLE company_personas ALTER COLUMN version TYPE integer USING floor(version::numeric)::integer;
ALTER TABLE company_personas ALTER COLUMN version SET DEFAULT 1;

-- F-051/F-052 — Persona version snapshots (audit trail of persona evolution)
CREATE TABLE IF NOT EXISTS persona_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  version integer NOT NULL,
  snapshot jsonb NOT NULL,
  reason varchar(255),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS persona_versions_company_idx ON persona_versions(company_id, version);

-- ---------------------------------------------------------------------------
-- F-080 — Compliance decision log (immutable, append-only, hash-chained)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS compliance_decision_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_type varchar(50) NOT NULL,
  account_id uuid NOT NULL,
  candidate_anonymized_id varchar(255) NOT NULL,
  org_id uuid NOT NULL,
  job_id uuid,
  inputs_hash varchar(64) NOT NULL UNIQUE,
  model_version varchar(100) NOT NULL,
  prompt_version varchar(100) NOT NULL,
  rationale text NOT NULL,
  consent_ref uuid NOT NULL,
  region varchar(10) NOT NULL,
  hash_chain varchar(64) NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE compliance_decision_log ENABLE ROW LEVEL SECURITY;
-- Immutable: append-only. No UPDATE/DELETE for app_role (TC-080.1).
REVOKE UPDATE, DELETE ON compliance_decision_log FROM app_role;
DROP POLICY IF EXISTS compliance_decision_log_insert ON compliance_decision_log;
CREATE POLICY compliance_decision_log_insert ON compliance_decision_log
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS compliance_decision_log_select ON compliance_decision_log;
CREATE POLICY compliance_decision_log_select ON compliance_decision_log
  FOR SELECT USING (org_id = nullif(current_setting('app.current_org_id', true), '')::uuid);

-- ---------------------------------------------------------------------------
-- F-055 — User voice profiles (calibration)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_voice_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  sentence_length_avg numeric(5,1),
  formality_score numeric(3,2),
  active_vs_passive_pct numeric(5,2),
  preferred_transitions text[] NOT NULL DEFAULT '{}',
  signature_phrases text[] NOT NULL DEFAULT '{}',
  sample_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE user_voice_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_voice_profiles_isolation ON user_voice_profiles;
CREATE POLICY user_voice_profiles_isolation ON user_voice_profiles
  USING (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid)
  WITH CHECK (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid);

-- ---------------------------------------------------------------------------
-- F-056 — High-fit auto-prep journeys (saga orchestration, dedup gate)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL,
  fit_score integer,
  status varchar(20) NOT NULL DEFAULT 'pending',  -- pending|running|completed|failed
  child_job_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_id)                          -- dedup: one journey per (user, job)
);
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS journeys_isolation ON journeys;
CREATE POLICY journeys_isolation ON journeys
  USING (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid)
  WITH CHECK (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid);

-- ---------------------------------------------------------------------------
-- F-053 — Company enrichment cache
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_enrichment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE,
  employee_count integer,
  funding_stage varchar(50),
  tech_stack text[] NOT NULL DEFAULT '{}',
  open_roles integer,
  last_enriched_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Grants for new tables (app_role; compliance_decision_log keeps its REVOKE above)
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON outcome_events TO app_role;
GRANT SELECT, INSERT, UPDATE ON knowledge_refs TO app_role;
GRANT SELECT, INSERT, UPDATE ON company_personas TO app_role;
GRANT SELECT, INSERT ON persona_versions TO app_role;
GRANT SELECT, INSERT ON compliance_decision_log TO app_role;  -- no UPDATE/DELETE (append-only)
GRANT SELECT, INSERT, UPDATE ON user_voice_profiles TO app_role;
GRANT SELECT, INSERT, UPDATE ON journeys TO app_role;
GRANT SELECT, INSERT, UPDATE ON company_enrichment TO app_role;
REVOKE UPDATE, DELETE ON outcome_events FROM app_role;  -- outcome events are append-only after credit assign
GRANT UPDATE (credit_assigned) ON outcome_events TO app_role;  -- except the credit flag
