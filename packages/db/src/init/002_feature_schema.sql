-- =============================================================================
-- Feature schema — all product tables beyond the identity/tenancy spine.
-- Run after 001_schema.sql.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- CANDIDATE DOMAIN
-- ---------------------------------------------------------------------------

-- F-001 / F-002 / F-003: Resumes (canonical parsed resume per user)
CREATE TABLE IF NOT EXISTS resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_key text,                        -- R2 object key for original file
  file_name varchar(255),
  file_mime varchar(100),
  file_size_bytes integer,
  parsed_text text,                     -- extracted plain text
  word_count integer,
  char_count integer,
  language varchar(10) DEFAULT 'en',
  parse_status varchar(50) DEFAULT 'pending', -- pending|parsed|failed
  malware_scanned boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- F-001: Diagnostic results (transient, TTL 24h for anonymous; persistent for authed)
CREATE TABLE IF NOT EXISTS diagnostic_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diag_token varchar(255) UNIQUE NOT NULL,  -- TTL-keyed token (Redis-backed TTL)
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  resume_id uuid REFERENCES resumes(id) ON DELETE SET NULL,
  target_jd_text text,
  target_company_id uuid,
  target_role varchar(255),
  overall_score integer CHECK (overall_score BETWEEN 0 AND 100),
  band varchar(1) CHECK (band IN ('A','B','C','D','E','F')),
  reasons jsonb,              -- [{issue, fix, evidence_ref, severity, cite_marker}]
  model_version varchar(100),
  prompt_version varchar(100),
  language varchar(10) DEFAULT 'en',
  context_signal varchar(50), -- laid_off|fresher|employed|null
  status varchar(50) DEFAULT 'pending', -- pending|processing|completed|failed
  error_code varchar(100),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- F-002: Tailored resumes (paid artifact; one per resume+company+role)
CREATE TABLE IF NOT EXISTS tailored_resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resume_id uuid REFERENCES resumes(id) ON DELETE SET NULL,
  company_id uuid NOT NULL,
  target_role varchar(255),
  target_jd_text text,
  generated_text text,         -- the tailored resume content
  generated_file_key text,     -- R2 key for PDF/DOCX
  fabrication_scan_passed boolean,
  fabrication_score numeric(5,2),
  citations jsonb,              -- cite markers from engine F-050
  model_version varchar(100),
  prompt_version varchar(100),
  ledger_entry_id uuid,         -- billing reference
  usage_event_id uuid,
  build_count integer DEFAULT 1,
  version integer DEFAULT 1,
  status varchar(50) DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- F-003: Candidate career profiles
CREATE TABLE IF NOT EXISTS candidate_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  headline varchar(500),
  summary text,
  years_experience integer,
  seniority_band varchar(50),
  current_title varchar(255),
  current_company varchar(255),
  target_titles jsonb,
  target_industries jsonb,
  target_locations jsonb,
  availability varchar(50) DEFAULT 'active', -- active|passive|not-looking
  open_to_remote boolean DEFAULT true,
  salary_min_usd integer,
  salary_max_usd integer,
  visa_status varchar(100),
  skills jsonb,
  languages jsonb,
  portfolio_urls jsonb,
  voice_samples jsonb,    -- F-055 user voice calibration
  is_discoverable boolean DEFAULT false,  -- F-033
  discoverable_since timestamptz,
  consent_discoverable_ref uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- F-005: Job ratings (rate-a-job by URL/JD)
CREATE TABLE IF NOT EXISTS job_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_url text,
  jd_text text,
  job_posting_id uuid,  -- FK to job_postings if matched
  resume_id uuid REFERENCES resumes(id),
  fit_score integer CHECK (fit_score BETWEEN 0 AND 100),
  band varchar(1),
  reasons jsonb,
  recommendations jsonb,
  model_version varchar(100),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- F-007: Interview prep sessions
