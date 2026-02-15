-- Long-Running Agentic Framework — Database Schema
-- SQLite, zero-config, single file

CREATE TABLE IF NOT EXISTS features (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending', 'in-dev', 'ready-for-review', 'approved', 'needs-revision', 'qa-testing', 'pr-open', 'complete')),
  depends_on TEXT NOT NULL DEFAULT '[]',          -- JSON array of feature IDs
  openspec_reference TEXT NOT NULL DEFAULT '',
  requirements TEXT NOT NULL DEFAULT '[]',         -- JSON array of strings
  architecture_compliance TEXT NOT NULL DEFAULT '[]', -- JSON array of principle IDs
  verification_steps TEXT NOT NULL DEFAULT '[]',   -- JSON array of strings
  assigned_to TEXT NOT NULL DEFAULT 'dev-agent',
  reviewed_by TEXT NOT NULL DEFAULT 'code-reviewer',
  tested_by TEXT NOT NULL DEFAULT 'qa-agent',
  passes INTEGER NOT NULL DEFAULT 0,              -- 0 = false, 1 = true
  openspec_change_id TEXT NOT NULL DEFAULT '',    -- OpenSpec change name for upsert
  openspec_task_group INTEGER NOT NULL DEFAULT 0, -- Task group index within change
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_number INTEGER NOT NULL,
  agent_role TEXT NOT NULL,
  feature_id TEXT,
  outcome TEXT NOT NULL DEFAULT '',               -- APPROVED, REJECTED, PASSED, FAILED, IMPLEMENTED, etc.
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (feature_id) REFERENCES features(id)
);

CREATE TABLE IF NOT EXISTS architecture (
  id TEXT PRIMARY KEY,                            -- 'principles', 'patterns', 'standards'
  data TEXT NOT NULL DEFAULT '{}',                -- JSON blob, full file content
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Unique constraint for OpenSpec upsert (only when both fields are non-empty)
-- SQLite partial index: only enforced when openspec_change_id is not empty
CREATE UNIQUE INDEX IF NOT EXISTS idx_openspec_upsert
  ON features(openspec_change_id, openspec_task_group)
  WHERE openspec_change_id != '';

-- Default config
INSERT OR IGNORE INTO config (key, value) VALUES ('execution_mode', 'team');
INSERT OR IGNORE INTO config (key, value) VALUES ('model', 'claude-sonnet-4-5-20250929');
INSERT OR IGNORE INTO config (key, value) VALUES ('max_retries', '3');
INSERT OR IGNORE INTO config (key, value) VALUES ('max_agent_turns', '50');
INSERT OR IGNORE INTO config (key, value) VALUES ('features_per_lead_session', '5');
INSERT OR IGNORE INTO config (key, value) VALUES ('auto_merge', 'false');
INSERT OR IGNORE INTO config (key, value) VALUES ('safe_mode', 'true');
INSERT OR IGNORE INTO config (key, value) VALUES ('openspec_auto_archive', 'false');
INSERT OR IGNORE INTO config (key, value) VALUES ('openspec_auto_import', 'false');

-- Trigger to auto-update updated_at on features
CREATE TRIGGER IF NOT EXISTS features_updated_at
  AFTER UPDATE ON features
  FOR EACH ROW
BEGIN
  UPDATE features SET updated_at = datetime('now') WHERE id = OLD.id;
END;
