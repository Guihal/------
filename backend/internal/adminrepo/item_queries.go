package adminrepo

import (
	"context"
	"fmt"
	"strings"

	"taskcompanion/backend/internal/admin"
)

var itemSortCols = map[string]string{
	"created_at": "created_at", "name": "name", "rarity": "rarity", "slot_key": "slot_key",
}

func (r *Repository) ListItems(ctx context.Context, f admin.ListItemsFilter) (admin.ItemsPage, error) {
	clause, args := itemWhere(f)
	col := itemSortCols[f.Sort]
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
	q := fmt.Sprintf(`SELECT id, name, description, rarity, slot_key, asset_url,
		base_xp_multiplier, active, created_at FROM inventory_items %s
		ORDER BY %s %s LIMIT $%d OFFSET $%d`, clause, col, dir, len(args)-1, len(args))
	items, err := r.scanItems(ctx, q, args...)
	if err != nil {
		return admin.ItemsPage{}, err
	}
	var total int
	err = r.db.QueryRowContext(ctx, `SELECT count(*) FROM inventory_items `+clause,
		args[:len(args)-2]...).Scan(&total)
	return admin.ItemsPage{Items: items, Total: total}, err
}

func itemWhere(f admin.ListItemsFilter) (string, []any) {
	var where []string
	var args []any
	if strings.TrimSpace(f.Q) != "" {
		args = append(args, "%"+strings.ToLower(f.Q)+"%")
		where = append(where, fmt.Sprintf("(lower(name) LIKE $%d OR lower(description) LIKE $%d)", len(args), len(args)))
	}
	if f.Rarity != "" {
		args = append(args, f.Rarity)
		where = append(where, fmt.Sprintf("rarity = $%d", len(args)))
	}
	if f.Active != nil {
		args = append(args, *f.Active)
		where = append(where, fmt.Sprintf("active = $%d", len(args)))
	}
	if strings.TrimSpace(f.Slot) != "" {
		args = append(args, f.Slot)
		where = append(where, fmt.Sprintf("slot_key = $%d", len(args)))
	}
	if len(where) == 0 {
		return "", args
	}
	return "WHERE " + strings.Join(where, " AND "), args
}

func (r *Repository) scanItems(ctx context.Context, query string, args ...any) ([]admin.Item, error) {
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []admin.Item{}
	for rows.Next() {
		var it admin.Item
		err := rows.Scan(&it.ID, &it.Name, &it.Description, &it.Rarity,
			&it.SlotKey, &it.AssetURL, &it.BaseXPMultiplier, &it.Active, &it.CreatedAt)
		if err != nil {
			return nil, err
		}
		out = append(out, it)
	}
	return out, rows.Err()
}
