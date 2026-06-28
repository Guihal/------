package authrepo

import (
	"context"

	"taskcompanion/backend/internal/auth"
)

func (r *Repository) Audit(ctx context.Context, event auth.AuditEvent) error {
	raw, err := detailsJSON(event.Details)
	if err != nil {
		return err
	}
	_, err = r.db.ExecContext(ctx, `INSERT INTO audit_logs (user_id, action, details_json, ip_address)
		VALUES ($1, $2, $3::jsonb, NULLIF($4, '')::inet)`,
		event.UserID, event.Action, string(raw), event.IP)
	return err
}
