package visualrepo

import (
	"context"
	"encoding/json"
)

func (r *Repository) VisualRandomDisabled(ctx context.Context, userID string) (bool, error) {
	_, err := r.db.ExecContext(ctx, `INSERT INTO settings (user_id, key, value)
		VALUES ($1, 'disable_visual_randomness', '{"enabled":false}'::jsonb)
		ON CONFLICT (user_id, key) DO NOTHING`, userID)
	if err != nil {
		return false, err
	}
	var raw []byte
	if err := r.db.QueryRowContext(ctx, `SELECT value FROM settings
		WHERE user_id = $1 AND key = 'disable_visual_randomness'`, userID).Scan(&raw); err != nil {
		return false, err
	}
	var setting struct {
		Enabled bool `json:"enabled"`
	}
	_ = json.Unmarshal(raw, &setting)
	return setting.Enabled, nil
}
