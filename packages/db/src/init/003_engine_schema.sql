-- =============================================================================
-- Engine schema (Sprint A) — F-050, F-051, F-052, F-055, F-056, F-080
-- ARCHITECT-CORRECTED: applies [FIX R1] role-targeted decision-log RLS,
-- [FIX R2] outcome anonymization (nullable user_id + SET NULL + anonymized_at),
-- [FIX R3] idempotency_key UNIQUE (inputs_hash indexed, not unique).
-- Requires 002b_engine_roles.sql (trajct_app / trajct_engine / trajct_compliance).
-- Idempotent: correct CREATE defs for fresh DBs + reconciliation ALTERs for existing.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- F-050 — Outcome events  [FIX R2: user_id NULLABLE + ON DELETE SET NULL + anonymized_at]
-- FR-082.3: outcomes are ANONYMIZED on account deletion, never destroyed (the moat).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS outcome_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,            -- [FIX R2] nullable + SET NULL
  company_id uuid NOT NULL,
  job_id uuid,
  outcome varchar(50) NOT NULL CHECK (outcome IN
    ('interview_win','interview_loss','offer','hire','rejection','withdraw')),
  artifact_ids uuid[] NOT NULL DEFAULT '{}',
  cite_markers text[] NOT NULL DEFAULT '{}',
  consent_ref uuid NOT NULL,
  idempotency_key varchar(255) UNIQUE,
  credit_assigned boolean NOT NULL DEFAULT false,
  anonymized_at timestamptz,                                       -- [FIX R2] audit when anonymized
  recorded_at timestamptz NOT NULL DEFAULT now()
);

-- [FIX R2] Reconcile a pre-existing (NOT NULL + CASCADE) table to the corrected shape.
ALTER TABLE outcome_events ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE outcome_events ADD COLUMN IF NOT EXISTS anonymized_at timestamptz;
DO $$
DECLARE fk text;
BEGIN
  SELECT conname INTO fk FROM pg_constraint
   WHERE conrelid = 'outcome_events'::regclass AND contype = 'f' AND confrelid = 'users'::regclass;
  IF fk IS NOT NULL THEN EXECUTE 'ALTER TABLE outcome_events DROP CONSTRAINT ' || quote_ident(fk); END IF;
  ALTER TABLE outcome_events
    ADD CONSTRAINT outcome_events_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE outcome_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS outcome_user_iso ON outcome_events;
CREATE POLICY outcome_user_iso ON outcome_events
  USING (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid)
  WITH CHECK (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid);
-- [FIX R2] engine role reads anonymized rows (user_id IS NULL) for credit assignment:
DROP POLICY IF EXISTS outcome_engine_read ON outcome_events;
CREATE POLICY outcome_engine_read ON outcome_events FOR SELECT
  TO trajct_engine USING (user_id IS NULL OR credit_assigned = false);
CREATE INDEX IF NOT EXISTS outcome_events_user_idx ON outcome_events(user_id);
CREATE INDEX IF NOT EXISTS outcome_events_company_idx ON outcome_events(company_id);

-- ---------------------------------------------------------------------------
-- F-050 — Knowledge refs (citable knowledge atoms + outcome credit score)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS knowledge_refs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_id varchar(255) NOT NULL UNIQUE,
  doc_type varchar(50) NOT NULL CHECK (doc_type IN ('persona','jd','user-doc','help','outcome')),
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
DO $$ BEGIN
  ALTER TABLE company_personas ALTER COLUMN version DROP DEFAULT;
  ALTER TABLE company_personas ALTER COLUMN version TYPE integer USING floor(version::numeric)::integer;
  ALTER TABLE company_personas ALTER COLUMN version SET DEFAULT 1;
EXCEPTION WHEN others THEN NULL; END $$;

-- F-051/F-052 — Persona version snapshots  [FIX: UNIQUE(company_id, version)]
CREATE TABLE IF NOT EXISTS persona_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  version integer NOT NULL,
  snapshot jsonb NOT NULL,
  reason varchar(255),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, version)
);
DO $$ BEGIN
  ALTER TABLE persona_versions ADD CONSTRAINT persona_versions_company_version_unique UNIQUE (company_id, version);
EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS persona_versions_company_idx ON persona_versions(company_id, version);

-- ---------------------------------------------------------------------------
-- F-080 — Compliance decision log (immutable, append-only, hash-chained)
-- [FIX R1] RLS with WORKING policies; [FIX R3] idempotency_key UNIQUE, inputs_hash indexed.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS compliance_decision_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_type varchar(50) NOT NULL CHECK (decision_type IN ('screening','matching','recommendation')),
  account_id uuid NOT NULL,
  candidate_anonymized_id varchar(255) NOT NULL,
  org_id uuid NOT NULL,
  job_id uuid,
  inputs_hash varchar(64) NOT NULL,                                -- [FIX R3] NOT unique
  idempotency_key varchar(255) NOT NULL,                           -- [FIX R3] UNIQUE added below (named)
  model_version varchar(100) NOT NULL,
  prompt_version varchar(100) NOT NULL,
  rationale text NOT NULL,
  consent_ref uuid NOT NULL,
  region varchar(10) NOT NULL,
  hash_chain varchar(64) NOT NULL,
  chain_seq bigint,                                                -- [FIX R4] deterministic chain order
  recorded_at timestamptz NOT NULL DEFAULT clock_timestamp()      -- [FIX R4] real insert moment (lock-serialized)
);

