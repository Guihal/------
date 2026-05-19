CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profile (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS progression (
  profile_id TEXT PRIMARY KEY,
  level INTEGER NOT NULL CHECK (level >= 1),
  xp_total INTEGER NOT NULL CHECK (xp_total >= 0),
  updated_at TEXT NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'archived')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high')),
  complexity TEXT NOT NULL CHECK (complexity IN ('tiny', 'small', 'medium', 'large')),
  complexity_source TEXT NOT NULL CHECK (complexity_source IN ('suggested', 'manual')),
  due_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  archived_at TEXT,
  FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_profile_id ON tasks(profile_id, id);
CREATE INDEX IF NOT EXISTS idx_tasks_profile_status_due_at ON tasks(profile_id, status, due_at);
CREATE INDEX IF NOT EXISTS idx_tasks_profile_created_at ON tasks(profile_id, created_at);
