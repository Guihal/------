package visualrepo

import (
	"context"
	"database/sql"
	"encoding/json"

	"taskcompanion/backend/internal/visual"
)

const scope = "mobile"

type Repository struct {
	db *sql.DB
}

func New(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Load(ctx context.Context, userID string) (visual.State, bool, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT key, value FROM visual_state WHERE user_id = $1 AND scope = $2`, userID, scope)
	if err != nil {
		return visual.State{}, false, err
	}
	defer rows.Close()
	values := map[string]string{}
	for rows.Next() {
		var key string
		var raw []byte
		if err := rows.Scan(&key, &raw); err != nil {
			return visual.State{}, false, err
		}
		values[key] = decodeValue(raw)
	}
	return mapState(values), len(values) > 0, rows.Err()
}

func (r *Repository) Save(ctx context.Context, userID string, state visual.State) error {
	for key, value := range stateValues(state) {
		raw, _ := json.Marshal(map[string]string{"value": value})
		_, err := r.db.ExecContext(ctx, `INSERT INTO visual_state (user_id, scope, key, value)
			VALUES ($1, $2, $3, $4::jsonb)
			ON CONFLICT (user_id, scope, key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
			userID, scope, key, raw)
		if err != nil {
			return err
		}
	}
	return nil
}