-- [FIX R4] Monotonic chain sequence — orders the hash chain by insertion, immune to
-- clock-tie ambiguity that would make a serialized chain look forked.
CREATE SEQUENCE IF NOT EXISTS compliance_decision_log_chain_seq;
ALTER TABLE compliance_decision_log ADD COLUMN IF NOT EXISTS chain_seq bigint;
ALTER TABLE compliance_decision_log ALTER COLUMN chain_seq SET DEFAULT nextval('compliance_decision_log_chain_seq');
UPDATE compliance_decision_log SET chain_seq = nextval('compliance_decision_log_chain_seq') WHERE chain_seq IS NULL;
ALTER TABLE compliance_decision_log ALTER COLUMN chain_seq SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_decision_log_chain_seq ON compliance_decision_log (chain_seq);

-- [FIX R3] Reconcile a pre-existing table (inputs_hash UNIQUE, "timestamp" col, no idempotency_key).
ALTER TABLE compliance_decision_log ADD COLUMN IF NOT EXISTS idempotency_key varchar(255);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='compliance_decision_log' AND column_name='timestamp')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='compliance_decision_log' AND column_name='recorded_at')
  THEN ALTER TABLE compliance_decision_log RENAME COLUMN "timestamp" TO recorded_at; END IF;
END $$;
UPDATE compliance_decision_log SET idempotency_key = id::text WHERE idempotency_key IS NULL;
ALTER TABLE compliance_decision_log ALTER COLUMN idempotency_key SET NOT NULL;
DO $$ BEGIN
  ALTER TABLE compliance_decision_log ADD CONSTRAINT decision_log_idem_unique UNIQUE (idempotency_key);
EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL; END $$;
-- drop any UNIQUE constraint on inputs_hash (keep it only as a plain index)
DO $$
DECLARE c text;
BEGIN
  SELECT conname INTO c FROM pg_constraint
   WHERE conrelid='compliance_decision_log'::regclass AND contype='u'
     AND pg_get_constraintdef(oid) LIKE '%inputs_hash%';
  IF c IS NOT NULL THEN EXECUTE 'ALTER TABLE compliance_decision_log DROP CONSTRAINT ' || quote_ident(c); END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_decision_log_inputs ON compliance_decision_log (inputs_hash);
CREATE INDEX IF NOT EXISTS idx_decision_log_org_time ON compliance_decision_log (org_id, recorded_at);

ALTER TABLE compliance_decision_log ENABLE ROW LEVEL SECURITY;
-- [FIX R1] policies that make append-only actually WORK for the app role:
DROP POLICY IF EXISTS compliance_decision_log_insert ON compliance_decision_log;
DROP POLICY IF EXISTS compliance_decision_log_select ON compliance_decision_log;
DROP POLICY IF EXISTS decision_log_insert ON compliance_decision_log;
DROP POLICY IF EXISTS decision_log_read_compliance ON compliance_decision_log;
CREATE POLICY decision_log_insert ON compliance_decision_log
  FOR INSERT TO trajct_app WITH CHECK (true);
CREATE POLICY decision_log_read_compliance ON compliance_decision_log
  FOR SELECT TO trajct_compliance USING (true);
-- No UPDATE/DELETE policies exist; additionally revoke at the grant level (defense in depth):
GRANT INSERT ON compliance_decision_log TO trajct_app;
GRANT SELECT ON compliance_decision_log TO trajct_compliance;
GRANT USAGE, SELECT ON SEQUENCE compliance_decision_log_chain_seq TO trajct_app, app_role;
REVOKE UPDATE, DELETE ON compliance_decision_log FROM trajct_app, trajct_compliance, app_role;

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
  status varchar(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','running','completed','failed')),
  child_job_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_id)
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
-- Grants
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT ON outcome_events TO app_role;
GRANT UPDATE (credit_assigned, user_id, anonymized_at) ON outcome_events TO app_role;  -- credit + anonymize only
REVOKE DELETE ON outcome_events FROM app_role;                                          -- never destroy outcomes
GRANT SELECT ON outcome_events TO trajct_engine;
GRANT SELECT, INSERT, UPDATE ON knowledge_refs TO app_role;
GRANT SELECT, INSERT, UPDATE ON company_personas TO app_role;
GRANT SELECT, INSERT ON persona_versions TO app_role;
GRANT SELECT, INSERT, UPDATE ON user_voice_profiles TO app_role;
GRANT SELECT, INSERT, UPDATE ON journeys TO app_role;
GRANT SELECT, INSERT, UPDATE ON company_enrichment TO app_role;
