package authrepo

import (
	"context"
	"errors"
	"testing"
	"time"

	"taskcompanion/backend/internal/auth"
	"taskcompanion/backend/internal/dbtest"
)

func TestRotateSessionConsumesOldSessionOnce(t *testing.T) {
	db := dbtest.OpenMigratedDB(t)
	defer db.Close()
	repo := New(db)
	ctx := context.Background()

	user, err := repo.CreateUser(ctx, "rotate@example.test", "hash", "Rotate")
	if err != nil {
		t.Fatalf("create user: %v", err)
	}
	old, err := repo.CreateSession(ctx, user, "old-hash", "", time.Now().UTC().Add(time.Hour))
	if err != nil {
		t.Fatalf("create session: %v", err)
	}
	first, err := repo.RotateSession(ctx, old, "next-hash", time.Now().UTC().Add(time.Hour))
	if err != nil {
		t.Fatalf("first rotate: %v", err)
	}
	if _, err := repo.RotateSession(ctx, old, "racing-hash", time.Now().UTC().Add(time.Hour)); !errors.Is(err, auth.ErrUnauthorized) {
		t.Fatalf("second rotate error = %v, want unauthorized", err)
	}

	assertSessionCounts(t, repo, first.FamilyID, 1, 1)
}

func assertSessionCounts(t *testing.T, repo *Repository, familyID string, active int, revoked int) {
	t.Helper()
	var gotActive int
	var gotRevoked int
	err := repo.db.QueryRow(`SELECT count(*) FILTER (WHERE revoked_at IS NULL),
		count(*) FILTER (WHERE revoked_at IS NOT NULL) FROM sessions WHERE family_id = $1`, familyID).Scan(&gotActive, &gotRevoked)
	if err != nil {
		t.Fatalf("count sessions: %v", err)
	}
	if gotActive != active || gotRevoked != revoked {
		t.Fatalf("session counts active=%d revoked=%d, want active=%d revoked=%d", gotActive, gotRevoked, active, revoked)
	}
}
