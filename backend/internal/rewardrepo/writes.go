package rewardrepo

import (
	"context"
	"database/sql"
	"math"
	"strconv"

	"taskcompanion/backend/internal/reward"
)

// milestoneRarity is the rarity granted on level%5 milestones.
// Spec leaves the specific item open; legendary matches the seed's
// "Legend Quill — Legendary hand item for milestone rewards".
// ponytail: single milestone item for all %5 levels; vary per level if desired.
const milestoneRarity = "legendary"

type txExt interface {
	ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error)
	QueryRowContext(ctx context.Context, query string, args ...any) *sql.Row
}

// insertLevelRewards grants one item per reached milestone level (idempotent
// via level_rewards UNIQUE(user_id,level)). Returns granted items.
func insertLevelRewards(ctx context.Context, tx txExt, userID, taskID string, oldLevel, newLevel int) ([]reward.LevelReward, error) {
	out := []reward.LevelReward{}
	for _, lvl := range reward.LevelsForReward(oldLevel, newLevel) {
		view, err := grantCatalogItem(ctx, tx, userID, milestoneRarity, "level_reward", taskID, lvl)
		if err != nil {
			return nil, err
		}
		// ON CONFLICT DO NOTHING: if the row already exists (re-run), skip insert.
		if _, err := tx.ExecContext(ctx,
			`INSERT INTO level_rewards (user_id, level, user_inventory_item_id)
			 VALUES ($1, $2, $3) ON CONFLICT (user_id, level) DO NOTHING`,
			userID, lvl, view.ID); err != nil {
			return nil, err
		}
		if _, err := tx.ExecContext(ctx,
			`INSERT INTO audit_logs (user_id, action, details_json)
			 VALUES ($1, 'reward.level', $2::jsonb)`,
			userID, levelAuditDetails(taskID, lvl, view.ID)); err != nil {
			return nil, err
		}
		out = append(out, reward.LevelReward{Level: lvl, Item: view})
	}
	return out, nil
}

// insertDrop grants a random catalog item of the rolled rarity. Returns nil
// view + nil id when rarity == "" (no drop); the caller still inserts a roll.
func insertDrop(ctx context.Context, tx txExt, userID, taskID, rarity string) (*reward.InventoryItemView, error) {
	if rarity == "" {
		return nil, nil
	}
	view, err := grantCatalogItem(ctx, tx, userID, rarity, "task_drop", taskID, 0)
	if err != nil {
		return nil, err
	}
	return &view, nil
}

// grantCatalogItem picks the first active catalog item of rarity (by name),
// rolls a fresh xp_multiplier in the rarity range, and inserts a
// user_inventory_item with the given source shape.
func grantCatalogItem(ctx context.Context, tx txExt, userID, rarity, source, taskID string, level int) (reward.InventoryItemView, error) {
	var (
		catID, name, slot, asset string
	)
	err := tx.QueryRowContext(ctx,
		`SELECT id, name, slot_key, asset_url FROM inventory_items
		 WHERE rarity = $1 AND active = true ORDER BY name ASC LIMIT 1`, rarity).
		Scan(&catID, &name, &slot, &asset)
	if err != nil {
		return reward.InventoryItemView{}, err
	}
	mult, err := reward.RollRarityMultiplier(globalRNG, rarity)
	if err != nil {
		return reward.InventoryItemView{}, err
	}
	var id string
	var srcTask, srcLevel any
	if source == "task_drop" {
		srcTask = taskID
	} else {
		srcLevel = level
	}
	err = tx.QueryRowContext(ctx,
		`INSERT INTO user_inventory_items
		   (user_id, inventory_item_id, rarity, source, source_task_id, source_level, xp_multiplier)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, xp_multiplier`,
		userID, catID, rarity, source, srcTask, srcLevel, roundMult(mult)).
		Scan(&id, &mult)
	if err != nil {
		return reward.InventoryItemView{}, err
	}
	return reward.InventoryItemView{
		ID: id, InventoryItemID: catID, Name: name, Rarity: rarity,
		XPMultiplier: mult, SlotKey: slot, AssetURL: asset,
	}, nil
}

// roundMult clamps to 3dp to match numeric(6,3) columns cleanly.
func roundMult(m float64) float64 {
	return math.Round(m*1000) / 1000
}

func levelAuditDetails(taskID string, level int, itemID string) string {
	return `{"task_id":"` + taskID + `","level":` + strconv.Itoa(level) +
		`,"item_id":"` + itemID + `"}`
}

func completionAuditDetails(taskID string, final int) string {
	return `{"task_id":"` + taskID + `","final_xp":` + strconv.Itoa(final) + `}`
}

func rollAuditDetails(taskID, rarity string, dropped bool) string {
	r := "null"
	if rarity != "" {
		r = `"` + rarity + `"`
	}
	return `{"task_id":"` + taskID + `","dropped":` + strconv.FormatBool(dropped) +
		`,"rarity":` + r + `}`
}

// globalRNG is the RNG used by repo-level item-multiplier rolls.
// Tests swap it via SetRNG. ponytail: package-level because the repo has no
// service handle; rolls here are non-security (item flavor only).
var globalRNG reward.RNG = reward.NewCryptoRNG()

// SetRNG swaps the repo RNG (tests only).
func SetRNG(r reward.RNG) { globalRNG = r }
