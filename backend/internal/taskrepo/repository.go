package taskrepo

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"taskcompanion/backend/internal/task"
)

type Repository struct {
	db *sql.DB
}

func New(db *sql.DB) *Repository { return &Repository{db: db} }

const overdueColumn = `, CASE WHEN status='active' AND deadline_at IS NOT NULL AND deadline_at < now()
	THEN true ELSE false END AS overdue`

func scanTask(row interface {
	Scan(dest ...any) error
}) (task.Task, error) {
	var t task.Task
	var deadline, completed, archived sql.NullTime
	var categoryID sql.NullString
	err := row.Scan(
		&t.ID, &t.UserID, &categoryID, &t.Title, &t.Description, &t.Status,
		&t.Priority, &t.Complexity, &deadline, &completed, &archived,
		&t.CreatedAt, &t.UpdatedAt, &t.Overdue,
	)
	if err != nil {
		return task.Task{}, err
	}
	if categoryID.Valid {
		id := categoryID.String
		t.CategoryID = &id
	}
	t.DeadlineAt = timePtr(deadline)
	t.CompletedAt = timePtr(completed)
	t.ArchivedAt = timePtr(archived)
	return t, nil
}

func timePtr(v sql.NullTime) *time.Time {
	if !v.Valid {
		return nil
	}
	return &v.Time
}

func (r *Repository) Get(ctx context.Context, userID, id string) (task.Task, error) {
	row := r.db.QueryRowContext(ctx, `SELECT id, user_id, category_id, title, description, status,
		priority, complexity, deadline_at, completed_at, archived_at, created_at, updated_at`+overdueColumn+
		` FROM tasks WHERE user_id=$1 AND id=$2`, userID, id)
	t, err := scanTask(row)
	if err == sql.ErrNoRows {
		return task.Task{}, task.ErrNotFound
	}
	return t, err
}

func (r *Repository) List(ctx context.Context, userID string, f task.ListFilters) (task.ListResult, error) {
	if f.Limit <= 0 || f.Limit > 100 {
		f.Limit = 20
	}
	if f.Offset < 0 {
		f.Offset = 0
	}
	where := "WHERE user_id=$1"
	args := []any{userID}
	n := 2
	if f.Status != "" && f.Status != "all" {
		where += fmt.Sprintf(" AND status=$%d", n)
		args, n = append(args, f.Status), n+1
	}
	if f.CategoryID != "" {
		where += fmt.Sprintf(" AND category_id=$%d", n)
		args, n = append(args, f.CategoryID), n+1
	}
	if f.Priority != "" {
		where += fmt.Sprintf(" AND priority=$%d", n)
		args, n = append(args, f.Priority), n+1
	}
	order := "CASE WHEN status='active' AND deadline_at IS NOT NULL AND deadline_at < now() THEN 0 ELSE 1 END, "
	switch f.Sort {
	case "deadline":
		order += "deadline_at NULLS LAST, created_at DESC"
	case "created_at":
		order += "created_at DESC"
	default:
		order += "deadline_at NULLS LAST, created_at DESC"
	}
	var total int
	if err := r.db.QueryRowContext(ctx, "SELECT count(*) FROM tasks "+where, args...).Scan(&total); err != nil {
		return task.ListResult{}, err
	}
	query := `SELECT id, user_id, category_id, title, description, status, priority, complexity,
		deadline_at, completed_at, archived_at, created_at, updated_at` + overdueColumn +
		" FROM tasks " + where + " ORDER BY " + order + fmt.Sprintf(" LIMIT $%d OFFSET $%d", n, n+1)
	args = append(args, f.Limit, f.Offset)
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return task.ListResult{}, err
	}
	defer rows.Close()
	items := []task.Task{}
	for rows.Next() {
		t, err := scanTask(rows)
		if err != nil {
			return task.ListResult{}, err
		}
		items = append(items, t)
	}
	if err := rows.Err(); err != nil {
		return task.ListResult{}, err
	}
	return task.ListResult{Items: items, Total: total, Limit: f.Limit, Offset: f.Offset}, nil
}
