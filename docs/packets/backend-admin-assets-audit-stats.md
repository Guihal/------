# Packet P08: Admin API, Assets, Audit, Stats

## Goal
Implement admin APIs for users, item catalog, asset upload, stats, and audit logs.

## Read First
- `docs/10-rebuild-technical-spec.md` § 7.12
- `docs/10-rebuild-technical-spec.md` § 8.1
- `docs/10-rebuild-technical-spec.md` § 13.2-13.3
- `docs/10-rebuild-technical-spec.md` § 14.3
- `docs/RULES.md`
- `docs/packets/README.md` § Архитектурный минимум для пакетов

## Scope In
- `GET /admin/users`
- `GET /admin/items`
- `POST /admin/items`
- `PATCH /admin/items/:id`
- `POST /admin/items/:id/disable`
- `POST /admin/items/:id/assets`
- `GET /admin/stats`
- `GET /admin/logs`
- admin RBAC middleware.

## Scope Out
- No mobile UI.
- No manual XP editing.
- No social/user moderation features.
- No production object storage unless explicitly chosen.

## Requirements
- All admin mutations write audit logs.
- Asset allowlist: png, jpg/jpeg, webp.
- Asset max size is 2 MB.
- Backend generates safe asset filenames.
- Asset upload rejects invalid type/size.
- Last admin cannot be deactivated or locked out.
- Admin cannot mutate XP/reward rolls/inventory without future maintenance endpoint.
- Admin lists support pagination/filter/sort.
- Admin mutations and asset upload are rate-limited.
- Audit events include admin login, admin role failure, item create, item update, item disable, and asset upload.
- Admin mutations use backend service/usecase and audit.
- Read-only admin lists may stay `handler -> query/repository`.

## Acceptance
- `cd backend && go test ./...` passes admin/upload/audit tests.
- normal user receives forbidden response for admin route.
- item create/update/disable writes audit events.
- invalid upload type and oversized upload fail.
- upload larger than 2 MB fails.
- rate-limited admin mutation/upload returns documented API error.
- stats endpoint returns users/tasks/completed/reward rolls/item counts.
- audit logs endpoint filters by user/action/date.

## Escalation
- Stop if frontend/backend disagree on the 2 MB upload limit.
- Stop if admin endpoints expose secrets/raw tokens.
- Stop if disabling item deletes or breaks already granted user items.
- Stop if user lock/deactivate endpoint is added without preserving at least one active admin.
