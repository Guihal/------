package dbtest

import (
	"os"
	"testing"
)

func TestMigrationsAndConstraints(t *testing.T) {
	db := OpenMigratedDB(t)
	defer db.Close()

	var tableCount int
	mustQueryRow(t, db, &tableCount, `SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'`)
	if tableCount < 20 {
		t.Fatalf("expected at least 20 public tables, got %d", tableCount)
	}

	userID := scalar(t, db, `INSERT INTO users (email, password_hash, role)
		VALUES ('owner@example.test', 'hash', 'user') RETURNING id`)
	categoryID := scalar(t, db, `INSERT INTO task_categories (user_id, title, color)
		VALUES ($1, 'Main', '#111827') RETURNING id`, userID)
	taskID := scalar(t, db, `INSERT INTO tasks (user_id, category_id, title)
		VALUES ($1, $2, 'Task') RETURNING id`, userID, categoryID)
	itemID := scalar(t, db, `INSERT INTO inventory_items
		(name, rarity, slot_key, asset_url, base_xp_multiplier)
		VALUES ('Constraint Cap', 'common', 'head', '/cap.png', 1) RETURNING id`)
	ownedID := scalar(t, db, `INSERT INTO user_inventory_items
		(user_id, inventory_item_id, rarity, source, xp_multiplier)
		VALUES ($1, $2, 'common', 'seed', 1.02) RETURNING id`, userID, itemID)

	mustFail(t, db, `INSERT INTO users (email, password_hash, role)
		VALUES ('bad@example.test', 'hash', 'owner')`)
	mustFail(t, db, `INSERT INTO progressions (user_id, xp_total, level)
		VALUES ($1, -1, 1)`, userID)
	mustFail(t, db, `INSERT INTO inventory_items
		(name, rarity, slot_key, asset_url) VALUES ('Bad Rarity', 'mythic', 'head', '/bad.png')`)
	mustFail(t, db, `INSERT INTO user_inventory_items
		(user_id, inventory_item_id, rarity, source, xp_multiplier)
		VALUES ($1, $2, 'common', 'seed', 1.09)`, userID, itemID)
	mustFail(t, db, `INSERT INTO user_inventory_items
		(user_id, inventory_item_id, rarity, source, xp_multiplier)
		VALUES ($1, $2, 'rare', 'seed', 1.10)`, userID, itemID)

	mustExec(t, db, `INSERT INTO task_xp_grants
		(user_id, task_id, base_xp, task_multiplier, equipment_xp_multiplier, final_xp)
		VALUES ($1, $2, 10, 1, 1, 10)`, userID, taskID)
	mustFail(t, db, `INSERT INTO task_xp_grants
		(user_id, task_id, base_xp, task_multiplier, equipment_xp_multiplier, final_xp)
		VALUES ($1, $2, 10, 1, 1, 10)`, userID, taskID)

	mustExec(t, db, `INSERT INTO task_reward_rolls
		(user_id, task_id, base_xp, task_multiplier, equipment_xp_multiplier, final_xp, drop_multiplier, roll_value)
		VALUES ($1, $2, 10, 1, 1, 10, 1, 0.5)`, userID, taskID)
	mustFail(t, db, `INSERT INTO task_reward_rolls
		(user_id, task_id, base_xp, task_multiplier, equipment_xp_multiplier, final_xp, drop_multiplier, roll_value)
		VALUES ($1, $2, 10, 1, 1, 10, 1, 0.6)`, userID, taskID)

	dropTaskID := scalar(t, db, `INSERT INTO tasks (user_id, category_id, title)
		VALUES ($1, $2, 'Drop Task') RETURNING id`, userID, categoryID)
	mustFail(t, db, `INSERT INTO task_reward_rolls
		(user_id, task_id, base_xp, task_multiplier, equipment_xp_multiplier,
		final_xp, drop_multiplier, roll_value, dropped_rarity, user_inventory_item_id)
		VALUES ($1, $2, 10, 1, 1, 10, 1, 0.7, 'rare', $3)`, userID, dropTaskID, ownedID)

	mustExec(t, db, `INSERT INTO level_rewards (user_id, level, user_inventory_item_id)
		VALUES ($1, 2, $2)`, userID, ownedID)
	mustFail(t, db, `INSERT INTO level_rewards (user_id, level, user_inventory_item_id)
		VALUES ($1, 2, $2)`, userID, ownedID)
}

func TestDemoSeedIsIdempotent(t *testing.T) {
	db := OpenMigratedDB(t)
	defer db.Close()
	seedBytes, err := os.ReadFile("../../seed/demo.sql")
	if err != nil {
		t.Fatalf("read seed: %v", err)
	}
	for range 2 {
		mustExec(t, db, string(seedBytes))
	}

	var users, items, taskCopies int
	mustQueryRow(t, db, &users, `SELECT count(*) FROM users WHERE email_normalized IN
		('admin@example.test', 'demo@example.test')`)
	mustQueryRow(t, db, &items, `SELECT count(*) FROM inventory_items`)
	mustQueryRow(t, db, &taskCopies, `SELECT count(*) FROM tasks WHERE title = 'Подготовить план задач'`)
	if users != 2 || items < 5 || taskCopies != 1 {
		t.Fatalf("seed not idempotent: users=%d items=%d taskCopies=%d", users, items, taskCopies)
	}
}
