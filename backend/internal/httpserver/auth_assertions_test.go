package httpserver

import (
	"database/sql"
	"testing"
)

func assertBaselines(t *testing.T, db *sql.DB, userID string) {
	t.Helper()
	tables := []string{"profiles", "progressions", "notification_settings"}
	for _, table := range tables {
		if countRows(t, db, `SELECT count(*) FROM `+table+` WHERE user_id = $1`, userID) != 1 {
			t.Fatalf("expected %s baseline for user %s", table, userID)
		}
	}
	if countRows(t, db, `SELECT count(*) FROM settings WHERE user_id = $1`, userID) != 4 {
		t.Fatalf("expected settings baseline for user %s", userID)
	}
}

func assertOldRefreshRevoked(t *testing.T, db *sql.DB, userID string) {
	t.Helper()
	revoked := countRows(t, db, `SELECT count(*) FROM sessions WHERE user_id = $1 AND revoked_at IS NOT NULL`, userID)
	active := countRows(t, db, `SELECT count(*) FROM sessions WHERE user_id = $1 AND revoked_at IS NULL`, userID)
	if revoked < 1 || active < 1 {
		t.Fatalf("expected revoked and active sessions, got revoked=%d active=%d", revoked, active)
	}
}

func assertAudit(t *testing.T, db *sql.DB, action string, userID string) {
	t.Helper()
	var query string
	var args []any
	if userID == "" {
		query = `SELECT count(*) FROM audit_logs WHERE action = $1`
		args = []any{action}
	} else {
		query = `SELECT count(*) FROM audit_logs WHERE action = $1 AND user_id = $2`
		args = []any{action, userID}
	}
	if countRows(t, db, query, args...) < 1 {
		t.Fatalf("expected audit event %s", action)
	}
}

func assertAuditDetailsClean(t *testing.T, db *sql.DB, forbidden string) {
	t.Helper()
	var count int
	err := db.QueryRow(`SELECT count(*) FROM audit_logs WHERE details_json::text LIKE '%' || $1 || '%'`, forbidden).Scan(&count)
	if err != nil {
		t.Fatalf("audit clean query failed: %v", err)
	}
	if count != 0 {
		t.Fatalf("audit details contain forbidden value %q", forbidden)
	}
}
