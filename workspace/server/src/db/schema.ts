import { pool } from "./client.ts";

export const CREATE_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration: add xp_multiplier if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'xp_multiplier'
  ) THEN
    ALTER TABLE users ADD COLUMN xp_multiplier NUMERIC NOT NULL DEFAULT 1.0 CHECK (xp_multiplier > 0);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS sessions (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_hash ON sessions(refresh_token_hash);

CREATE TABLE IF NOT EXISTS audit_logs (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  details    JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

CREATE TABLE IF NOT EXISTS profiles (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS progressions (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  xp         INTEGER NOT NULL DEFAULT 0,
  level      INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  difficulty  TEXT NOT NULL DEFAULT 'normal' CHECK (difficulty IN ('low', 'normal', 'high')),
  category    TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'work', 'personal', 'health')),
  size        TEXT NOT NULL DEFAULT 'medium' CHECK (size IN ('tiny', 'small', 'medium', 'large')),
  deadline    TIMESTAMPTZ,
  completed   BOOLEAN NOT NULL DEFAULT FALSE,
  archived    BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_archived ON tasks(archived);

CREATE TABLE IF NOT EXISTS items (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  rarity      TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  asset_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration: add slots if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'slots'
  ) THEN
    ALTER TABLE items ADD COLUMN slots INTEGER NOT NULL DEFAULT 1 CHECK (slots > 0);
  END IF;
END $$;

-- Migration: add active column if missing (schema evolved after initial deploy)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'active'
  ) THEN
    ALTER TABLE items ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_items_rarity ON items(rarity);

-- Migration: add active column if missing (schema evolved after initial deploy)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'active'
  ) THEN
    ALTER TABLE items ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_items_active ON items(active);

CREATE TABLE IF NOT EXISTS level_rewards (
  id           SERIAL PRIMARY KEY,
  level        INTEGER NOT NULL UNIQUE CHECK (level > 0),
  reward_type  TEXT NOT NULL CHECK (reward_type IN ('item', 'currency', 'xp')),
  amount       INTEGER NOT NULL DEFAULT 1 CHECK (amount > 0),
  item_id      INTEGER REFERENCES items(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_level_rewards_level ON level_rewards(level);

CREATE TABLE IF NOT EXISTS task_reward_rolls (
  id          SERIAL PRIMARY KEY,
  task_id     INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  item_id     INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  probability NUMERIC NOT NULL CHECK (probability >= 0 AND probability <= 1),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_task_reward_rolls_task_id ON task_reward_rolls(task_id);

CREATE TABLE IF NOT EXISTS task_drops (
  id          SERIAL PRIMARY KEY,
  task_id     INTEGER NOT NULL UNIQUE REFERENCES tasks(id) ON DELETE CASCADE,
  item_id     INTEGER REFERENCES items(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_drops_task_id ON task_drops(task_id);

CREATE TABLE IF NOT EXISTS user_items (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id     INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  equipped    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_user_items_user_id ON user_items(user_id);
CREATE INDEX IF NOT EXISTS idx_user_items_equipped ON user_items(user_id) WHERE equipped = TRUE;
`;

export async function migrate(): Promise<void> {
  await pool.query(CREATE_SCHEMA_SQL);
}