CREATE TABLE IF NOT EXISTS prep_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  job_posting_id uuid,
  resume_id uuid REFERENCES resumes(id),
  prep_type varchar(50) DEFAULT 'standard', -- standard|deep|leadership
  questions jsonb,   -- [{question, type, context, cite_marker, model_answer_hint}]
  persona_snapshot jsonb,  -- company persona used
  model_version varchar(100),
  prompt_version varchar(100),
  status varchar(50) DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- F-008: Mock interview sessions
CREATE TABLE IF NOT EXISTS mock_interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prep_session_id uuid REFERENCES prep_sessions(id),
  company_id uuid,
  mode varchar(20) DEFAULT 'text', -- text|voice|video
  transcript jsonb,  -- [{role, content, ts}]
  feedback jsonb,    -- [{dimension, score, notes}]
  overall_score integer,
  duration_seconds integer,
  status varchar(50) DEFAULT 'pending', -- pending|active|completed|abandoned
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- F-011: LinkedIn profile optimizations
CREATE TABLE IF NOT EXISTS linkedin_optimizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resume_id uuid REFERENCES resumes(id),
  section varchar(50), -- headline|summary|experience|all
  original_text text,
  optimized_text text,
  improvement_notes jsonb,
  model_version varchar(100),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- F-012: LinkedIn posts
CREATE TABLE IF NOT EXISTS linkedin_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic text,
  tone varchar(50) DEFAULT 'professional',
  generated_content text,
  hook text,
  cta text,
  hashtags jsonb,
  voice_calibrated boolean DEFAULT false,
  scheduled_at timestamptz,
  status varchar(50) DEFAULT 'draft', -- draft|scheduled|published
  created_at timestamptz NOT NULL DEFAULT now()
);

-- F-013: Outreach messages / networking
CREATE TABLE IF NOT EXISTS outreach_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_name varchar(255),
  target_company varchar(255),
  target_role varchar(255),
  channel varchar(50) DEFAULT 'linkedin', -- linkedin|email|twitter
  draft_text text,
  context_used jsonb,  -- what info went into the draft
  model_version varchar(100),
  status varchar(50) DEFAULT 'draft', -- draft|sent|replied
  sent_at timestamptz,
  reply_received_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- F-015: Job monitors (passive monitoring + alerts)
CREATE TABLE IF NOT EXISTS job_monitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query_name varchar(255),
  keywords jsonb,
  target_companies jsonb,
  target_roles jsonb,
  locations jsonb,
  sources jsonb,   -- which job boards / adapters to search
  frequency varchar(20) DEFAULT 'daily', -- realtime|daily|weekly
  is_active boolean DEFAULT true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  matches_found integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- F-018: Application tracker
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_posting_id uuid,
  company_id uuid,
  company_name varchar(255),
  role_title varchar(255),
  job_url text,
  resume_id uuid REFERENCES resumes(id),
  tailored_resume_id uuid REFERENCES tailored_resumes(id),
  status varchar(50) DEFAULT 'wishlist',
  -- wishlist|applied|phone_screen|interview|offer|rejected|withdrawn|hired
  applied_at timestamptz,
  follow_up_due_at timestamptz,
  salary_offered_usd integer,
  notes text,
  outcome_logged boolean DEFAULT false,
  outcome_type varchar(50),  -- F-050 outcome logging
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- F-020: Follow-up cadence
CREATE TABLE IF NOT EXISTS follow_up_cadences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id uuid REFERENCES job_applications(id) ON DELETE CASCADE,
  step_number integer DEFAULT 1,
  channel varchar(50) DEFAULT 'email',
  draft_text text,
  scheduled_at timestamptz,
  sent_at timestamptz,
  status varchar(50) DEFAULT 'pending', -- pending|sent|skipped
  created_at timestamptz NOT NULL DEFAULT now()
);

