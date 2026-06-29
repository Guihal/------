package httpserver

import (
	"errors"
	"net/http"

	"taskcompanion/backend/internal/visual"
)

type VisualHandlers struct {
	service *visual.Service
}

func NewVisualHandlers(service *visual.Service) VisualHandlers {
	return VisualHandlers{service: service}
}

func (h VisualHandlers) Get(w http.ResponseWriter, r *http.Request) {
	result, err := h.service.Get(r.Context(), CurrentClaims(r).Subject)
	if err != nil {
		writeVisualError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h VisualHandlers) Refresh(w http.ResponseWriter, r *http.Request) {
	var request visual.RefreshRequest
	if !decodeJSONBody(w, r, &request) {
		return
	}
	result, err := h.service.Refresh(r.Context(), CurrentClaims(r).Subject, request.Event)
	if err != nil {
		writeVisualError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func writeVisualError(w http.ResponseWriter, r *http.Request, err error) {
	if errors.Is(err, visual.ErrValidation) {
		writeError(w, r, http.StatusBadRequest, "validation_error", "invalid visual refresh event")
		return
	}
	writeError(w, r, http.StatusInternalServerError, "internal_error", "internal server error")
}
