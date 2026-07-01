package httpserver

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"

	"taskcompanion/backend/internal/admin"
)

func (h *AdminHandlers) CreateItem(w http.ResponseWriter, r *http.Request) {
	var in admin.ItemInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, r, http.StatusBadRequest, "bad_request", "invalid body")
		return
	}
	item, err := h.service.CreateItem(r.Context(), in, CurrentClaims(r).Subject, clientIP(r))
	if errors.Is(err, admin.ErrInvalidInput) {
		writeError(w, r, http.StatusBadRequest, "invalid_input", "invalid item fields")
		return
	}
	if errors.Is(err, admin.ErrConflict) {
		writeError(w, r, http.StatusConflict, "conflict", "item name already exists")
		return
	}
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "internal", "create failed")
		return
	}
	writeJSON(w, http.StatusCreated, item)
}

func (h *AdminHandlers) GetItem(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if !requireUUIDParam(w, r, id) {
		return
	}
	item, err := h.reads.GetItem(r.Context(), id)
	if errors.Is(err, admin.ErrNotFound) {
		writeError(w, r, http.StatusNotFound, "not_found", "item not found")
		return
	}
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "internal", "item read failed")
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *AdminHandlers) UpdateItem(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if !requireUUIDParam(w, r, id) {
		return
	}
	var p admin.ItemPatch
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		writeError(w, r, http.StatusBadRequest, "bad_request", "invalid body")
		return
	}
	item, err := h.service.UpdateItem(r.Context(), id, p, CurrentClaims(r).Subject, clientIP(r))
	if errors.Is(err, admin.ErrInvalidInput) {
		writeError(w, r, http.StatusBadRequest, "invalid_input", "invalid item fields")
		return
	}
	if errors.Is(err, admin.ErrNotFound) {
		writeError(w, r, http.StatusNotFound, "not_found", "item not found")
		return
	}
	if errors.Is(err, admin.ErrConflict) {
		writeError(w, r, http.StatusConflict, "conflict", "item name already exists")
		return
	}
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "internal", "update failed")
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *AdminHandlers) DisableItem(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if !requireUUIDParam(w, r, id) {
		return
	}
	item, err := h.service.DisableItem(r.Context(), id, CurrentClaims(r).Subject, clientIP(r))
	if errors.Is(err, admin.ErrNotFound) {
		writeError(w, r, http.StatusNotFound, "not_found", "item not found")
		return
	}
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "internal", "disable failed")
		return
	}
	writeJSON(w, http.StatusOK, item)
}
