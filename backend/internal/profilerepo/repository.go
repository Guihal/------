package profilerepo

import (
	"context"
	"database/sql"

	"taskcompanion/backend/internal/profile"
)

type Repository struct {
	db *sql.DB
}

func New(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Summary(ctx context.Context, userID string) (profile.Summary, error) {
	var summary profile.Summary
	row := r.db.QueryRowContext(ctx, `SELECT p.display_name, pr.level, pr.xp_total,
		COUNT(t.id), COUNT(t.id) FILTER (WHERE t.status = 'completed'),
		COUNT(t.id) FILTER (WHERE t.status = 'archived')
		FROM profiles p JOIN progressions pr ON pr.user_id = p.user_id
		LEFT JOIN tasks t ON t.user_id = p.user_id WHERE p.user_id = $1
		GROUP BY p.display_name, pr.level, pr.xp_total`, userID)
	err := row.Scan(&summary.DisplayName, &summary.Progression.Level, &summary.Progression.XPTotal,
		&summary.Stats.TasksCreated, &summary.Stats.TasksCompleted, &summary.Stats.TasksArchived)
	return summary, err
}

func (r *Repository) UpdateDisplayName(ctx context.Context, userID string, name string) (profile.Summary, error) {
	_, err := r.db.ExecContext(ctx, `UPDATE profiles SET display_name = $2, updated_at = now() WHERE user_id = $1`, userID, name)
	if err != nil {
		return profile.Summary{}, err
	}
	return r.Summary(ctx, userID)
}

func (r *Repository) Progression(ctx context.Context, userID string) (profile.Progression, error) {
	var progression profile.Progression
	err := r.db.QueryRowContext(ctx, `SELECT level, xp_total FROM progressions WHERE user_id = $1`, userID).
		Scan(&progression.Level, &progression.XPTotal)
	return progression, err
}
