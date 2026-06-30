package inventoryrepo

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"taskcompanion/backend/internal/inventory"
)

// Repository implements inventory.Repository with SQL only.
type Repository struct {
	db *sql.DB
}

func New(db *sql.DB) *Repository { return &Repository{db: db} }

// ListOwned joins user_inventory_items with catalog inventory_items.
// Catalog `active` is intentionally NOT filtered: a granted item stays valid
// after its catalog row is disabled (active only gates P06 drop selection).
func (r *Repository) ListOwned(ctx context.Context, userID string) ([]inventory.OwnedItem, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT uii.id, uii.inventory_item_id, ii.name, uii.rarity,
		       uii.xp_multiplier, ii.slot_key, ii.asset_url, uii.source
		FROM user_inventory_items uii
		JOIN inventory_items ii ON ii.id = uii.inventory_item_id AND ii.rarity = uii.rarity
		WHERE uii.user_id = $1
		ORDER BY uii.acquired_at, uii.id`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []inventory.OwnedItem{}
	for rows.Next() {
		var it inventory.OwnedItem
		if err := rows.Scan(&it.ID, &it.InventoryItemID, &it.Name, &it.Rarity,
			&it.XPMultiplier, &it.SlotKey, &it.AssetURL, &it.Source); err != nil {
			return nil, err
		}
		out = append(out, it)
	}
	return out, rows.Err()
}

func (r *Repository) ListEquipped(ctx context.Context, userID string) (map[string]inventory.EquippedItem, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT slot_key, user_inventory_item_id FROM equipped_items WHERE user_id = $1`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[string]inventory.EquippedItem{}
	for rows.Next() {
		var e inventory.EquippedItem
		if err := rows.Scan(&e.SlotKey, &e.UserInventoryItemID); err != nil {
			return nil, err
		}
		out[e.UserInventoryItemID] = e
	}
	return out, rows.Err()
}

// ActiveMascot resolves the user's single active mascot and its slots.
// Returns ErrNotFound if the user has no active mascot.
func (r *Repository) ActiveMascot(ctx context.Context, userID string) (inventory.ActiveMascot, error) {
	var m inventory.ActiveMascot
	err := r.db.QueryRowContext(ctx, `
		SELECT m.id, m.name, m.asset_url FROM user_mascots um
		JOIN mascots m ON m.id = um.mascot_id
		WHERE um.user_id = $1 AND um.is_active`, userID).
		Scan(&m.MascotID, &m.Name, &m.AssetURL)
	if errors.Is(err, sql.ErrNoRows) {
		return inventory.ActiveMascot{}, inventory.ErrNotFound
	}
	if err != nil {
		return inventory.ActiveMascot{}, err
	}
	rows, err := r.db.QueryContext(ctx,
		`SELECT slot_key, title, anchor_json FROM mascot_slots WHERE mascot_id = $1 ORDER BY slot_key`, m.MascotID)
	if err != nil {
		return inventory.ActiveMascot{}, err
	}
	defer rows.Close()
	for rows.Next() {
		var s inventory.MascotSlot
		if err := rows.Scan(&s.SlotKey, &s.Title, &s.AnchorJSON); err != nil {
			return inventory.ActiveMascot{}, err
		}
		m.Slots = append(m.Slots, s)
	}
	return m, rows.Err()
}

// EquipTx re-verifies ownership inside the tx (FOR UPDATE), then upserts the
// equipped_items row. UNIQUE(user_id, slot_key) → ON CONFLICT replaces the
// previously equipped item in that slot (slot replacement).
func (r *Repository) EquipTx(ctx context.Context, userID, userInventoryItemID, slotKey string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	var gotSlot string
	err = tx.QueryRowContext(ctx,
		`SELECT ii.slot_key FROM user_inventory_items uii
		 JOIN inventory_items ii ON ii.id = uii.inventory_item_id AND ii.rarity = uii.rarity
		 WHERE uii.user_id = $1 AND uii.id = $2 FOR UPDATE`, userID, userInventoryItemID).
		Scan(&gotSlot)
	if errors.Is(err, sql.ErrNoRows) {
		return inventory.ErrNotFound
	}
	if err != nil {
		return err
	}
	if gotSlot != slotKey {
		return inventory.ErrSlotMismatch
	}
	if _, err := tx.ExecContext(ctx, `
		INSERT INTO equipped_items (user_id, user_inventory_item_id, slot_key)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id, slot_key) DO UPDATE
		  SET user_inventory_item_id = excluded.user_inventory_item_id, equipped_at = now()`,
		userID, userInventoryItemID, slotKey); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx,
		`INSERT INTO audit_logs (user_id, action, details_json) VALUES ($1, 'inventory.equip', $2::jsonb)`,
		userID, equipAuditDetails(userInventoryItemID, slotKey)); err != nil {
		return err
	}
	return tx.Commit()
}

// UnequipTx deletes the equipped row matching this user + owned item.
// No row affected ⇒ the item isn't currently equipped by this user (404).
func (r *Repository) UnequipTx(ctx context.Context, userID, userInventoryItemID string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	var slotKey string
	err = tx.QueryRowContext(ctx,
		`DELETE FROM equipped_items WHERE user_id = $1 AND user_inventory_item_id = $2 RETURNING slot_key`,
		userID, userInventoryItemID).Scan(&slotKey)
	if errors.Is(err, sql.ErrNoRows) {
		return inventory.ErrNotFound
	}
	if err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx,
		`INSERT INTO audit_logs (user_id, action, details_json) VALUES ($1, 'inventory.unequip', $2::jsonb)`,
		userID, unequipAuditDetails(userInventoryItemID, slotKey)); err != nil {
		return err
	}
	return tx.Commit()
}

func equipAuditDetails(itemID, slot string) string {
	return fmt.Sprintf(`{"user_inventory_item_id":"%s","slot_key":"%s"}`, itemID, slot)
}
func unequipAuditDetails(itemID, slot string) string {
	return fmt.Sprintf(`{"user_inventory_item_id":"%s","slot_key":"%s"}`, itemID, slot)
}
