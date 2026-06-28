package main

import (
	"context"
	"database/sql"
	"fmt"
	"os"

	_ "github.com/lib/pq"
	"github.com/pressly/goose/v3"
)

const defaultDatabaseURL = "postgres://task_companion:task_companion@localhost:5432/task_companion?sslmode=disable"

func main() {
	if err := run(context.Background(), os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run(ctx context.Context, args []string) error {
	if len(args) != 1 {
		return fmt.Errorf("usage: go run ./cmd/migrate [up|status|down]")
	}
	if err := goose.SetDialect("postgres"); err != nil {
		return fmt.Errorf("set goose dialect: %w", err)
	}

	db, err := sql.Open("postgres", envOrDefault("DATABASE_URL", defaultDatabaseURL))
	if err != nil {
		return fmt.Errorf("open db: %w", err)
	}
	defer db.Close()

	dir := migrationsDir()
	switch args[0] {
	case "up":
		return goose.UpContext(ctx, db, dir)
	case "status":
		return goose.StatusContext(ctx, db, dir)
	case "down":
		return goose.DownContext(ctx, db, dir)
	default:
		return fmt.Errorf("unknown migration command %q", args[0])
	}
}

func migrationsDir() string {
	if dir := os.Getenv("MIGRATIONS_DIR"); dir != "" {
		return dir
	}
	if _, err := os.Stat("migrations"); err == nil {
		return "migrations"
	}
	return "backend/migrations"
}

func envOrDefault(key string, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
