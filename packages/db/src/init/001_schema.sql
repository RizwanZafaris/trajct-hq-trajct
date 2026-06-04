-- Full schema creation for dev/test environments.
-- Generated from Drizzle schema definitions in packages/db/src/schema/
-- Run after 000_extensions.sql.

-- Enums
DO $$ BEGIN CREATE TYPE user_type AS ENUM ('candidate', 'employer', 'admin'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE org_tier AS ENUM ('free', 'starter', 'growth', 'enterprise'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE verification_status AS ENUM ('unverified', 'email_verified', 'domain_verified', 'manual_verified'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE org_role AS ENUM ('admin', 'recruiter', 'hiring_manager', 'viewer'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE audit_action AS ENUM (
  'user.create', 'user.update', 'user.delete', 'user.login', 'user.logout', 'user.lockout',
  'org.create', 'org.update', 'org.suspend',
  'member.invite', 'member.role_change', 'member.revoke',
  'billing.charge', 'billing.refund', 'billing.cap_adjust',
  'admin.action', 'admin.breakglass',
  'screening.evaluate',
  'dsar.export', 'dsar.delete',
  'feature_flag.change'
); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE task_tier AS ENUM ('frontier', 'mid', 'utility', 'embed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE ledger_entry_type AS ENUM ('debit', 'credit'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE ledger_currency AS ENUM ('USD', 'AED', 'SAR', 'SGD', 'GBP', 'EUR'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE job_status AS ENUM ('pending', 'active', 'completed', 'failed', 'delayed', 'waiting-children'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE queue_name AS ENUM ('q.ingest', 'q.ai.frontier', 'q.ai.utility', 'q.embed', 'q.notify', 'q.research', 'q.compliance'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE owner_scope AS ENUM ('user', 'org', 'global'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE embedding_doc_type AS ENUM ('resume', 'jd', 'persona', 'user-doc', 'help', 'outcome'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(320) NOT NULL UNIQUE,
  password_hash text,
  user_type user_type NOT NULL,
  display_name varchar(255),
  email_verified boolean NOT NULL DEFAULT false,
  mfa_enabled boolean NOT NULL DEFAULT false,
  mfa_totp_secret text,
  is_active boolean NOT NULL DEFAULT true,
  is_suspended boolean NOT NULL DEFAULT false,
  suspended_reason text,
  failed_login_count uuid,
  locked_until timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- Orgs
CREATE TABLE IF NOT EXISTS orgs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  slug varchar(100) NOT NULL UNIQUE,
  domain varchar(255),
  tier org_tier NOT NULL DEFAULT 'free',
  verification_status verification_status NOT NULL DEFAULT 'unverified',
  logo_url text,
  region varchar(10) NOT NULL DEFAULT 'global',
  is_active boolean NOT NULL DEFAULT true,
  is_suspended boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- Org memberships
CREATE TABLE IF NOT EXISTS org_memberships (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  role org_role NOT NULL DEFAULT 'viewer',
  invited_by uuid REFERENCES users(id),
  joined_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  PRIMARY KEY (user_id, org_id)
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  ip_address varchar(45),
  user_agent text,
  is_revoked boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  last_active_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Audit log (append-only)
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action audit_action NOT NULL,
  actor_id uuid,
  actor_type varchar(50) NOT NULL DEFAULT 'user',
  target_id uuid,
  target_type varchar(100),
  org_id uuid,
  region varchar(10),
  payload jsonb,
  ip_address varchar(45),
  hash_chain text NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Consent records (immutable)
CREATE TABLE IF NOT EXISTS consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  org_id uuid,
  job_id uuid,
  region varchar(10) NOT NULL,
  purposes jsonb NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now(),
  ip_address varchar(45),
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_reason text
);

-- Usage events (metering)
CREATE TABLE IF NOT EXISTS usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  org_id uuid,
  action varchar(100) NOT NULL,
  cost_cents numeric(12,4) NOT NULL,
  task_tier task_tier,
  model_version varchar(100),
  prompt_version varchar(100),
  idempotency_key varchar(255) NOT NULL,
  metadata jsonb,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT usage_events_idempotency_key_unique UNIQUE (idempotency_key)
);

-- Billing ledger (double-entry, immutable rows)
CREATE TABLE IF NOT EXISTS billing_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  org_id uuid,
  order_id varchar(255) NOT NULL,
  idempotency_key varchar(255) NOT NULL,
  entry_type ledger_entry_type NOT NULL,
  amount_cents numeric(12,0) NOT NULL,
  currency ledger_currency NOT NULL DEFAULT 'USD',
  psp_charge_id varchar(255),
  psp_status varchar(50),
  description text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_ledger_order_idempotency_unique UNIQUE (order_id, idempotency_key)
);

-- Jobs queue status
CREATE TABLE IF NOT EXISTS jobs_queue_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bullmq_job_id varchar(255),
  queue_name queue_name NOT NULL,
  job_type varchar(100) NOT NULL,
  account_id uuid REFERENCES users(id) ON DELETE SET NULL,
  org_id uuid,
  idempotency_key varchar(255) NOT NULL UNIQUE,
  status job_status NOT NULL DEFAULT 'pending',
  progress integer NOT NULL DEFAULT 0,
  result_ref text,
  error_code varchar(100),
  error_message text,
  attempts_made integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz
);

-- Feature flags
CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key varchar(200) NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  description text,
  allowed_regions jsonb,
  allowed_tiers jsonb,
  allowed_org_ids jsonb,
  rollout_percent varchar(5) DEFAULT '0',
  metadata jsonb,
  last_changed_by uuid,
  last_changed_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Vectors schema
CREATE TABLE IF NOT EXISTS vectors.embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_scope owner_scope NOT NULL,
  owner_id uuid,
  region varchar(10) NOT NULL DEFAULT 'global',
  doc_type embedding_doc_type NOT NULL,
  embedding_model_version varchar(100) NOT NULL,
  embedding vector(1536) NOT NULL,
  content_hash varchar(64) NOT NULL,
  source_ref text,
  consent_ref uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- HNSW index for ANN search
CREATE INDEX IF NOT EXISTS embeddings_hnsw_idx ON vectors.embeddings
  USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS embeddings_owner_scope_idx ON vectors.embeddings(owner_scope, owner_id);
CREATE INDEX IF NOT EXISTS embeddings_region_idx ON vectors.embeddings(region);
