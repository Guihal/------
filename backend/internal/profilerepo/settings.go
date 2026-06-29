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

func (r *Repository) SaveSettings(ctx context.Context, userID string, settings profile.Settings) (profile.Settings, error) {
	if err := r.ensureSettings(ctx, userID); err != nil {
		return profile.Settings{}, err
	}
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return profile.Settings{}, err
	}
	defer tx.Rollback()
	// Lock all settings rows for this user so concurrent PATCH writers serialize.
	if _, err = tx.ExecContext(ctx, `SELECT 1 FROM settings WHERE user_id = $1 FOR UPDATE`, userID); err != nil {
		return profile.Settings{}, err
	}
	if _, err = tx.ExecContext(ctx, `UPDATE notification_settings
		SET enabled = $2, default_minutes_before_deadline = $3, updated_at = now()
		WHERE user_id = $1`, userID, settings.NotificationsEnabled,
		settings.DefaultReminderMinutesBeforeDeadline); err != nil {
		return profile.Settings{}, err
	}
	for _, key := range []string{keyNotifications, keyDefaultReminder, keyDisableRandom, keyReducedMotion} {
		if _, err = tx.ExecContext(ctx, `UPDATE settings SET value = $3::jsonb, updated_at = now()
			WHERE user_id = $1 AND key = $2`, userID, key, settingJSON(key, settings)); err != nil {
			return profile.Settings{}, err
		}
	}
	if err = tx.Commit(); err != nil {
		return profile.Settings{}, err
	}
	return settings, nil
}
