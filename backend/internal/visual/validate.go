package visual

func Valid(state State) bool {
	return IsAllowed("accent_color", state.AccentColor) &&
		IsAllowed("background_variant", state.BackgroundVariant) &&
		IsAllowed("card_variant", state.CardVariant) &&
		IsAllowed("task_button_text", state.TaskButtonText) &&
		IsAllowed("task_list_heading", state.TaskListHeading) &&
		IsAllowed("profile_background", state.ProfileBackground) &&
		IsAllowed("decorative_detail", state.DecorativeDetail) &&
		IsAllowed("level_up_text", state.LevelUpText) &&
		IsAllowed("empty_state_text", state.EmptyStateText)
}

func stateFromPicker(pick func(string) (string, error)) (State, error) {
	var state State
	var err error
	if state.AccentColor, err = pick("accent_color"); err != nil {
		return State{}, err
	}
	if state.BackgroundVariant, err = pick("background_variant"); err != nil {
		return State{}, err
	}
	if state.CardVariant, err = pick("card_variant"); err != nil {
		return State{}, err
	}
	if state.TaskButtonText, err = pick("task_button_text"); err != nil {
		return State{}, err
	}
	if state.TaskListHeading, err = pick("task_list_heading"); err != nil {
		return State{}, err
	}
	if state.ProfileBackground, err = pick("profile_background"); err != nil {
		return State{}, err
	}
	if state.DecorativeDetail, err = pick("decorative_detail"); err != nil {
		return State{}, err
	}
	if state.LevelUpText, err = pick("level_up_text"); err != nil {
		return State{}, err
	}
	state.EmptyStateText, err = pick("empty_state_text")
	return state, err
}
