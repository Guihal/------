package visual

var AllowedEvents = map[string]bool{
	"app-enter": true, "page-enter": true, "task-created": true,
	"task-completed": true, "level-up": true, "manual-refresh": true,
}

var fallback = State{
	AccentColor: "#7dd3fc", BackgroundVariant: "dark-ember", CardVariant: "graphite",
	TaskButtonText: "Добавить задачу", TaskListHeading: "Активные задачи",
	ProfileBackground: "quiet-grid", DecorativeDetail: "soft-sparks",
	LevelUpText: "Новый уровень", EmptyStateText: "Пока нет активных задач",
}

var catalog = map[string][]string{
	"accent_color":       {"#7dd3fc", "#a7f3d0", "#f9a8d4", "#fde68a"},
	"background_variant": {"dark-ember", "deep-forest", "midnight"},
	"card_variant":       {"graphite", "pine", "plum"},
	"task_button_text":   {"Добавить задачу", "Записать задачу", "Новая задача"},
	"task_list_heading":  {"Что сделать сейчас", "План на сегодня", "Активные задачи"},
	"profile_background": {"quiet-grid", "night-lines", "calm-shapes"},
	"decorative_detail":  {"soft-sparks", "thin-rings", "small-dots"},
	"level_up_text":      {"Новый уровень", "Уровень повышен", "Прогресс обновлен"},
	"empty_state_text":   {"Пока нет активных задач", "Список задач пуст", "Можно добавить первую задачу"},
}

func Fallback() State {
	return fallback
}

func IsAllowed(slot string, value string) bool {
	for _, allowed := range catalog[slot] {
		if value == allowed {
			return true
		}
	}
	return false
}
