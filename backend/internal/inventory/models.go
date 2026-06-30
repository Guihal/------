package inventory

import (
	"context"
	"encoding/json"
	"errors"
)

// ErrNotFound signals the owned item, mascot, or equipped row does not exist
// for this user. Handlers map it to 404 (never leak cross-user existence).
var ErrNotFound = errors.New("inventory: not found for user")

// ErrSlotMismatch signals the item's slot_key is not a slot on the user's
// active mascot. Handlers map it to 400.
var ErrSlotMismatch = errors.New("inventory: item slot not compatible with active mascot")

// OwnedItem is a granted catalog item owned by a user. Catalog `active` flag
// is intentionally NOT filtered: granted items stay usable when their catalog
// row is later disabled (active only gates drop-grant selection in P06).
type OwnedItem struct {
	ID              string          `json:"id"`               // user_inventory_item id
	InventoryItemID string          `json:"inventory_item_id"` // catalog item id
	Name            string          `json:"name"`
	Rarity          string          `json:"rarity"`
	XPMultiplier    float64         `json:"xp_multiplier"`
	SlotKey         string          `json:"slot_key"`
	AssetURL        string          `json:"asset_url"`
	Source          string          `json:"source"`
	Equipped        bool            `json:"equipped"`
}

// EquippedItem is a slot→owned-item binding.
type EquippedItem struct {
	SlotKey             string `json:"slot_key"`
	UserInventoryItemID string `json:"user_inventory_item_id"`
}

// MascotSlot is one equippable slot on a mascot, with placement data.
type MascotSlot struct {
	SlotKey    string          `json:"slot_key"`
	Title      string          `json:"title"`
	AnchorJSON json.RawMessage `json:"anchor_json"`
}

// ActiveMascot is the user's currently active mascot and its slots.
type ActiveMascot struct {
	MascotID string       `json:"mascot_id"`
	Name     string       `json:"name"`
	AssetURL string       `json:"asset_url"`
	Slots    []MascotSlot `json:"slots"`
}

// Repository executes inventory SQL only (no business logic).
type Repository interface {
	ListOwned(ctx context.Context, userID string) ([]OwnedItem, error)
	ListEquipped(ctx context.Context, userID string) (map[string]EquippedItem, error)
	ActiveMascot(ctx context.Context, userID string) (ActiveMascot, error)
	EquipTx(ctx context.Context, userID, userInventoryItemID, slotKey string) error
	UnequipTx(ctx context.Context, userID, userInventoryItemID string) error
}
