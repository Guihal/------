-- +goose Up
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  email_normalized text GENERATED ALWAYS AS (lower(btrim(email))) STORED,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_not_blank CHECK (btrim(email) <> ''),
  CONSTRAINT users_email_normalized_unique UNIQUE (email_normalized)
);

CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_user_unique UNIQUE (user_id),
  CONSTRAINT profiles_display_name_not_blank CHECK (btrim(display_name) <> '')
);

CREATE TABLE progressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  xp_total integer NOT NULL DEFAULT 0 CHECK (xp_total >= 0),
  level integer NOT NULL DEFAULT 1 CHECK (level >= 1),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT progressions_user_unique UNIQUE (user_id)
);

CREATE TABLE task_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  color text NOT NULL,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT task_categories_user_id_id_unique UNIQUE (user_id, id),
  CONSTRAINT task_categories_user_title_unique UNIQUE (user_id, title),
  CONSTRAINT task_categories_title_not_blank CHECK (btrim(title) <> '')
);

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id uuid,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  complexity text NOT NULL DEFAULT 'small' CHECK (complexity IN ('tiny', 'small', 'medium', 'large')),
  deadline_at timestamptz,
  completed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tasks_user_id_id_unique UNIQUE (user_id, id),
  CONSTRAINT tasks_category_owner_fk FOREIGN KEY (user_id, category_id)
    REFERENCES task_categories(user_id, id) ON DELETE RESTRICT,
  CONSTRAINT tasks_title_not_blank CHECK (btrim(title) <> '')
);

CREATE TABLE task_xp_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL,
  base_xp integer NOT NULL CHECK (base_xp >= 0),
  task_multiplier numeric(6,3) NOT NULL CHECK (task_multiplier >= 0),
  equipment_xp_multiplier numeric(6,3) NOT NULL CHECK (equipment_xp_multiplier >= 0),
  final_xp integer NOT NULL CHECK (final_xp >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT task_xp_grants_task_unique UNIQUE (task_id),
  CONSTRAINT task_xp_grants_task_owner_fk FOREIGN KEY (user_id, task_id)
    REFERENCES tasks(user_id, id) ON DELETE CASCADE
);

CREATE TABLE mascots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  asset_url text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mascots_name_unique UNIQUE (name),
  CONSTRAINT mascots_name_not_blank CHECK (btrim(name) <> '')
);

CREATE UNIQUE INDEX mascots_single_default_idx ON mascots(is_default) WHERE is_default;

CREATE TABLE user_mascots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mascot_id uuid NOT NULL REFERENCES mascots(id) ON DELETE RESTRICT,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_mascots_user_mascot_unique UNIQUE (user_id, mascot_id)
);

CREATE UNIQUE INDEX user_mascots_active_unique_idx ON user_mascots(user_id) WHERE is_active;

CREATE TABLE mascot_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mascot_id uuid NOT NULL REFERENCES mascots(id) ON DELETE CASCADE,
  slot_key text NOT NULL,
  title text NOT NULL,
  anchor_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mascot_slots_mascot_slot_unique UNIQUE (mascot_id, slot_key),
  CONSTRAINT mascot_slots_slot_not_blank CHECK (btrim(slot_key) <> ''),
  CONSTRAINT mascot_slots_anchor_object CHECK (jsonb_typeof(anchor_json) = 'object')
);

CREATE TABLE inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  rarity text NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  slot_key text NOT NULL,
  asset_url text NOT NULL,
  base_xp_multiplier numeric(6,3) NOT NULL DEFAULT 1 CHECK (base_xp_multiplier >= 1),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inventory_items_name_unique UNIQUE (name),
  CONSTRAINT inventory_items_id_rarity_unique UNIQUE (id, rarity),
  CONSTRAINT inventory_items_slot_not_blank CHECK (btrim(slot_key) <> '')
);

CREATE TABLE user_inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  inventory_item_id uuid NOT NULL,
  rarity text NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  source text NOT NULL CHECK (source IN ('seed', 'task_drop', 'level_reward', 'admin_grant')),
  source_task_id uuid,
  source_level integer CHECK (source_level IS NULL OR source_level >= 1),
  xp_multiplier numeric(6,3) NOT NULL,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_inventory_items_user_id_id_unique UNIQUE (user_id, id),
  CONSTRAINT user_inventory_items_user_id_id_rarity_unique UNIQUE (user_id, id, rarity),
  CONSTRAINT user_inventory_items_item_rarity_fk FOREIGN KEY (inventory_item_id, rarity)
    REFERENCES inventory_items(id, rarity) ON DELETE RESTRICT,
  CONSTRAINT user_inventory_items_task_owner_fk FOREIGN KEY (user_id, source_task_id)
    REFERENCES tasks(user_id, id) ON DELETE RESTRICT,
  CONSTRAINT user_inventory_items_rarity_multiplier_range CHECK (
    (rarity = 'common' AND xp_multiplier >= 1.020 AND xp_multiplier <= 1.080) OR
    (rarity = 'rare' AND xp_multiplier >= 1.080 AND xp_multiplier <= 1.160) OR
    (rarity = 'epic' AND xp_multiplier >= 1.160 AND xp_multiplier <= 1.280) OR
    (rarity = 'legendary' AND xp_multiplier >= 1.280 AND xp_multiplier <= 1.450)
  ),
  CONSTRAINT user_inventory_items_source_shape CHECK (
    (source = 'task_drop' AND source_task_id IS NOT NULL AND source_level IS NULL) OR
    (source = 'level_reward' AND source_task_id IS NULL AND source_level IS NOT NULL) OR
    (source IN ('seed', 'admin_grant') AND source_task_id IS NULL)
  )
);

