-- =============================================================================
-- 009 — F-093c DSAR (data portability / delete): request tracking for SLA + dedup.
-- The request record survives a user delete (user_id ON DELETE SET NULL) for audit. Idempotent.
-- =============================================================================

CREATE TABLE IF NOT EXISTS dsar_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,     -- nulled when the user is erased (audit survives)
  request_type varchar(10) NOT NULL,                        -- export | delete
  status varchar(20) NOT NULL DEFAULT 'processing',         -- processing | completed | failed
  residual_pii_count integer,
  anonymized_outcome_count integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS dsar_requests_user_idx ON dsar_requests (user_id, request_type, status);

-- dsar_requests is a compliance audit record — app_role appends + reads, never deletes.
GRANT SELECT, INSERT, UPDATE ON dsar_requests TO app_role;
REVOKE DELETE ON dsar_requests FROM app_role;
