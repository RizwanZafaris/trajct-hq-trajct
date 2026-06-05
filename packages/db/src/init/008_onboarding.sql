-- =============================================================================
-- 008 — F-091c onboarding / first-run: a resumable cursor + an onboarded marker.
-- The owner/first user is exempt (onboarded_at backfilled). Idempotent.
-- =============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;

-- [BR-091c.3] Backfill the owner / any pre-existing user — they predate onboarding, so exempt.
UPDATE users SET onboarded_at = created_at WHERE onboarded_at IS NULL;

-- Resumable cursor (one per user). data carries per-step inputs (kept candidate-private).
CREATE TABLE IF NOT EXISTS onboarding_state (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_step varchar(20) NOT NULL DEFAULT 'welcome',
  completed_steps jsonb NOT NULL DEFAULT '[]',
  data jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE onboarding_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS onboarding_state_owner_rls ON onboarding_state;
CREATE POLICY onboarding_state_owner_rls ON onboarding_state
  USING (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid)
  WITH CHECK (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON onboarding_state TO app_role;
