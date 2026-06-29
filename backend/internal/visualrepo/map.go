package visualrepo

import (
	"encoding/json"

	"taskcompanion/backend/internal/visual"
)

func decodeValue(raw []byte) string {
	var wrapped struct {
		Value string `json:"value"`
	}
	_ = json.Unmarshal(raw, &wrapped)
	return wrapped.Value
}

func mapState(values map[string]string) visual.State {
	return visual.State{
		AccentColor:       values["accent_color"],
		BackgroundVariant: values["background_variant"],
		CardVariant:       values["card_variant"],
		TaskButtonText:    values["task_button_text"],
		TaskListHeading:   values["task_list_heading"],
		ProfileBackground: values["profile_background"],
		DecorativeDetail:  values["decorative_detail"],
		LevelUpText:       values["level_up_text"],
		EmptyStateText:    values["empty_state_text"],
	}
}

func stateValues(state visual.State) map[string]string {
	return map[string]string{
		"accent_color":       state.AccentColor,
		"background_variant": state.BackgroundVariant,
		"card_variant":       state.CardVariant,
		"task_button_text":   state.TaskButtonText,
		"task_list_heading":  state.TaskListHeading,
		"profile_background": state.ProfileBackground,
		"decorative_detail":  state.DecorativeDetail,
		"level_up_text":      state.LevelUpText,
		"empty_state_text":   state.EmptyStateText,
	}
}
