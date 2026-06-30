package httpserver

import (
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"

	"taskcompanion/backend/internal/inventory"
)

type InventoryHandlers struct {
	service *inventory.Service
}

func NewInventoryHandlers(service *inventory.Service) *InventoryHandlers {
	return &InventoryHandlers{service: service}
}

func (h *InventoryHandlers) List(w http.ResponseWriter, r *http.Request) {
	res, err := h.service.List(r.Context(), CurrentClaims(r).Subject)
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "internal", "inventory read failed")
		return
	}
	writeJSON(w, http.StatusOK, res)
}

func (h *InventoryHandlers) ActiveMascot(w http.ResponseWriter, r *http.Request) {
	res, err := h.service.ActiveMascot(r.Context(), CurrentClaims(r).Subject)
	if errors.Is(err, inventory.ErrNotFound) {
		writeError(w, r, http.StatusNotFound, "not_found", "no active mascot")
		return
	}
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "internal", "mascot read failed")
		return
	}
	writeJSON(w, http.StatusOK, res)
}

func (h *InventoryHandlers) Equip(w http.ResponseWriter, r *http.Request) {
	itemID := chi.URLParam(r, "userInventoryItemId")
	res, err := h.service.Equip(r.Context(), CurrentClaims(r).Subject, itemID)
	if errors.Is(err, inventory.ErrNotFound) {
		writeError(w, r, http.StatusNotFound, "not_found", "item not owned")
		return
	}
	if errors.Is(err, inventory.ErrSlotMismatch) {
		writeError(w, r, http.StatusBadRequest, "slot_mismatch", "item slot not on active mascot")
		return
	}
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "internal", "equip failed")
		return
	}
	writeJSON(w, http.StatusOK, res)
}

func (h *InventoryHandlers) Unequip(w http.ResponseWriter, r *http.Request) {
	itemID := chi.URLParam(r, "userInventoryItemId")
	err := h.service.Unequip(r.Context(), CurrentClaims(r).Subject, itemID)
	if errors.Is(err, inventory.ErrNotFound) {
		writeError(w, r, http.StatusNotFound, "not_found", "item not equipped")
		return
	}
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "internal", "unequip failed")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
