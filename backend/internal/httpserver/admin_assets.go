package httpserver

import (
	"errors"
	"io"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"

	"taskcompanion/backend/internal/admin"
)

// maxAssetBytes enforces the 2MB upload cap (RULES.md §6).
const maxAssetBytes = 2 * 1024 * 1024

func serveAssets(router chi.Router, assetsDir string) {
	if strings.TrimSpace(assetsDir) == "" {
		return
	}
	files := http.StripPrefix("/assets/", http.FileServer(http.Dir(assetsDir)))
	router.Handle("/assets/*", files)
}

func (h *AdminHandlers) UploadAsset(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if !requireUUIDParam(w, r, id) {
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, maxAssetBytes)
	data, err := io.ReadAll(r.Body)
	if err != nil {
		// MaxBytesReader yields "http: request body too large" past the cap.
		writeError(w, r, http.StatusRequestEntityTooLarge, "too_large", "asset exceeds 2MB")
		return
	}
	upload, err := h.service.UploadAsset(r.Context(), id, data, CurrentClaims(r).Subject, clientIP(r))
	if errors.Is(err, admin.ErrInvalidInput) {
		writeError(w, r, http.StatusBadRequest, "invalid_type", "asset type not allowed")
		return
	}
	if errors.Is(err, admin.ErrNotFound) {
		writeError(w, r, http.StatusNotFound, "not_found", "item not found")
		return
	}
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "internal", "upload failed")
		return
	}
	writeJSON(w, http.StatusOK, upload)
}
