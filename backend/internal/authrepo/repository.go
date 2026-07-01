package authrepo

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/lib/pq"

	"taskcompanion/backend/internal/auth"
)

var ErrNotFound = errors.New("not found")

type Repository struct {
	db *sql.DB
}

func New(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) CreateUser(ctx context.Context, email string, hash string, name string) (auth.User, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return auth.User{}, err
	}
	defer tx.Rollback()

	var user auth.User
	err = tx.QueryRowContext(ctx, `INSERT INTO users (email, password_hash, role)
		VALUES ($1, $2, 'user') RETURNING id, email, role`, email, hash).Scan(&user.ID, &user.Email, &user.Role)
	if err != nil {
		if isUniqueViolation(err) {
			return auth.User{}, auth.ErrEmailTaken
		}
		return auth.User{}, err
	}
	if err := insertBaselines(ctx, tx, user.ID, name); err != nil {
		return auth.User{}, err
	}
	user.DisplayName = name
	return user, tx.Commit()
}

func isUniqueViolation(err error) bool {
	var pqErr *pq.Error
	return errors.As(err, &pqErr) && pqErr.Code == "23505"
}

func (r *Repository) UserByEmail(ctx context.Context, email string) (auth.User, string, error) {
	row := r.db.QueryRowContext(ctx, `SELECT u.id, u.email, u.role, p.display_name, u.password_hash
		FROM users u JOIN profiles p ON p.user_id = u.id WHERE u.email_normalized = lower(btrim($1))`, email)
	var user auth.User
	var hash string
	if err := row.Scan(&user.ID, &user.Email, &user.Role, &user.DisplayName, &hash); err != nil {
		return auth.User{}, "", mapNotFound(err)
	}
	return user, hash, nil
}

func (r *Repository) UserByID(ctx context.Context, id string) (auth.User, error) {
	row := r.db.QueryRowContext(ctx, `SELECT u.id, u.email, u.role, p.display_name
		FROM users u JOIN profiles p ON p.user_id = u.id WHERE u.id = $1`, id)
	var user auth.User
	if err := row.Scan(&user.ID, &user.Email, &user.Role, &user.DisplayName); err != nil {
		return auth.User{}, mapNotFound(err)
	}
	return user, nil
}

func insertBaselines(ctx context.Context, tx *sql.Tx, userID string, name string) error {
	statements := []struct {
		query string
		args  []any
	}{
		{`INSERT INTO profiles (user_id, display_name) VALUES ($1, $2)`, []any{userID, name}},
		{`INSERT INTO progressions (user_id) VALUES ($1)`, []any{userID}},
		{`INSERT INTO notification_settings (user_id) VALUES ($1)`, []any{userID}},
		{`INSERT INTO settings (user_id, key, value) VALUES ($1, 'reduced_motion', '{"enabled":false}'::jsonb)`, []any{userID}},
		{`INSERT INTO settings (user_id, key, value) VALUES ($1, 'disable_visual_randomness', '{"enabled":false}'::jsonb)`, []any{userID}},
		{`INSERT INTO settings (user_id, key, value) VALUES ($1, 'notifications_enabled', '{"enabled":true}'::jsonb)`, []any{userID}},
		{`INSERT INTO settings (user_id, key, value) VALUES ($1, 'default_reminder_minutes_before_deadline', '{"minutes":60}'::jsonb)`, []any{userID}},
		{`INSERT INTO user_mascots (user_id, mascot_id, is_active)
			SELECT $1, id, true FROM mascots WHERE is_default LIMIT 1`, []any{userID}},
	}
	for _, statement := range statements {
		if _, err := tx.ExecContext(ctx, statement.query, statement.args...); err != nil {
			return fmt.Errorf("insert baseline: %w", err)
		}
	}
	return nil
}

func mapNotFound(err error) error {
	if errors.Is(err, sql.ErrNoRows) {
		return ErrNotFound
	}
	return err
}

func detailsJSON(details map[string]any) ([]byte, error) {
	if details == nil {
		details = map[string]any{}
	}
	return json.Marshal(details)
}
