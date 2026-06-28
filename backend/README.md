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

Migrations will use goose after schema work starts:

```sh
goose -dir migrations postgres "$DATABASE_URL" up
```

Typed queries will use sqlc after SQL files are added:

```sh
sqlc generate
```
