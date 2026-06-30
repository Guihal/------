package httpserver

import (
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"

	"taskcompanion/backend/internal/reward"
)

// RewardHandlers exposes the reward engine's complete-task endpoint.
type RewardHandlers struct {
	service *reward.Service
}

func NewRewardHandlers(service *reward.Service) RewardHandlers {
	return RewardHandlers{service: service}
}

// Complete handles POST /tasks/{id}/complete. Thin: parse id, dispatch to the
// reward service, respond with the authoritative CompletionPayload. roll_value
// is never present in the response (absent from every JSON struct).
func (h RewardHandlers) Complete(w http.ResponseWriter, r *http.Request) {
	payload, err := h.service.Complete(r.Context(), CurrentClaims(r).Subject, chi.URLParam(r, "id"))
	if err != nil {
		if errors.Is(err, reward.ErrNotFound) {
			writeError(w, r, http.StatusNotFound, "not_found", "task not found")
			return
		}
		writeError(w, r, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}
	writeJSON(w, http.StatusOK, payload)
}