-- F-022: Offer evaluations
CREATE TABLE IF NOT EXISTS offer_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id uuid REFERENCES job_applications(id),
  company_name varchar(255),
  role_title varchar(255),
  base_salary_usd integer,
  total_comp_usd integer,
  equity_details jsonb,
  benefits jsonb,
  location varchar(255),
  remote_policy varchar(50),
  evaluation_score integer,   -- 0–100
  pros jsonb,
  cons jsonb,
  negotiation_angles jsonb,
  counter_offer_suggestion jsonb,
  market_benchmark jsonb,
  model_version varchar(100),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- EMPLOYER DOMAIN
-- ---------------------------------------------------------------------------

-- F-030: Job postings (generated + published JDs)
CREATE TABLE IF NOT EXISTS job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title varchar(255) NOT NULL,
  level varchar(100),   -- junior|mid|senior|staff|principal|executive
  department varchar(255),
  location varchar(255),
  remote_policy varchar(50) DEFAULT 'hybrid', -- remote|hybrid|onsite
  salary_min_usd integer,
  salary_max_usd integer,
  currency varchar(10) DEFAULT 'USD',
  must_haves jsonb,
  nice_to_haves jsonb,
  generated_jd text,
  edited_jd text,
  inclusivity_flags jsonb,  -- F-031 bias check results
  required_skills jsonb,
  screening_enabled boolean DEFAULT false,  -- F-034 gate
  region varchar(10) DEFAULT 'global',
  status varchar(50) DEFAULT 'draft', -- draft|published|paused|closed
  published_at timestamptz,
  closes_at timestamptz,
  application_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- F-032: Matching results (ranked candidate→job matches)
CREATE TABLE IF NOT EXISTS matching_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id uuid NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES orgs(id),
  candidate_anonymized_id uuid NOT NULL,  -- trust wall: never real user_id to employer
  fit_score integer CHECK (fit_score BETWEEN 0 AND 100),
  band varchar(1),
  match_factors jsonb,   -- [{factor, weight, value, rationale}]
  model_version varchar(100),
  prompt_version varchar(100),
  consent_ref uuid,
  region varchar(10),
  is_hidden_gem boolean DEFAULT false,  -- F-035
  status varchar(50) DEFAULT 'pending_review', -- pending_review|shortlisted|rejected|screening
  shortlisted_at timestamptz,
  rejected_at timestamptz,
  rejected_by uuid,
  rejection_reason varchar(100),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- F-034: Screening sessions (GATE REQUIRED — never create without launch-gate checklist)
