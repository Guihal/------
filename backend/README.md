# Backend

Go single-binary backend scaffold for the rebuild task manager.

## Defaults

- `APP_ENV=development`
- `HTTP_ADDR=127.0.0.1:8080`
- `SERVICE_NAME=task-manager-backend`
- `DATABASE_URL=postgres://task_companion:task_companion@localhost:5432/task_companion`

## Commands

```sh
go test ./...
go run ./cmd/server
curl http://127.0.0.1:8080/health
```

## Local PostgreSQL

```sh
docker compose -f compose.yaml up -d postgres
```

## Migrations

Goose is run repo-locally; no global `goose` binary is required.

```sh
go run ./cmd/migrate up
go run ./cmd/migrate status
```

## Demo Seed

Demo data is never applied automatically in production. Run it explicitly for
local demo/dev databases after migrations:

```sh
go run ./cmd/seed
```

Typed queries will use sqlc after SQL files are added:

```sh
sqlc generate
```
