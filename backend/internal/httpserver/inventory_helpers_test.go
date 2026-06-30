package httpserver

import (
	"database/sql"
	"testing"
)

// seedItemFixture inserts a default mascot (active for the user), one slot,
// a catalog item in that slot, and a user_inventory_item owned by the user.
// Returns the owned item id. Reusable across inventory equip/unequip tests.
func seedItemFixture(t *testing.T, db *sql.DB, userID, slot, rarity string) string {
	t.Helper()
	var mascotID string
	err := db.QueryRow(`SELECT id FROM mascots WHERE is_default LIMIT 1`).Scan(&mascotID)
	if err == sql.ErrNoRows {
		err = db.QueryRow(`INSERT INTO mascots (name, asset_url, is_default, active)
			VALUES ('Test Buddy', '/a.png', true, true) RETURNING id`).Scan(&mascotID)
	} else {
		err = nil
	}
	if err != nil {
		t.Fatalf("mascot: %v", err)
	}
	if _, err := db.Exec(`INSERT INTO user_mascots (user_id, mascot_id, is_active)
		VALUES ($1, $2, true) ON CONFLICT DO NOTHING`, userID, mascotID); err != nil {
		t.Fatalf("user_mascots: %v", err)
	}
	// single-active constraint: only this mascot is active for the user
	if _, err := db.Exec(`UPDATE user_mascots SET is_active = (mascot_id = $2)
		WHERE user_id = $1`, userID, mascotID); err != nil {
		t.Fatalf("set active: %v", err)
	}
	if _, err := db.Exec(`INSERT INTO mascot_slots (mascot_id, slot_key, title, anchor_json)
		VALUES ($1, $2, $3, '{"x":0.5,"y":0.5}'::jsonb) ON CONFLICT DO NOTHING`,
		mascotID, slot, slot); err != nil {
		t.Fatalf("slot: %v", err)
	}
	var catID string
	if err := db.QueryRow(`INSERT INTO inventory_items (name, description, rarity, slot_key, asset_url, base_xp_multiplier, active)
		VALUES ($1, '', $2, $3, '/i.png', 1.05, true) RETURNING id`,
		"Item-"+slot+"-"+rarity, rarity, slot).Scan(&catID); err != nil {
		t.Fatalf("catalog item: %v", err)
	}
	var ownedID string
	if err := db.QueryRow(`INSERT INTO user_inventory_items (user_id, inventory_item_id, rarity, source, xp_multiplier)
		VALUES ($1, $2, $3, 'seed', 1.05) RETURNING id`, userID, catID, rarity).Scan(&ownedID); err != nil {
		t.Fatalf("owned item: %v", err)
	}
	return ownedID
}

// seedOwnedInSlot grants a second owned item in an arbitrary slot/rarity for
// the user (catalog row + user_inventory_item). Mascot/slot must already exist.
func seedOwnedInSlot(t *testing.T, db *sql.DB, userID, name, slot, rarity string) string {
	t.Helper()
	var catID string
	if err := db.QueryRow(`INSERT INTO inventory_items (name, description, rarity, slot_key, asset_url, base_xp_multiplier, active)
		VALUES ($1, '', $2, $3, '/i.png', 1.05, true) RETURNING id`,
		name, rarity, slot).Scan(&catID); err != nil {
		t.Fatalf("catalog item: %v", err)
	}
	var ownedID string
	if err := db.QueryRow(`INSERT INTO user_inventory_items (user_id, inventory_item_id, rarity, source, xp_multiplier)
		VALUES ($1, $2, $3, 'seed', 1.05) RETURNING id`, userID, catID, rarity).Scan(&ownedID); err != nil {
		t.Fatalf("owned item: %v", err)
	}
	return ownedID
}
