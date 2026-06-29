package profilerepo

import (
	"context"

	"taskcompanion/backend/internal/profile"
)

func (r *Repository) Settings(ctx context.Context, userID string) (profile.Settings, error) {
	if err := r.ensureSettings(ctx, userID); err != nil {
		return profile.Settings{}, err
	}
	rows, err := r.db.QueryContext(ctx, `SELECT key, value FROM settings WHERE user_id = $1`, userID)
	if err != nil {
		return profile.Settings{}, err
	}
	defer rows.Close()
	values := map[string][]byte{}
	for rows.Next() {
		var key string
		var raw []byte
		if err := rows.Scan(&key, &raw); err != nil {
			return profile.Settings{}, err
		}
		values[key] = raw
	}
	return mapSettings(values), rows.Err()
}

func (r *Repository) PatchSettings(ctx context.Context, userID string, patch profile.SettingsPatch) (profile.Settings, error) {
	if err := r.ensureSettings(ctx, userID); err != nil {
		return profile.Settings{}, err
	}
	current, err := r.Settings(ctx, userID)
	if err != nil {
		return profile.Settings{}, err
	}
	mergeSettings(&current, patch)
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return profile.Settings{}, err
	}
	defer tx.Rollback()
	if _, err = tx.ExecContext(ctx, `UPDATE notification_settings
		SET enabled = $2, default_minutes_before_deadline = $3, updated_at = now()
		WHERE user_id = $1`, userID, current.NotificationsEnabled,
		current.DefaultReminderMinutesBeforeDeadline); err != nil {
		return profile.Settings{}, err
	}
	for _, key := range []string{keyNotifications, keyDefaultReminder, keyDisableRandom, keyReducedMotion} {
		if _, err = tx.ExecContext(ctx, `UPDATE settings SET value = $3::jsonb, updated_at = now()
			WHERE user_id = $1 AND key = $2`, userID, key, settingJSON(key, current)); err != nil {
			return profile.Settings{}, err
		}
	}
	if err = tx.Commit(); err != nil {
		return profile.Settings{}, err
	}
	return current, nil
}

func mergeSettings(settings *profile.Settings, patch profile.SettingsPatch) {
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
}