CREATE TABLE IF NOT EXISTS screening_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id uuid NOT NULL REFERENCES job_postings(id),
  org_id uuid NOT NULL REFERENCES orgs(id),
  candidate_anonymized_id uuid NOT NULL,
  consent_ref uuid NOT NULL REFERENCES consent_records(id),
  region varchar(10) NOT NULL,
  mode varchar(20) DEFAULT 'ai_interview', -- ai_interview|skills_test|combined
  rubric_id varchar(100),
  transcript_key text,          -- R2 key (deleted ≤30 days post-transcription)
  transcript_deleted_at timestamptz,
  scores jsonb,                 -- {dimension: {score, rationale}}
  overall_score integer,
  model_version varchar(100),
  prompt_version varchar(100),
  audit_log_id uuid,            -- reference to compliance audit_log entry
  human_reviewer_id uuid REFERENCES users(id),
  human_decision varchar(50),   -- advance|reject|hold (NEVER auto)
  human_decided_at timestamptz,
  status varchar(50) DEFAULT 'pending', -- pending|in_progress|scored|reviewed
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- F-038: Pipeline stages per org
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  job_posting_id uuid REFERENCES job_postings(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  order_index integer NOT NULL,
  stage_type varchar(50) DEFAULT 'custom',
  -- applied|screen|phone|interview|offer|hired|rejected
  is_default boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- F-038: Pipeline cards (candidate in pipeline)
CREATE TABLE IF NOT EXISTS pipeline_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  job_posting_id uuid NOT NULL REFERENCES job_postings(id),
  stage_id uuid NOT NULL REFERENCES pipeline_stages(id),
  candidate_anonymized_id uuid NOT NULL,
  matching_result_id uuid REFERENCES matching_results(id),
  screening_session_id uuid REFERENCES screening_sessions(id),
  scorecard jsonb,       -- [{reviewer_id, dimension, score, notes, ts}]
  notes text,
  moved_to_current_stage_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- F-039: Recruiting analytics snapshots
CREATE TABLE IF NOT EXISTS recruiting_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  job_posting_id uuid REFERENCES job_postings(id),
  period_start date NOT NULL,
  period_end date NOT NULL,
  ttf_days numeric(6,1),       -- time-to-fill
  cph_usd integer,             -- cost-per-hire
  applications_count integer,
  screenings_count integer,
  interviews_count integer,
  offers_count integer,
  hires_count integer,
  rejection_rate numeric(5,2),
  funnel_conversion jsonb,
  bias_flag_count integer DEFAULT 0,
  computed_at timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- ENGINE DOMAIN
-- ---------------------------------------------------------------------------

-- F-052: Company personas
CREATE TABLE IF NOT EXISTS company_personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE,
  company_name varchar(255),
  company_domain varchar(255),
  version varchar(50) DEFAULT '1.0',
  hiring_signals jsonb,
  culture_indicators jsonb,
  success_patterns jsonb,
  rejection_patterns jsonb,
  skill_preferences jsonb,
  seniority_preferences jsonb,
  interview_style jsonb,
  evidence_refs jsonb,        -- source documents that built this persona
  outcome_count integer DEFAULT 0,
  freshness_score numeric(5,2) DEFAULT 1.0,
  region varchar(10),
  last_research_at timestamptz,
  next_refresh_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- F-058: Job postings discovered externally (job discovery + adapter framework)
CREATE TABLE IF NOT EXISTS discovered_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_adapter varchar(100) NOT NULL,  -- linkedin|indeed|greenhouse|lever|workday|...
  external_id varchar(500),
  company_id uuid,
  company_name varchar(255),
  title varchar(500),
  location varchar(500),
  remote_policy varchar(50),
  salary_min_usd integer,
  salary_max_usd integer,
  jd_text text,
  jd_url text,
  legitimacy_tier varchar(20) DEFAULT 'unknown', -- F-059: verified|plausible|suspect|ghost
  legitimacy_score numeric(5,2),
  legitimacy_flags jsonb,
  is_active boolean DEFAULT true,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  UNIQUE(source_adapter, external_id)
);

-- ---------------------------------------------------------------------------
-- NOTIFICATIONS (F-090c, F-090e)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type varchar(100) NOT NULL,  -- job_match|diagnostic_ready|follow_up_due|application_update|...
  channel varchar(50) DEFAULT 'email', -- email|push|in_app
  title varchar(500),
  body text,
  payload jsonb,
  priority varchar(20) DEFAULT 'normal',
  is_read boolean DEFAULT false,
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- RLS: Enable on new tables (app code uses GUC session context)
-- ---------------------------------------------------------------------------
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE tailored_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE prep_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_cadences ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE matching_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_role;
GRANT SELECT, INSERT ON discovered_jobs TO app_role;

-- Re-apply critical REVOKE grants (002 GRANT ALL undid these from 001_rls_setup.sql)
-- audit_log: append-only — no UPDATE or DELETE for app_role (TC-080.2)
REVOKE UPDATE, DELETE ON audit_log FROM app_role;
-- consent_records: immutable once written (F-034.2)
REVOKE UPDATE, DELETE ON consent_records FROM app_role;
-- billing_ledger: double-entry immutable rows (F-073)
REVOKE UPDATE, DELETE ON billing_ledger FROM app_role;
-- screening_sessions: compliance record — no UPDATE by app_role
REVOKE UPDATE, DELETE ON screening_sessions FROM app_role;
