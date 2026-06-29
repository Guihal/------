package taskrepo

import (
	"context"
	"database/sql"

	"taskcompanion/backend/internal/task"
)

// systemCategories seeds every user with a stable set of system categories.
// общее is the default category for new tasks (packet requirement).
var systemCategories = []struct {
	title string
	color string
}{
	{"Учеба", "#4f46e5"},
	{"Работа", "#0891b2"},
	{"Личное", "#16a34a"},
	{"общее", "#6b7280"},
}

// EnsureSystemCategories idempotently provisions system categories for a user.
// Called on task create (default category resolution) and on category list.
func (r *Repository) EnsureSystemCategories(ctx context.Context, userID string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	for _, c := range systemCategories {
		if _, err := tx.ExecContext(ctx,
			`INSERT INTO task_categories (user_id, title, color, is_system)
			 VALUES ($1, $2, $3, true) ON CONFLICT (user_id, title) DO NOTHING`,
			userID, c.title, c.color); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (r *Repository) Categories(ctx context.Context, userID string) ([]task.TaskCategory, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, title, color, is_system FROM task_categories
		 WHERE user_id=$1 ORDER BY is_system DESC, title ASC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	cats := []task.TaskCategory{}
	for rows.Next() {
		var c task.TaskCategory
		if err := rows.Scan(&c.ID, &c.Title, &c.Color, &c.IsSystem); err != nil {
			return nil, err
		}
		cats = append(cats, c)
	}
	return cats, rows.Err()
}

func (r *Repository) CategoryExistsForUser(ctx context.Context, userID, categoryID string) (bool, error) {
	var exists bool
	err := r.db.QueryRowContext(ctx,
		`SELECT EXISTS(SELECT 1 FROM task_categories WHERE user_id=$1 AND id=$2)`,
		userID, categoryID).Scan(&exists)
	return exists, err
}

func (r *Repository) SystemCategoryByTitle(ctx context.Context, userID, title string) (string, error) {
	var id string
	err := r.db.QueryRowContext(ctx,
		`SELECT id FROM task_categories WHERE user_id=$1 AND title=$2 AND is_system=true`,
		userID, title).Scan(&id)
	if err == sql.ErrNoRows {
		return "", task.ErrNotFound
	}
	return id, err
}
