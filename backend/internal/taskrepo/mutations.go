package taskrepo

import (
	"context"
	"database/sql"
	"fmt"

	"taskcompanion/backend/internal/task"
)

const returningCols = ` RETURNING id, user_id, category_id, title, description, status,
	priority, complexity, deadline_at, completed_at, archived_at, created_at, updated_at` + overdueColumn

func (r *Repository) Create(ctx context.Context, userID string, in task.CreateInput) (task.Task, error) {
	query := `INSERT INTO tasks (user_id, category_id, title, description, status, priority, complexity, deadline_at)
		VALUES ($1, $2, $3, $4, 'active', $5, $6, $7)` + returningCols
	row := r.db.QueryRowContext(ctx, query,
		userID, in.CategoryID, in.Title, in.Description, in.Priority, in.Complexity, in.DeadlineAt)
	return scanTask(row)
}

func (r *Repository) Update(ctx context.Context, userID, id string, in task.PatchInput) (task.Task, error) {
	sets := []string{"updated_at=now()"}
	args := []any{}
	n := 1
	add := func(col string, val any) {
		sets = append(sets, fmt.Sprintf("%s=$%d", col, n))
		args, n = append(args, val), n+1
	}
	if in.Title != nil {
		add("title", *in.Title)
	}
	if in.Description != nil {
		add("description", *in.Description)
	}
	if in.CategoryID != nil {
		add("category_id", *in.CategoryID)
	}
	if in.Priority != nil {
		add("priority", *in.Priority)
	}
	if in.Complexity != nil {
		add("complexity", *in.Complexity)
	}
	if in.DeadlineAt != nil {
		add("deadline_at", *in.DeadlineAt)
	}
	args = append(args, userID, id)
	query := "UPDATE tasks SET " + joinSets(sets) + fmt.Sprintf(" WHERE user_id=$%d AND id=$%d", n, n+1) + returningCols
	row := r.db.QueryRowContext(ctx, query, args...)
	t, err := scanTask(row)
	if err == sql.ErrNoRows {
		return task.Task{}, task.ErrNotFound
	}
	return t, err
}

func joinSets(sets []string) string {
	out := ""
	for i, s := range sets {
		if i > 0 {
			out += ", "
		}
		out += s
	}
	return out
}

func (r *Repository) Archive(ctx context.Context, userID, id string) (task.Task, error) {
	query := `UPDATE tasks SET status='archived', archived_at=now(), updated_at=now()
		WHERE user_id=$1 AND id=$2` + returningCols
	row := r.db.QueryRowContext(ctx, query, userID, id)
	t, err := scanTask(row)
	if err == sql.ErrNoRows {
		return task.Task{}, task.ErrNotFound
	}
	return t, err
}
