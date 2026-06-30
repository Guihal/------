package adminrepo

import (
	"context"
	"database/sql"
	"errors"

	"taskcompanion/backend/internal/admin"
)

type Repository struct{ db *sql.DB }

func New(db *sql.DB) *Repository { return &Repository{db: db} }

var ErrNotFound = errors.New("not found")

func notFound(err error) error {
	if errors.Is(err, sql.ErrNoRows) {
		return admin.ErrNotFound
	}
	return err
}

func (r *Repository) GetItem(ctx context.Context, id string) (admin.Item, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, name, description, rarity, slot_key, asset_url,
		       base_xp_multiplier, active, created_at
		FROM inventory_items WHERE id = $1`, id)
	it, err := scanItem(row)
	return it, notFound(err)
}

type itemRow interface {
	Scan(dest ...any) error
}

func scanItem(row itemRow) (admin.Item, error) {
	var it admin.Item
	err := row.Scan(&it.ID, &it.Name, &it.Description, &it.Rarity,
		&it.SlotKey, &it.AssetURL, &it.BaseXPMultiplier, &it.Active, &it.CreatedAt)
	return it, err
}
