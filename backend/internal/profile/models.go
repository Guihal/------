package profile

type Summary struct {
	DisplayName string      `json:"display_name"`
	Progression Progression `json:"progression"`
	Stats       Stats       `json:"stats"`
}

type Progression struct {
	Level            int `json:"level"`
	XPTotal          int `json:"xp_total"`
	XPInCurrentLevel int `json:"xp_in_current_level"`
	XPToNextLevel    int `json:"xp_to_next_level"`
	XPPerLevel       int `json:"xp_per_level"`
}

type Stats struct {
	TasksCreated   int `json:"tasks_created"`
	TasksCompleted int `json:"tasks_completed"`
	TasksArchived  int `json:"tasks_archived"`
}

type Settings struct {
	NotificationsEnabled                 bool `json:"notifications_enabled"`
	DefaultReminderMinutesBeforeDeadline int  `json:"default_reminder_minutes_before_deadline"`
	DisableVisualRandomness              bool `json:"disable_visual_randomness"`
	ReducedMotion                        bool `json:"reduced_motion"`
}

type SettingsPatch struct {
	NotificationsEnabled                 *bool
	DefaultReminderMinutesBeforeDeadline *int
	DisableVisualRandomness              *bool
	ReducedMotion                        *bool
}
