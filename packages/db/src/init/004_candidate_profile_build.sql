-- =============================================================================
-- 004 — F-003 career profile builder: structured build columns on candidate_profiles.
-- Idempotent. One master profile per user (candidate_profiles.user_id is UNIQUE).
-- =============================================================================

ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS experience jsonb NOT NULL DEFAULT '[]';
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS education jsonb NOT NULL DEFAULT '[]';
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS keywords jsonb NOT NULL DEFAULT '[]';
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS recommendations jsonb NOT NULL DEFAULT '[]';
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS conflicts jsonb NOT NULL DEFAULT '[]';
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS parsed_text text;

GRANT SELECT, INSERT, UPDATE ON candidate_profiles TO app_role;