CREATE TABLE equipped_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_inventory_item_id uuid NOT NULL,
  slot_key text NOT NULL,
  equipped_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT equipped_items_user_slot_unique UNIQUE (user_id, slot_key),
  CONSTRAINT equipped_items_inventory_owner_fk FOREIGN KEY (user_id, user_inventory_item_id)
    REFERENCES user_inventory_items(user_id, id) ON DELETE CASCADE
);

CREATE TABLE level_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level integer NOT NULL CHECK (level >= 1),
  user_inventory_item_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT level_rewards_user_level_unique UNIQUE (user_id, level),
  CONSTRAINT level_rewards_inventory_owner_fk FOREIGN KEY (user_id, user_inventory_item_id)
    REFERENCES user_inventory_items(user_id, id) ON DELETE RESTRICT
);

CREATE TABLE task_reward_rolls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL,
  base_xp integer NOT NULL CHECK (base_xp >= 0),
  task_multiplier numeric(6,3) NOT NULL CHECK (task_multiplier >= 0),
  equipment_xp_multiplier numeric(6,3) NOT NULL CHECK (equipment_xp_multiplier >= 0),
  final_xp integer NOT NULL CHECK (final_xp >= 0),
  drop_multiplier numeric(6,3) NOT NULL CHECK (drop_multiplier >= 0),
  roll_value numeric(8,7) NOT NULL CHECK (roll_value >= 0 AND roll_value < 1),
  dropped_rarity text CHECK (dropped_rarity IN ('common', 'rare', 'epic', 'legendary')),
  user_inventory_item_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT task_reward_rolls_task_unique UNIQUE (task_id),
  CONSTRAINT task_reward_rolls_task_owner_fk FOREIGN KEY (user_id, task_id)
    REFERENCES tasks(user_id, id) ON DELETE CASCADE,
  CONSTRAINT task_reward_rolls_inventory_owner_fk FOREIGN KEY (user_id, user_inventory_item_id)
    REFERENCES user_inventory_items(user_id, id) ON DELETE RESTRICT,
  CONSTRAINT task_reward_rolls_inventory_rarity_fk FOREIGN KEY (user_id, user_inventory_item_id, dropped_rarity)
    REFERENCES user_inventory_items(user_id, id, rarity) ON DELETE RESTRICT,
  CONSTRAINT task_reward_rolls_drop_shape CHECK (
    (dropped_rarity IS NULL AND user_inventory_item_id IS NULL) OR
    (dropped_rarity IS NOT NULL AND user_inventory_item_id IS NOT NULL)
  )
);

CREATE TABLE notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  default_minutes_before_deadline integer NOT NULL DEFAULT 60 CHECK (default_minutes_before_deadline >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_settings_user_unique UNIQUE (user_id)
);

CREATE TABLE task_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL,
  remind_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT task_reminders_task_owner_fk FOREIGN KEY (user_id, task_id)
    REFERENCES tasks(user_id, id) ON DELETE CASCADE
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  details_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_action_not_blank CHECK (btrim(action) <> ''),
  CONSTRAINT audit_logs_details_object CHECK (jsonb_typeof(details_json) = 'object')
);

CREATE TABLE visual_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scope text NOT NULL,
  key text NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT visual_state_user_scope_key_unique UNIQUE (user_id, scope, key),
  CONSTRAINT visual_state_value_object CHECK (jsonb_typeof(value) = 'object')
);

CREATE TABLE settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT settings_user_key_unique UNIQUE (user_id, key)
);

CREATE INDEX users_email_normalized_idx ON users(email_normalized);
CREATE INDEX sessions_user_active_idx ON sessions(user_id, revoked_at, expires_at);
CREATE INDEX sessions_refresh_token_hash_idx ON sessions(refresh_token_hash);
CREATE INDEX tasks_user_status_due_idx ON tasks(user_id, status, deadline_at);
CREATE INDEX tasks_user_category_idx ON tasks(user_id, category_id);
CREATE INDEX tasks_admin_status_created_idx ON tasks(status, created_at);
CREATE INDEX users_admin_role_created_idx ON users(role, created_at);
CREATE INDEX inventory_items_admin_rarity_active_idx ON inventory_items(rarity, active, created_at);
CREATE INDEX audit_logs_user_action_created_idx ON audit_logs(user_id, action, created_at);
CREATE INDEX audit_logs_admin_action_created_idx ON audit_logs(action, created_at);
CREATE INDEX task_reward_rolls_user_task_idx ON task_reward_rolls(user_id, task_id);
CREATE INDEX user_inventory_items_user_item_idx ON user_inventory_items(user_id, inventory_item_id);
CREATE INDEX task_reminders_user_status_remind_idx ON task_reminders(user_id, status, remind_at);

-- +goose Down
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS visual_state;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS task_reminders;
DROP TABLE IF EXISTS notification_settings;
DROP TABLE IF EXISTS task_reward_rolls;
DROP TABLE IF EXISTS level_rewards;
DROP TABLE IF EXISTS equipped_items;
DROP TABLE IF EXISTS user_inventory_items;
DROP TABLE IF EXISTS inventory_items;
DROP TABLE IF EXISTS mascot_slots;
DROP TABLE IF EXISTS user_mascots;
DROP TABLE IF EXISTS mascots;
DROP TABLE IF EXISTS task_xp_grants;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS task_categories;
DROP TABLE IF EXISTS progressions;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;
