package adminrepo

import (
	"context"

	"taskcompanion/backend/internal/admin"
)

func (r *Repository) Stats(ctx context.Context) (admin.StatsSummary, error) {
	var s admin.StatsSummary
	counts := []struct {
		query string
		dst   *int
	}{
		{`SELECT count(*) FROM users`, &s.Users},
		{`SELECT count(*) FROM tasks`, &s.Tasks},
		{`SELECT count(*) FROM tasks WHERE status = 'completed'`, &s.CompletedTasks},
		{`SELECT count(*) FROM task_reward_rolls`, &s.RewardRolls},
		{`SELECT count(*) FROM inventory_items`, &s.Items},
		{`SELECT count(*) FROM user_inventory_items`, &s.GrantedItems},
	}
	for _, c := range counts {
		if err := r.db.QueryRowContext(ctx, c.query).Scan(c.dst); err != nil {
			return s, err
		}
	}
	return s, nil
}
