package profile

import (
	"context"
	"errors"
	"strings"

	"taskcompanion/backend/internal/task"
)

var ErrValidation = errors.New("validation failed")

type Repository interface {
	Summary(context.Context, string) (Summary, error)
	UpdateDisplayName(context.Context, string, string) (Summary, error)
	Progression(context.Context, string) (Progression, error)
	Settings(context.Context, string) (Settings, error)
	SaveSettings(context.Context, string, func(Settings) Settings) (Settings, error)
}

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Summary(ctx context.Context, userID string) (Summary, error) {
	summary, err := s.repo.Summary(ctx, userID)
	if err != nil {
		return Summary{}, err
	}
	summary.Progression = enrich(summary.Progression)
	return summary, nil
}

func (s *Service) UpdateDisplayName(ctx context.Context, userID string, name string) (Summary, error) {
	name = strings.TrimSpace(name)
	if name == "" || len([]rune(name)) > 80 {
		return Summary{}, ErrValidation
	}
	summary, err := s.repo.UpdateDisplayName(ctx, userID, name)
	if err != nil {
		return Summary{}, err
	}
	summary.Progression = enrich(summary.Progression)
	return summary, nil
}

func (s *Service) Progression(ctx context.Context, userID string) (Progression, error) {
	progression, err := s.repo.Progression(ctx, userID)
	return enrich(progression), err
}

func (s *Service) Settings(ctx context.Context, userID string) (Settings, error) {
	return s.repo.Settings(ctx, userID)
}

func (s *Service) PatchSettings(ctx context.Context, userID string, patch SettingsPatch) (Settings, error) {
	if patch.DefaultReminderMinutesBeforeDeadline != nil {
		minutes := *patch.DefaultReminderMinutesBeforeDeadline
		if minutes < 0 || minutes > 10080 {
			return Settings{}, ErrValidation
		}
	}
	return s.repo.SaveSettings(ctx, userID, func(current Settings) Settings {
		return mergeSettings(current, patch)
	})
}

func mergeSettings(settings Settings, patch SettingsPatch) Settings {
	if patch.NotificationsEnabled != nil {
		settings.NotificationsEnabled = *patch.NotificationsEnabled
	}
	if patch.DefaultReminderMinutesBeforeDeadline != nil {
		settings.DefaultReminderMinutesBeforeDeadline = *patch.DefaultReminderMinutesBeforeDeadline
	}
	if patch.DisableVisualRandomness != nil {
		settings.DisableVisualRandomness = *patch.DisableVisualRandomness
	}
	if patch.ReducedMotion != nil {
		settings.ReducedMotion = *patch.ReducedMotion
	}
	return settings
}

func enrich(progression Progression) Progression {
	progression.XPPerLevel = task.XPPerLevel
	progression.XPInCurrentLevel = progression.XPTotal % task.XPPerLevel
	progression.XPToNextLevel = task.XPPerLevel - progression.XPInCurrentLevel
	return progression
}
