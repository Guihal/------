package httpserver

import (
	"net/http"
	"strconv"

	"taskcompanion/backend/internal/admin"
)

type AdminHandlers struct {
	service *admin.Service
	reads   admin.ReadRepository
}

func NewAdminHandlers(service *admin.Service, reads admin.ReadRepository) *AdminHandlers {
	return &AdminHandlers{service: service, reads: reads}
}

func atoi(v string, def int) int {
	n, err := strconv.Atoi(v)
	if err != nil {
		return def
	}
	return n
}

func (h *AdminHandlers) ListUsers(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page, err := h.reads.ListUsers(r.Context(), admin.ListUsersFilter{
		Limit:  atoi(q.Get("limit"), 20),
		Offset: atoi(q.Get("offset"), 0),
		Role:   q.Get("role"),
		Q:      q.Get("q"),
		Sort:   q.Get("sort"),
		Dir:    q.Get("dir"),
	})
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "internal", "users read failed")
		return
	}
	writeJSON(w, http.StatusOK, page)
}

func (h *AdminHandlers) ListItems(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	active, ok := parseOptionalBool(q.Get("active"))
	if !ok {
		writeError(w, r, http.StatusBadRequest, "invalid_active", "invalid active filter")
		return
	}
	page, err := h.reads.ListItems(r.Context(), admin.ListItemsFilter{
		Limit:  atoi(q.Get("limit"), 20),
		Offset: atoi(q.Get("offset"), 0),
		Q:      q.Get("q"),
		Rarity: q.Get("rarity"),
		Active: active,
		Slot:   q.Get("slot"),
		Sort:   q.Get("sort"),
		Dir:    q.Get("dir"),
	})
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "internal", "items read failed")
		return
	}
	writeJSON(w, http.StatusOK, page)
}

func (h *AdminHandlers) Stats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.reads.Stats(r.Context())
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "internal", "stats read failed")
		return
	}
	writeJSON(w, http.StatusOK, stats)
}
