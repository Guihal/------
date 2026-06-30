package adminrepo

import (
	"context"
	"fmt"
	"strings"

	"taskcompanion/backend/internal/admin"
)

// sort allowlists prevent ORDER BY injection.
var userSortCols = map[string]string{
	"created_at": "created_at", "email": "email", "role": "role",
}

func clampLimit(n, def, max int) int {
	if n <= 0 {
		return def
	}
	if n > max {
		return max
	}
	return n
}

func (r *Repository) ListUsers(ctx context.Context, f admin.ListUsersFilter) (admin.UsersPage, error) {
	var where []string
	var args []any
	if f.Role == "user" || f.Role == "admin" {
		args = append(args, f.Role)
		where = append(where, fmt.Sprintf("role = $%d", len(args)))
	}
	if strings.TrimSpace(f.Q) != "" {
		args = append(args, "%"+strings.ToLower(f.Q)+"%")
		where = append(where, fmt.Sprintf("email_normalized LIKE $%d", len(args)))
	}
	clause := ""
	if len(where) > 0 {
		clause = "WHERE " + strings.Join(where, " AND ")
	}
	col := userSortCols[f.Sort]
	if col == "" {
		col = "created_at"
	}
	dir := "DESC"
	if strings.EqualFold(f.Dir, "asc") {
		dir = "ASC"
	}
	limit := clampLimit(f.Limit, 20, 100)
	offset := f.Offset
	if offset < 0 {
		offset = 0
	}
	args = append(args, limit, offset)
	q := fmt.Sprintf(`SELECT id, email, role, created_at FROM users %s ORDER BY %s %s LIMIT $%d OFFSET $%d`,
		clause, col, dir, len(args)-1, len(args))
	rows, err := r.db.QueryContext(ctx, q, args...)
	if err != nil {
		return admin.UsersPage{}, err
	}
	defer rows.Close()
	items := []admin.UserSummary{}
	for rows.Next() {
		var u admin.UserSummary
		if err := rows.Scan(&u.ID, &u.Email, &u.Role, &u.CreatedAt); err != nil {
			return admin.UsersPage{}, err
		}
		items = append(items, u)
	}
	if err := rows.Err(); err != nil {
		return admin.UsersPage{}, err
	}
	var total int
	countErr := r.db.QueryRowContext(ctx, `SELECT count(*) FROM users `+clause, args[:len(args)-2]...).Scan(&total)
	if countErr != nil {
		return admin.UsersPage{}, countErr
	}
	return admin.UsersPage{Items: items, Total: total}, nil
}
