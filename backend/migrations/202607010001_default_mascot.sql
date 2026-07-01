-- +goose Up
-- Seeds the "Task Buddy" default mascot catalog row + its slots (production
-- reference data, not demo/test fixtures), and backfills a default active
-- mascot for any existing user who doesn't have one yet. New registrations
-- get this via internal/authrepo.insertBaselines; this migration only
-- covers users created before that code shipped.
WITH mascot_seed AS (
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
)
INSERT INTO user_mascots (user_id, mascot_id, is_active)
SELECT users.id, default_mascot.id, true
FROM users CROSS JOIN default_mascot
WHERE NOT EXISTS (
  SELECT 1 FROM user_mascots existing
  WHERE existing.user_id = users.id AND existing.is_active
)
ON CONFLICT (user_id, mascot_id) DO NOTHING;

-- +goose Down
DELETE FROM user_mascots WHERE mascot_id = (SELECT id FROM mascots WHERE name = 'Task Buddy');
DELETE FROM mascot_slots WHERE mascot_id = (SELECT id FROM mascots WHERE name = 'Task Buddy');
DELETE FROM mascots WHERE name = 'Task Buddy';
