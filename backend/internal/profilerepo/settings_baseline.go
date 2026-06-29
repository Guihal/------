package profilerepo

import "context"

func (r *Repository) ensureSettings(ctx context.Context, userID string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err = tx.ExecContext(ctx, `INSERT INTO notification_settings (user_id) VALUES ($1)
		ON CONFLICT (user_id) DO NOTHING`, userID); err != nil {
		return err
	}
	for _, setting := range defaultSettings {
		if _, err = tx.ExecContext(ctx, `INSERT INTO settings (user_id, key, value)
			VALUES ($1, $2, $3::jsonb) ON CONFLICT (user_id, key) DO NOTHING`,
			userID, setting.key, setting.raw); err != nil {
			return err
		}
	}
	return tx.Commit()
}
