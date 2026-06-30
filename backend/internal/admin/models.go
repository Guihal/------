package admin

import (
	"context"
	"errors"
	"time"
)

var (
	ErrInvalidInput = errors.New("invalid input")
	ErrNotFound     = errors.New("not found")
	ErrConflict     = errors.New("conflict")
)

const assetsURLPrefix = "/assets"

var rarityAllowlist = map[string]bool{
	"common": true, "rare": true, "epic": true, "legendary": true,
}

// sniffExt maps http.DetectContentType output to the stored extension. Keys
// are the only permitted asset content types (png/jpg/webp).
var sniffExt = map[string]string{
	"image/png":  "png",
	"image/jpeg": "jpg",
	"image/webp": "webp",
}

type ItemInput struct {
	Name             string  `json:"name"`
	Description      string  `json:"description"`
	Rarity           string  `json:"rarity"`
	SlotKey          string  `json:"slot_key"`
	BaseXPMultiplier float64 `json:"base_xp_multiplier"`
}

// ItemPatch uses pointers so omitted fields are untouched (COALESCE patch).
type ItemPatch struct {
	Name             *string  `json:"name"`
	Description      *string  `json:"description"`
	SlotKey          *string  `json:"slot_key"`
	BaseXPMultiplier *float64 `json:"base_xp_multiplier"`
}

type Item struct {
	ID               string    `json:"id"`
	Name             string    `json:"name"`
	Description      string    `json:"description"`
	Rarity           string    `json:"rarity"`
	SlotKey          string    `json:"slot_key"`
	AssetURL         string    `json:"asset_url"`
	BaseXPMultiplier float64   `json:"base_xp_multiplier"`
	Active           bool      `json:"active"`
	CreatedAt        time.Time `json:"created_at"`
}

// UserSummary intentionally omits password_hash.
type UserSummary struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

type StatsSummary struct {
	Users          int `json:"users"`
	Tasks          int `json:"tasks"`
	CompletedTasks int `json:"completed_tasks"`
	RewardRolls    int `json:"reward_rolls"`
	Items          int `json:"items"`
	GrantedItems   int `json:"granted_items"`
}

type AuditLogEntry struct {
	ID        string         `json:"id"`
	UserID    *string        `json:"user_id"`
	Action    string         `json:"action"`
	Details   map[string]any `json:"details"`
	CreatedAt time.Time      `json:"created_at"`
}

type AssetUpload struct {
	AssetURL string `json:"asset_url"`
}

type ListUsersFilter struct {
	Limit, Offset int
	Role, Q       string
	Sort, Dir     string
}

type ListItemsFilter struct {
	Limit, Offset int
	Q, Rarity     string
	Active        *bool
	Slot, Sort    string
	Dir           string
}

type UsersPage struct {
	Items []UserSummary `json:"items"`
	Total int           `json:"total"`
}

type ItemsPage struct {
	Items []Item `json:"items"`
	Total int    `json:"total"`
}

type ListAuditLogsFilter struct {
	Limit, Offset  int
	UserID, Action string
	From, To       time.Time
}

// ReadRepository covers read-only admin lists (handler→repo, no business logic).
type ReadRepository interface {
	ListItems(ctx context.Context, f ListItemsFilter) (ItemsPage, error)
	ListUsers(ctx context.Context, f ListUsersFilter) (UsersPage, error)
	Stats(ctx context.Context) (StatsSummary, error)
	ListAuditLogs(ctx context.Context, f ListAuditLogsFilter) ([]AuditLogEntry, error)
}
