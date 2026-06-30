package adminrepo

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"taskcompanion/backend/internal/admin"
)

func (r *Repository) ListAuditLogs(ctx context.Context, f admin.ListAuditLogsFilter) ([]admin.AuditLogEntry, error) {
	var where []string
	var args []any
	if strings.TrimSpace(f.UserID) != "" {
		args = append(args, f.UserID)
		where = append(where, fmt.Sprintf("user_id = $%d::uuid", len(args)))
	}
	if strings.TrimSpace(f.Action) != "" {
		args = append(args, f.Action)
		where = append(where, fmt.Sprintf("action = $%d", len(args)))
	}
	if !f.From.IsZero() {
		args = append(args, f.From)
		where = append(where, fmt.Sprintf("created_at >= $%d", len(args)))
	}
	if !f.To.IsZero() {
		args = append(args, f.To)
		where = append(where, fmt.Sprintf("created_at <= $%d", len(args)))
	}
	clause := ""
	if len(where) > 0 {
		clause = "WHERE " + strings.Join(where, " AND ")
	}
	limit := clampLimit(f.Limit, 50, 100)
	offset := f.Offset
	if offset < 0 {
		offset = 0
	}
	args = append(args, limit, offset)
	q := fmt.Sprintf(`SELECT id, COALESCE(user_id::text,''), action, details_json, created_at
		FROM audit_logs %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d`,
		clause, len(args)-1, len(args))
	return r.scanAuditLogs(ctx, q, args...)
}

func (r *Repository) scanAuditLogs(ctx context.Context, query string, args ...any) ([]admin.AuditLogEntry, error) {
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []admin.AuditLogEntry{}
	for rows.Next() {
		var e admin.AuditLogEntry
		var uid string
		var details []byte
		if err := rows.Scan(&e.ID, &uid, &e.Action, &details, &e.CreatedAt); err != nil {
			return nil, err
		}
		if uid != "" {
			e.UserID = &uid
		}
		if len(details) > 0 {
			_ = json.Unmarshal(details, &e.Details)
		}
		out = append(out, e)
	}
	return out, rows.Err()
}
