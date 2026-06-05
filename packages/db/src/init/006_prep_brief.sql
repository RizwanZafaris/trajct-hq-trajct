-- =============================================================================
-- 006 — F-007 interview prep: brief columns on prep_sessions (the brief is grounded
-- in the company persona; confidence='low' marks thin research). Idempotent.
-- =============================================================================

ALTER TABLE prep_sessions ADD COLUMN IF NOT EXISTS brief jsonb;             -- {questions, format, values, frameworks}
ALTER TABLE prep_sessions ADD COLUMN IF NOT EXISTS cites jsonb NOT NULL DEFAULT '[]';
ALTER TABLE prep_sessions ADD COLUMN IF NOT EXISTS confidence varchar(10);  -- high|med|low (low = thin research)
ALTER TABLE prep_sessions ADD COLUMN IF NOT EXISTS star_mappings jsonb NOT NULL DEFAULT '[]';
ALTER TABLE prep_sessions ADD COLUMN IF NOT EXISTS notes jsonb NOT NULL DEFAULT '[]';
ALTER TABLE prep_sessions ADD COLUMN IF NOT EXISTS insider_declined boolean NOT NULL DEFAULT false;
ALTER TABLE prep_sessions ADD COLUMN IF NOT EXISTS target varchar(255);
ALTER TABLE prep_sessions ADD COLUMN IF NOT EXISTS error_code varchar(100);

-- A free-text target (no known company) is allowed (FRD §4.7.6: company_id OR target).
ALTER TABLE prep_sessions ALTER COLUMN company_id DROP NOT NULL;

GRANT SELECT, INSERT, UPDATE ON prep_sessions TO app_role;
