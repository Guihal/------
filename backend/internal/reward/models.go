package reward

import "taskcompanion/backend/internal/visual"

// TaskInfo is the completion-relevant slice of a task row.
type TaskInfo struct {
	ID         string
	Status     string
	Complexity string
	Priority   string
}

// Plan carries server-computed reward inputs handed to the atomic repo tx.
// RNG-dependent values are rolled in the service; the repo executes SQL only.
type Plan struct {
	BaseXP             int
	TaskMultiplier     float64
	EquipmentMultiplier float64
	FinalXP            int
	DropMultiplier     float64
	DropRoll           float64
	DropRarity         string // "" = no drop
}

// XPGrant is the persisted task_xp_grants row (no roll_value here).
type XPGrant struct {
	BaseXP              int     `json:"base_xp"`
	TaskMultiplier      float64 `json:"task_multiplier"`
	EquipmentMultiplier float64 `json:"equipment_xp_multiplier"`
	FinalXP             int     `json:"final_xp"`
}

// ProgressionSnapshot is the authoritative XP/level view at a point in time.
type ProgressionSnapshot struct {
	XPTotal          int `json:"xp_total"`
	Level            int `json:"level"`
	XPInCurrentLevel int `json:"xp_in_current_level"`
	XPToNextLevel    int `json:"xp_to_next_level"`
}

// InventoryItemView is the client-safe view of a granted item.
type InventoryItemView struct {
	ID              string  `json:"id"`
	InventoryItemID string  `json:"inventory_item_id"`
	Name            string  `json:"name"`
	Rarity          string  `json:"rarity"`
	XPMultiplier    float64 `json:"xp_multiplier"`
	SlotKey         string  `json:"slot_key"`
	AssetURL        string  `json:"asset_url"`
}

// LevelReward is a milestone item granted on reaching a level divisible by 5.
type LevelReward struct {
	Level int                 `json:"level"`
	Item  InventoryItemView   `json:"item"`
}

// DropResult describes the task-drop outcome. Item is empty on no-drop.
type DropResult struct {
	Dropped bool               `json:"dropped"`
	Rarity  string             `json:"rarity,omitempty"`
	Item    *InventoryItemView `json:"item,omitempty"`
}

// Result is the repo-level completion outcome.
type Result struct {
	IsFresh          bool
	LeveledUp        bool
	XPGrant          XPGrant
	ProgressionBefore ProgressionSnapshot
	ProgressionAfter  ProgressionSnapshot
	LevelRewards     []LevelReward
	Drop             DropResult
}

// CompletionPayload is the authoritative response for POST /tasks/:id/complete.
// roll_value is intentionally absent — client never sees it.
type CompletionPayload struct {
	Task                 taskStub        `json:"task"`
	IsFreshCompletionEvent bool          `json:"is_fresh_completion_event"`
	XPGrant              XPGrant         `json:"xp_grant"`
	ProgressionBefore    ProgressionSnapshot `json:"progression_before"`
	ProgressionAfter     ProgressionSnapshot `json:"progression_after"`
	LevelUps             []int           `json:"level_ups"`
	LevelRewards         []LevelReward   `json:"level_rewards"`
	TaskDrop             DropResult      `json:"task_drop"`
	VisualState          *visual.State   `json:"visual_state,omitempty"`
}

// taskStub carries minimal task identity for the payload. Set by the handler.
type taskStub struct {
	ID     string `json:"id"`
	Status string `json:"status"`
}
