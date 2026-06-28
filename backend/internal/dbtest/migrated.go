package dbtest

import (
	"context"
	"database/sql"
	"fmt"
	"testing"
	"time"

	_ "github.com/lib/pq"
	"github.com/pressly/goose/v3"
)

func OpenMigratedDB(t *testing.T) *sql.DB {
	t.Helper()
	adminURL := DatabaseURL()
	adminDB, err := sql.Open("postgres", adminURL)
	if err != nil {
		t.Fatalf("open admin db: %v", err)
	}
	if err := adminDB.Ping(); err != nil {
		t.Skipf("postgres unavailable at DATABASE_URL: %v", err)
	}
	name := fmt.Sprintf("task_companion_test_%d", time.Now().UnixNano())
	execOrFatal(t, adminDB, `CREATE DATABASE `+name)
	t.Cleanup(func() {
		execOrFatal(t, adminDB, `DROP DATABASE IF EXISTS `+name+` WITH (FORCE)`)
		adminDB.Close()
	})

	testURL, err := WithDatabase(adminURL, name)
	if err != nil {
		t.Fatalf("build test db url: %v", err)
	}
	db, err := sql.Open("postgres", testURL)
	if err != nil {
		t.Fatalf("open test db: %v", err)
	}
	if err := goose.SetDialect("postgres"); err != nil {
		t.Fatalf("goose dialect: %v", err)
	}
	if err := goose.UpContext(context.Background(), db, "../../migrations"); err != nil {
		t.Fatalf("goose up: %v", err)
	}
	return db
}

func execOrFatal(t *testing.T, db *sql.DB, query string) {
	t.Helper()
	if _, err := db.Exec(query); err != nil {
		t.Fatalf("exec failed: %v\nquery: %s", err, query)
	}
}
