package adminrepo

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"

	"github.com/lib/pq"

	"taskcompanion/backend/internal/admin"
	"taskcompanion/backend/internal/auth"
)

func (r *Repository) CreateItemWithAudit(ctx context.Context, in admin.ItemInput, ev auth.AuditEvent) (admin.Item, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return admin.Item{}, err
	}
	defer tx.Rollback()
	row := tx.QueryRowContext(ctx, `
		INSERT INTO inventory_items (name, description, rarity, slot_key, asset_url, base_xp_multiplier)
		VALUES ($1, $2, $3, $4, '', $5)
		RETURNING id, name, description, rarity, slot_key, asset_url, base_xp_multiplier, active, created_at`,
		in.Name, in.Description, in.Rarity, in.SlotKey, in.BaseXPMultiplier)
	item, err := scanItem(row)
	if err != nil {
		return admin.Item{}, mapItemWriteErr(err)
	}
	if ev.Details == nil {
		ev.Details = map[string]any{}
	}
	ev.Details["item_id"] = item.ID
	if err := insertAudit(ctx, tx, ev); err != nil {
		return admin.Item{}, err
	}
	return item, tx.Commit()
}

func (r *Repository) UpdateItemWithAudit(
	ctx context.Context, id string, p admin.ItemPatch, ev auth.AuditEvent,
) (admin.Item, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return admin.Item{}, err
	}
	defer tx.Rollback()
	row := tx.QueryRowContext(ctx, `
		UPDATE inventory_items SET
			name = COALESCE($2, name),
			description = COALESCE($3, description),
			slot_key = COALESCE($4, slot_key),
			base_xp_multiplier = COALESCE($5, base_xp_multiplier),
			updated_at = now()
		WHERE id = $1
		RETURNING id, name, description, rarity, slot_key, asset_url, base_xp_multiplier, active, created_at`,
		id, p.Name, p.Description, p.SlotKey, p.BaseXPMultiplier)
	item, err := scanItem(row)
	if err != nil {
		return admin.Item{}, mapItemWriteErr(notFound(err))
	}
	if err := insertAudit(ctx, tx, ev); err != nil {
		return admin.Item{}, err
	}
	return item, tx.Commit()
}

func (r *Repository) DisableItemWithAudit(ctx context.Context, id string, ev auth.AuditEvent) (admin.Item, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return admin.Item{}, err
	}
	defer tx.Rollback()
	row := tx.QueryRowContext(ctx, `
		UPDATE inventory_items SET active = false, updated_at = now()
		WHERE id = $1
		RETURNING id, name, description, rarity, slot_key, asset_url, base_xp_multiplier, active, created_at`, id)
	item, err := scanItem(row)
	if err != nil {
		return admin.Item{}, notFound(err)
	}
	if err := insertAudit(ctx, tx, ev); err != nil {
		return admin.Item{}, err
	}
	return item, tx.Commit()
}

func (r *Repository) SetItemAssetWithAudit(ctx context.Context, id, assetURL string, ev auth.AuditEvent) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	res, err := tx.ExecContext(ctx,
		`UPDATE inventory_items SET asset_url = $2, updated_at = now() WHERE id = $1`, id, assetURL)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return admin.ErrNotFound
	}
	if err := insertAudit(ctx, tx, ev); err != nil {
		return err
	}
	return tx.Commit()
}

func insertAudit(ctx context.Context, tx *sql.Tx, event auth.AuditEvent) error {
	raw, err := json.Marshal(event.Details)
	if err != nil {
		return err
	}
	_, err = tx.ExecContext(ctx, `INSERT INTO audit_logs (user_id, action, details_json, ip_address)
		VALUES ($1, $2, $3::jsonb, NULLIF($4, '')::inet)`,
		event.UserID, event.Action, string(raw), event.IP)
	return err
}

func mapItemWriteErr(err error) error {
	var pqErr *pq.Error
	if errors.As(err, &pqErr) && pqErr.Code == "23505" &&
		pqErr.Constraint == "inventory_items_name_unique" {
		return admin.ErrConflict
	}
	return err
}
