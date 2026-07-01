WITH upsert_users AS (
  INSERT INTO users (email, password_hash, role)
  VALUES
    ('admin@example.test', '$demo$change-me-admin-password-hash', 'admin'),
    ('demo@example.test', '$demo$change-me-demo-password-hash', 'user')
  ON CONFLICT (email_normalized) DO NOTHING
  RETURNING id, email_normalized
),
all_users AS (
  SELECT id, email_normalized FROM upsert_users
  UNION
  SELECT id, email_normalized FROM users
  WHERE email_normalized IN ('admin@example.test', 'demo@example.test')
),
profiles_seed AS (
  INSERT INTO profiles (user_id, display_name, avatar_url)
  SELECT id,
    CASE email_normalized WHEN 'admin@example.test' THEN 'Admin' ELSE 'Demo User' END,
    NULL
  FROM all_users
  ON CONFLICT (user_id) DO NOTHING
),
progressions_seed AS (
  INSERT INTO progressions (user_id, xp_total, level)
  SELECT id, 0, 1 FROM all_users
  ON CONFLICT (user_id) DO NOTHING
),
notification_seed AS (
  INSERT INTO notification_settings (user_id, enabled, default_minutes_before_deadline)
  SELECT id, true, 60 FROM all_users
  ON CONFLICT (user_id) DO NOTHING
),
mascot_seed AS (
  INSERT INTO mascots (name, asset_url, is_default, active)
  VALUES ('Task Buddy', '/assets/mascots/task-buddy.png', true, true)
  ON CONFLICT (name) DO UPDATE
    SET asset_url = excluded.asset_url, is_default = true, active = true, updated_at = now()
  RETURNING id
),
default_mascot AS (
  SELECT id FROM mascot_seed
  UNION
  SELECT id FROM mascots WHERE name = 'Task Buddy'
),
user_mascots_seed AS (
  INSERT INTO user_mascots (user_id, mascot_id, is_active)
  SELECT all_users.id, default_mascot.id, true
  FROM all_users CROSS JOIN default_mascot
  WHERE NOT EXISTS (
    SELECT 1 FROM user_mascots existing
    WHERE existing.user_id = all_users.id AND existing.is_active
  )
  ON CONFLICT (user_id, mascot_id) DO NOTHING
),
slot_values (slot_key, title, anchor_json) AS (
  VALUES
    ('head', 'Head', '{"x":0.50,"y":0.16,"scale":1.00}'::jsonb),
    ('face', 'Face', '{"x":0.50,"y":0.30,"scale":0.80}'::jsonb),
    ('body', 'Body', '{"x":0.50,"y":0.56,"scale":1.00}'::jsonb),
    ('hand', 'Hand', '{"x":0.72,"y":0.58,"scale":0.70}'::jsonb),
    ('background', 'Background', '{"x":0.50,"y":0.50,"scale":1.00}'::jsonb)
),
slots_seed AS (
  INSERT INTO mascot_slots (mascot_id, slot_key, title, anchor_json)
  SELECT default_mascot.id, slot_values.slot_key, slot_values.title, slot_values.anchor_json
  FROM default_mascot CROSS JOIN slot_values
  ON CONFLICT (mascot_id, slot_key) DO UPDATE
    SET title = excluded.title, anchor_json = excluded.anchor_json, updated_at = now()
),
item_values (name, description, rarity, slot_key, asset_url, base_xp_multiplier) AS (
  VALUES
    ('Starter Cap', 'Common head item for demo users.', 'common', 'head', '/assets/items/starter-cap.png', 1.020),
    ('Focus Glasses', 'Rare face item with a small XP bonus.', 'rare', 'face', '/assets/items/focus-glasses.png', 1.100),
    ('Momentum Hoodie', 'Epic body item for longer tasks.', 'epic', 'body', '/assets/items/momentum-hoodie.png', 1.250),
    ('Legend Quill', 'Legendary hand item for milestone rewards.', 'legendary', 'hand', '/assets/items/legend-quill.png', 1.500),
    ('Calm Workspace', 'Common background item.', 'common', 'background', '/assets/items/calm-workspace.png', 1.020)
),
items_seed AS (
  INSERT INTO inventory_items (name, description, rarity, slot_key, asset_url, base_xp_multiplier, active)
  SELECT name, description, rarity, slot_key, asset_url, base_xp_multiplier, true FROM item_values
  ON CONFLICT (name) DO UPDATE
    SET description = excluded.description,
        rarity = excluded.rarity,
        slot_key = excluded.slot_key,
        asset_url = excluded.asset_url,
        base_xp_multiplier = excluded.base_xp_multiplier,
        active = true,
        updated_at = now()
  RETURNING id, name, rarity, base_xp_multiplier
),
seed_item AS (
  SELECT id, name, rarity, base_xp_multiplier FROM items_seed
  WHERE name IN ('Starter Cap', 'Momentum Hoodie')
  UNION
  SELECT id, name, rarity, base_xp_multiplier FROM inventory_items
  WHERE name IN ('Starter Cap', 'Momentum Hoodie')
),
user_items_seed AS (
  INSERT INTO user_inventory_items (user_id, inventory_item_id, rarity, source, xp_multiplier)
  SELECT all_users.id, seed_item.id, seed_item.rarity, 'seed', seed_item.base_xp_multiplier
  FROM all_users CROSS JOIN seed_item
  WHERE NOT EXISTS (
    SELECT 1 FROM user_inventory_items owned
    WHERE owned.user_id = all_users.id
      AND owned.inventory_item_id = seed_item.id
      AND owned.source = 'seed'
  )
),
category_values (title, color, is_system) AS (
  VALUES
    ('Учеба', '#4f46e5', true),
    ('Работа', '#0891b2', true),
    ('Личное', '#16a34a', true),
    ('общее', '#6b7280', true)
),
categories_seed AS (
  INSERT INTO task_categories (user_id, title, color, is_system)
  SELECT all_users.id, category_values.title, category_values.color, category_values.is_system
  FROM all_users CROSS JOIN category_values
  ON CONFLICT (user_id, title) DO NOTHING
),
settings_values (key, value) AS (
  VALUES
    ('reduced_motion', '{"enabled":false}'::jsonb),
    ('disable_visual_randomness', '{"enabled":false}'::jsonb),
    ('notifications_enabled', '{"enabled":true}'::jsonb),
    ('default_reminder_minutes_before_deadline', '{"minutes":60}'::jsonb)
),
settings_seed AS (
  INSERT INTO settings (user_id, key, value)
  SELECT all_users.id, settings_values.key, settings_values.value
  FROM all_users CROSS JOIN settings_values
  ON CONFLICT (user_id, key) DO NOTHING
),
visual_values (scope, key, value) AS (
  VALUES
    ('mobile', 'accent_color', '{"value":"#7dd3fc"}'::jsonb),
    ('mobile', 'background_variant', '{"value":"dark-ember"}'::jsonb),
    ('mobile', 'task_button_text', '{"value":"Добавить задачу"}'::jsonb),
    ('mobile', 'task_list_heading', '{"value":"План на сегодня"}'::jsonb),
    ('mobile', 'profile_background', '{"value":"quiet-grid"}'::jsonb)
),
visual_seed AS (
  INSERT INTO visual_state (user_id, scope, key, value)
  SELECT all_users.id, visual_values.scope, visual_values.key, visual_values.value
  FROM all_users CROSS JOIN visual_values
  ON CONFLICT (user_id, scope, key) DO NOTHING
)
INSERT INTO tasks (user_id, category_id, title, description, priority, complexity, deadline_at)
SELECT demo.id, cat.id, task_values.title, task_values.description,
       task_values.priority, task_values.complexity, task_values.deadline_at
FROM (SELECT id FROM all_users WHERE email_normalized = 'demo@example.test') demo
JOIN task_categories cat ON cat.user_id = demo.id AND cat.title = 'Учеба'
CROSS JOIN (
  VALUES
    ('Подготовить план задач', 'Демо-задача для первого экрана.', 'normal', 'small', now() + interval '1 day'),
    ('Закрыть первый milestone', 'Демо-задача для проверки XP flow.', 'high', 'medium', now() + interval '3 days')
) AS task_values(title, description, priority, complexity, deadline_at)
WHERE NOT EXISTS (
  SELECT 1 FROM tasks existing
  WHERE existing.user_id = demo.id AND existing.title = task_values.title
);
