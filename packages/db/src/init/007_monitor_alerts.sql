-- =============================================================================
-- 007 — F-015 passive monitoring: monitor config (snooze/pause/threshold/cap) + an
-- append-only alert ledger for dedupe (content+URL hash) and the daily fair-use cap. Idempotent.
-- =============================================================================

ALTER TABLE job_monitors ADD COLUMN IF NOT EXISTS filters jsonb NOT NULL DEFAULT '{}';
ALTER TABLE job_monitors ADD COLUMN IF NOT EXISTS fit_threshold varchar(1) NOT NULL DEFAULT 'B';   -- A|B|C (min band to alert)
ALTER TABLE job_monitors ADD COLUMN IF NOT EXISTS alert_cap_per_day integer NOT NULL DEFAULT 5;    -- instant cap; over → digest
ALTER TABLE job_monitors ADD COLUMN IF NOT EXISTS cap_mode varchar(10) NOT NULL DEFAULT 'instant'; -- instant|digest
ALTER TABLE job_monitors ADD COLUMN IF NOT EXISTS paused boolean NOT NULL DEFAULT false;
ALTER TABLE job_monitors ADD COLUMN IF NOT EXISTS snooze_until timestamptz;

-- Alert ledger: dedupe + cap + the surfaced "why it fits". Never auto-applies (surface-only, FR-015.9).
CREATE TABLE IF NOT EXISTS job_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id uuid REFERENCES job_monitors(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_hash varchar(64) NOT NULL,          -- dedupe key (content + URL)
  role_url text,
  role jsonb,                                  -- {company, title, url, legitimacy_tier}
  fit_band varchar(1),
  why_it_fits text,
  status varchar(20) NOT NULL DEFAULT 'dispatched', -- dispatched|batched
  created_at timestamptz NOT NULL DEFAULT now(),
  -- BR-015.3 — the same role is never alerted twice for a user (content+URL hash).
  CONSTRAINT job_alerts_user_hash_uq UNIQUE (user_id, content_hash)
);
CREATE INDEX IF NOT EXISTS job_alerts_user_day_idx ON job_alerts (user_id, created_at);

ALTER TABLE job_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS job_alerts_owner_rls ON job_alerts;
CREATE POLICY job_alerts_owner_rls ON job_alerts
  USING (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid)
  WITH CHECK (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON job_monitors TO app_role;
GRANT SELECT, INSERT ON job_alerts TO app_role;       -- append-only ledger
REVOKE UPDATE, DELETE ON job_alerts FROM app_role;
