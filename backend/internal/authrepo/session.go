package authrepo

import (
	"context"
	"database/sql"
	"time"

	"taskcompanion/backend/internal/auth"
)

func (r *Repository) CreateSession(
	ctx context.Context, user auth.User, tokenHash string, familyID string, expiresAt time.Time,
) (auth.SessionRecord, error) {
	row := r.db.QueryRowContext(ctx, `INSERT INTO sessions (user_id, refresh_token_hash, family_id, expires_at)
		VALUES ($1, $2, COALESCE(NULLIF($3, '')::uuid, gen_random_uuid()), $4)
		RETURNING id, user_id, family_id, refresh_token_hash, expires_at, revoked_at`,
		user.ID, tokenHash, familyID, expiresAt)
	return scanSession(row, user)
}

func (r *Repository) SessionByRefreshHash(ctx context.Context, tokenHash string) (auth.SessionRecord, error) {
	row := r.db.QueryRowContext(ctx, `SELECT s.id, s.user_id, s.family_id, s.refresh_token_hash,
		s.expires_at, s.revoked_at, u.id, u.email, u.role, p.display_name
		FROM sessions s
		JOIN users u ON u.id = s.user_id
		JOIN profiles p ON p.user_id = u.id
		WHERE s.refresh_token_hash = $1`, tokenHash)
	var session auth.SessionRecord
	var user auth.User
	err := row.Scan(&session.ID, &session.UserID, &session.FamilyID, &session.RefreshTokenHash,
		&session.ExpiresAt, &session.RevokedAt, &user.ID, &user.Email, &user.Role, &user.DisplayName)
	if err != nil {
		return auth.SessionRecord{}, mapNotFound(err)
	}
	session.User = user
	return session, nil
}

func (r *Repository) RotateSession(
	ctx context.Context, old auth.SessionRecord, nextHash string, expiresAt time.Time,
) (auth.SessionRecord, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return auth.SessionRecord{}, err
	}
	defer tx.Rollback()
	result, err := tx.ExecContext(ctx, `UPDATE sessions SET revoked_at = now()
		WHERE id = $1 AND revoked_at IS NULL AND expires_at > now()`, old.ID)
	if err != nil {
		return auth.SessionRecord{}, err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return auth.SessionRecord{}, err
	}
	if affected != 1 {
		return auth.SessionRecord{}, auth.ErrUnauthorized
	}
	row := tx.QueryRowContext(ctx, `INSERT INTO sessions (user_id, refresh_token_hash, family_id, expires_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id, user_id, family_id, refresh_token_hash, expires_at, revoked_at`,
		old.UserID, nextHash, old.FamilyID, expiresAt)
	next, err := scanSession(row, old.User)
	if err != nil {
		return auth.SessionRecord{}, err
	}
	return next, tx.Commit()
}

func (r *Repository) RevokeSession(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `UPDATE sessions SET revoked_at = COALESCE(revoked_at, now()) WHERE id = $1`, id)
	return err
}

func (r *Repository) RevokeFamily(ctx context.Context, familyID string) error {
	_, err := r.db.ExecContext(ctx, `UPDATE sessions SET revoked_at = COALESCE(revoked_at, now()) WHERE family_id = $1`, familyID)
	return err
}

func scanSession(row *sql.Row, user auth.User) (auth.SessionRecord, error) {
	var session auth.SessionRecord
	err := row.Scan(&session.ID, &session.UserID, &session.FamilyID, &session.RefreshTokenHash,
		&session.ExpiresAt, &session.RevokedAt)
	session.User = user
	return session, err
}
