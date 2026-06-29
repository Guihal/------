package httpserver

import (
	"bytes"
	"encoding/json"
	"net/http"

	"taskcompanion/backend/internal/profile"
)

type SettingsHandlers struct {
	service *profile.Service
}

func NewSettingsHandlers(service *profile.Service) SettingsHandlers {
	return SettingsHandlers{service: service}
}

func (h SettingsHandlers) Get(w http.ResponseWriter, r *http.Request) {
	result, err := h.service.Settings(r.Context(), CurrentClaims(r).Subject)
	if err != nil {
		writeFeatureError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h SettingsHandlers) Patch(w http.ResponseWriter, r *http.Request) {
	var body map[string]json.RawMessage
	if !decodeJSONBody(w, r, &body) {
		return
	}
	if body == nil {
		writeError(w, r, http.StatusBadRequest, "validation_error", "invalid settings fields")
		return
	}
	patch, ok := decodeSettingsPatch(body)
	if !ok {
		writeError(w, r, http.StatusBadRequest, "validation_error", "invalid settings fields")
		return
	}
	result, err := h.service.PatchSettings(r.Context(), CurrentClaims(r).Subject, patch)
	if err != nil {
		writeFeatureError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func decodeSettingField(key string, raw json.RawMessage, patch *profile.SettingsPatch) bool {
	if bytes.Equal(bytes.TrimSpace(raw), []byte("null")) {
		return false
	}
	switch key {
	case "notifications_enabled":
		var value bool
		patch.NotificationsEnabled = &value
		return json.Unmarshal(raw, patch.NotificationsEnabled) == nil
	case "default_reminder_minutes_before_deadline":
		var value int
		patch.DefaultReminderMinutesBeforeDeadline = &value
		return json.Unmarshal(raw, patch.DefaultReminderMinutesBeforeDeadline) == nil
	case "disable_visual_randomness":
		var value bool
		patch.DisableVisualRandomness = &value
		return json.Unmarshal(raw, patch.DisableVisualRandomness) == nil
	case "reduced_motion":
		var value bool
		patch.ReducedMotion = &value
		return json.Unmarshal(raw, patch.ReducedMotion) == nil
	default:
		return false
	}
}
