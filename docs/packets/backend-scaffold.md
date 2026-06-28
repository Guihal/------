# Packet P01: Backend Scaffold

## Goal
Create the Go backend skeleton with configuration, health endpoint, logging, and OpenAPI shell.

## Read First
- `docs/10-rebuild-technical-spec.md` § 3
- `docs/10-rebuild-technical-spec.md` § 8.1-8.2
- `docs/10-rebuild-technical-spec.md` § 9.4-9.7
- `docs/10-rebuild-technical-spec.md` § 13
- `docs/RULES.md`
- `docs/packets/README.md` § Архитектурный минимум для пакетов

## Scope In
- Go module in `backend/`.
- HTTP server with `go-chi/chi`.
- config loading from env.
- structured logs with `request_id`.
- `/health`.
- OpenAPI 3.1 placeholder covering planned endpoint groups.
- `.env.example`.

## Scope Out
- No auth implementation.
- No DB schema.
- No frontend code.
- No business logic for XP/rewards.

## Requirements
- Backend recommended stack is Go single binary + PostgreSQL.
- DB access decision: use `pgx` + `sqlc`; migrations use `goose`.
- Avoid ad hoc SQL string building outside generated/query-layer code.
- Keep runtime simple: one server process.
- Health endpoint returns stable JSON.
- Every request gets request id.
- OpenAPI file exists early so frontends can target it.
- Default backend path is `handler -> usecase/service -> repository/query`.
- Simple health/read endpoints may stay handler-only when they hold no invariant.

## Acceptance
- `cd backend && go test ./...` passes.
- `cd backend && go run ./cmd/server` starts with documented env defaults.
- `curl http://localhost:<port>/health` returns JSON with service status.
- `rg -n "openapi|/auth/login|/tasks|/admin/items|/visual-state" backend` finds the API contract shell.
- project skeleton contains `sqlc` and `goose` config placeholders or documented commands.

## Escalation
- Stop if Go is rejected as backend choice.
- Stop if PostgreSQL is unavailable and no local dev alternative is agreed.
- Stop if OpenAPI contract location conflicts with repo layout.
