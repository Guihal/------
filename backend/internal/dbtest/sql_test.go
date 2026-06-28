package dbtest

import (
	"database/sql"
	"testing"
)

func mustExec(t *testing.T, db *sql.DB, query string, args ...any) {
	t.Helper()
	if _, err := db.Exec(query, args...); err != nil {
		t.Fatalf("exec failed: %v\nquery: %s", err, query)
	}
}

func mustFail(t *testing.T, db *sql.DB, query string, args ...any) {
	t.Helper()
	if _, err := db.Exec(query, args...); err == nil {
		t.Fatalf("expected query to fail: %s", query)
	}
}

func scalar(t *testing.T, db *sql.DB, query string, args ...any) string {
	t.Helper()
	var value string
	mustQueryRow(t, db, &value, query, args...)
	return value
}

func mustQueryRow(t *testing.T, db *sql.DB, dest any, query string, args ...any) {
	t.Helper()
	if err := db.QueryRow(query, args...).Scan(dest); err != nil {
		t.Fatalf("query row failed: %v\nquery: %s", err, query)
	}
}
