package profilerepo

import (
	"encoding/json"
	"strconv"

	"taskcompanion/backend/internal/profile"
)

const (
	keyReducedMotion     = "reduced_motion"
	keyDisableRandom     = "disable_visual_randomness"
	keyNotifications     = "notifications_enabled"
	keyDefaultReminder   = "default_reminder_minutes_before_deadline"
	defaultReminderValue = 60
)

var defaultSettings = []struct {
	key string
	raw string
}{
	{keyReducedMotion, `{"enabled":false}`},
	{keyDisableRandom, `{"enabled":false}`},
	{keyNotifications, `{"enabled":true}`},
	{keyDefaultReminder, `{"minutes":60}`},
}

func mapSettings(rows map[string][]byte) profile.Settings {
	return profile.Settings{
		NotificationsEnabled:                 settingBool(rows[keyNotifications], true),
		DefaultReminderMinutesBeforeDeadline: settingMinutes(rows[keyDefaultReminder], defaultReminderValue),
		DisableVisualRandomness:              settingBool(rows[keyDisableRandom], false),
		ReducedMotion:                        settingBool(rows[keyReducedMotion], false),
	}
}

func settingBool(raw []byte, fallback bool) bool {
	var row struct {
		Enabled *bool `json:"enabled"`
	}
	if err := json.Unmarshal(raw, &row); err != nil || row.Enabled == nil {
		return fallback
	}
	return *row.Enabled
}

func settingMinutes(raw []byte, fallback int) int {
	var row struct {
		Minutes *int `json:"minutes"`
	}
	if err := json.Unmarshal(raw, &row); err != nil || row.Minutes == nil {
		return fallback
	}
	return *row.Minutes
}

func settingJSON(key string, settings profile.Settings) string {
	switch key {
	case keyNotifications:
		return boolJSON(settings.NotificationsEnabled)
	case keyDefaultReminder:
		return `{"minutes":` + strconv.Itoa(settings.DefaultReminderMinutesBeforeDeadline) + `}`
	case keyDisableRandom:
		return boolJSON(settings.DisableVisualRandomness)
	default:
		return boolJSON(settings.ReducedMotion)
	}
}

func boolJSON(value bool) string {
	if value {
		return `{"enabled":true}`
	}
	return `{"enabled":false}`
}
