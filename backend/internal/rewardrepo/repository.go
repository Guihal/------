package rewardrepo

import (
	"context"
	"database/sql"
	"errors"

	"taskcompanion/backend/internal/reward"
)

// Repository implements reward.Repository with SQL only. It does not import
// the service. tx + row locking live in complete_tx.go; writes in writes.go.
type Repository struct {
	db *sql.DB
}

func New(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) TaskForCompletion(ctx context.Context, userID, taskID string) (reward.TaskInfo, error) {
	var info reward.TaskInfo
	err := r.db.QueryRowContext(ctx,
		`SELECT id, status, complexity, priority FROM tasks
		 WHERE id = $1 AND user_id = $2`, taskID, userID).
		Scan(&info.ID, &info.Status, &info.Complexity, &info.Priority)
	if errors.Is(err, sql.ErrNoRows) {
		return reward.TaskInfo{}, reward.ErrNotFound
	}
	return info, err
}

// EquippedMultipliers reads xp_multiplier of every equipped user_inventory_item.
// Empty result ⇒ EquipmentMultiplier returns 1.0.
func (r *Repository) EquippedMultipliers(ctx context.Context, userID string) ([]float64, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT uii.xp_multiplier FROM equipped_items ei
		 JOIN user_inventory_items uii
		   ON uii.user_id = ei.user_id AND uii.id = ei.user_inventory_item_id
		 WHERE ei.user_id = $1`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	mults := []float64{}
	for rows.Next() {
		var m float64
		if err := rows.Scan(&m); err != nil {
			return nil, err
		}
		mults = append(mults, m)
	}
	return mults, rows.Err()
}
