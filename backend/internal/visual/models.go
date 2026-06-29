package visual

type State struct {
	AccentColor       string `json:"accent_color"`
	BackgroundVariant string `json:"background_variant"`
	CardVariant       string `json:"card_variant"`
	TaskButtonText    string `json:"task_button_text"`
	TaskListHeading   string `json:"task_list_heading"`
	ProfileBackground string `json:"profile_background"`
	DecorativeDetail  string `json:"decorative_detail"`
	LevelUpText       string `json:"level_up_text"`
	EmptyStateText    string `json:"empty_state_text"`
}

type RefreshRequest struct {
	Event string `json:"event"`
}
