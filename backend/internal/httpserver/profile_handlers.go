package httpserver

import (
	"encoding/json"
	"errors"
	"net/http"

	"taskcompanion/backend/internal/profile"
)

type ProfileHandlers struct {
	service *profile.Service
}

type profilePatchRequest struct {
	DisplayName string `json:"display_name"`
}

func NewProfileHandlers(service *profile.Service) ProfileHandlers {
	return ProfileHandlers{service: service}
}

func (h ProfileHandlers) Get(w http.ResponseWriter, r *http.Request) {
	result, err := h.service.Summary(r.Context(), CurrentClaims(r).Subject)
	writeProfileResult(w, r, result, err)
}

func (h ProfileHandlers) Patch(w http.ResponseWriter, r *http.Request) {
	var request profilePatchRequest
	if !decodeJSONBody(w, r, &request) {
		return
	}
	result, err := h.service.UpdateDisplayName(r.Context(), CurrentClaims(r).Subject, request.DisplayName)
	writeProfileResult(w, r, result, err)
}

func (h ProfileHandlers) Progression(w http.ResponseWriter, r *http.Request) {
	result, err := h.service.Progression(r.Context(), CurrentClaims(r).Subject)
	if err != nil {
		writeFeatureError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func writeProfileResult(w http.ResponseWriter, r *http.Request, result profile.Summary, err error) {
	if err != nil {
		writeFeatureError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func decodeSettingsPatch(body map[string]json.RawMessage) (profile.SettingsPatch, bool) {
	var patch profile.SettingsPatch
	for key, raw := range body {
		if !decodeSettingField(key, raw, &patch) {
			return profile.SettingsPatch{}, false
		}
	}
	return patch, true
}

func writeFeatureError(w http.ResponseWriter, r *http.Request, err error) {
	if errors.Is(err, profile.ErrValidation) {
		writeError(w, r, http.StatusBadRequest, "validation_error", "invalid request fields")
		return
	}
	writeError(w, r, http.StatusInternalServerError, "internal_error", "internal server error")
}
