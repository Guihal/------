package inventory

import (
	"context"
	"errors"
	"log/slog"
)

// Service enforces ownership + slot-compatibility invariants. SQL lives in
// inventoryrepo. The repo re-verifies ownership inside the equip/unequip tx
// (defense in depth), but the slot decision is made here from read data.
type Service struct {
	repo   Repository
	logger *slog.Logger
}

func NewService(repo Repository, logger *slog.Logger) *Service {
	return &Service{repo: repo, logger: logger}
}

// InventoryResponse is the GET /inventory payload: owned items (each flagged
// equipped when its id appears in the equipped map) plus the equipped list.
type InventoryResponse struct {
	Items    []OwnedItem    `json:"items"`
	Equipped []EquippedItem `json:"equipped"`
}

func (s *Service) List(ctx context.Context, userID string) (InventoryResponse, error) {
	items, err := s.repo.ListOwned(ctx, userID)
	if err != nil {
		return InventoryResponse{}, err
	}
	equipped, err := s.repo.ListEquipped(ctx, userID)
	if err != nil {
		return InventoryResponse{}, err
	}
	for i := range items {
		_, items[i].Equipped = equipped[items[i].ID]
	}
	out := make([]EquippedItem, 0, len(equipped))
	for _, e := range equipped {
		out = append(out, e)
	}
	return InventoryResponse{Items: items, Equipped: out}, nil
}

func (s *Service) ActiveMascot(ctx context.Context, userID string) (ActiveMascot, error) {
	return s.repo.ActiveMascot(ctx, userID)
}

// Equip equips an owned item into its slot on the active mascot. The item's
// slot_key must be a slot defined on the user's active mascot.
func (s *Service) Equip(ctx context.Context, userID, userInventoryItemID string) (EquippedItem, error) {
	items, err := s.repo.ListOwned(ctx, userID)
	if err != nil {
		return EquippedItem{}, err
	}
	var owned *OwnedItem
	for i := range items {
		if items[i].ID == userInventoryItemID {
			owned = &items[i]
			break
		}
	}
	if owned == nil {
		return EquippedItem{}, ErrNotFound // not owned by this user → 404, no leak
	}
	mascot, err := s.repo.ActiveMascot(ctx, userID)
	if err != nil {
		return EquippedItem{}, err
	}
	if !slotAccepted(mascot.Slots, owned.SlotKey) {
		return EquippedItem{}, ErrSlotMismatch
	}
	if err := s.repo.EquipTx(ctx, userID, userInventoryItemID, owned.SlotKey); err != nil {
		return EquippedItem{}, err
	}
	return EquippedItem{SlotKey: owned.SlotKey, UserInventoryItemID: userInventoryItemID}, nil
}

// Unequip removes the item currently equipped in the slot the owned item
// occupies. Scoped to the current user; a foreign user's item id yields 404.
func (s *Service) Unequip(ctx context.Context, userID, userInventoryItemID string) error {
	err := s.repo.UnequipTx(ctx, userID, userInventoryItemID)
	if errors.Is(err, ErrNotFound) {
		return ErrNotFound
	}
	return err
}

func slotAccepted(slots []MascotSlot, key string) bool {
	for _, sl := range slots {
		if sl.SlotKey == key {
			return true
		}
	}
	return false
}
