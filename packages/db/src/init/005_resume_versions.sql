-- =============================================================================
-- 005 — F-004 chat-driven résumé editing: append-only version chain + undo/redo cursor.
-- Idempotent. The version chain is the source of truth; the cursor is the editor head.
-- =============================================================================

-- Append-only version chain (FRD §4.4.8). One row per edit; never mutated after insert.
CREATE TABLE IF NOT EXISTS resume_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id uuid NOT NULL,                                   -- logical résumé being edited (tailored_resumes/resumes)
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  version_no integer NOT NULL,                               -- monotonic per résumé
  parent_version_id uuid REFERENCES resume_versions(id) ON DELETE SET NULL,
  content text NOT NULL,
  change_note text,                                          -- "what changed + why" (FR-004.4)
  mode_applied varchar(40),                                  -- quick_tweak|rebuild_section|full_rebuild|seed
  instruction text,
  instruction_hash varchar(64),                             -- idempotency on (resume_id, parent, hash)
  section varchar(120),
  diff jsonb,                                                -- {added, removed, changed}
  fabrication_scan_passed boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- BR-004.1: optimistic concurrency — only one child per (résumé, version_no).
  -- A stale edit computing the same next version_no collides → caller maps to 409 EDIT_CONFLICT.
  CONSTRAINT resume_versions_resume_version_uq UNIQUE (resume_id, version_no)
);

CREATE INDEX IF NOT EXISTS resume_versions_resume_idx ON resume_versions (resume_id);
CREATE INDEX IF NOT EXISTS resume_versions_user_idx   ON resume_versions (user_id);
-- Concurrent identical edits are idempotent (FRD §4.4.10): same base + same instruction → one child.
CREATE UNIQUE INDEX IF NOT EXISTS resume_versions_idem_uq
  ON resume_versions (resume_id, parent_version_id, instruction_hash)
  WHERE instruction_hash IS NOT NULL;

-- Editor head: current position + tip (furthest-forward) for undo/redo navigation (FR-004.4).
CREATE TABLE IF NOT EXISTS resume_edit_cursor (
  resume_id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_version_id uuid NOT NULL REFERENCES resume_versions(id),
  tip_version_id uuid NOT NULL REFERENCES resume_versions(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS resume_edit_cursor_user_idx ON resume_edit_cursor (user_id);

-- ---------------------------------------------------------------------------
-- RLS — candidate-private (trust wall F-060). GUC-scoped to the owner.
-- ---------------------------------------------------------------------------
ALTER TABLE resume_versions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_edit_cursor ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS resume_versions_owner_rls ON resume_versions;
CREATE POLICY resume_versions_owner_rls ON resume_versions
  USING (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid)
  WITH CHECK (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid);

DROP POLICY IF EXISTS resume_edit_cursor_owner_rls ON resume_edit_cursor;
CREATE POLICY resume_edit_cursor_owner_rls ON resume_edit_cursor
  USING (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid)
  WITH CHECK (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid);

-- The version chain is APPEND-ONLY: app_role may read + insert, never update/delete (integrity).
GRANT SELECT, INSERT ON resume_versions TO app_role;
REVOKE UPDATE, DELETE ON resume_versions FROM app_role;
-- The cursor moves with undo/redo, so it is mutable.
GRANT SELECT, INSERT, UPDATE, DELETE ON resume_edit_cursor TO app_role;
