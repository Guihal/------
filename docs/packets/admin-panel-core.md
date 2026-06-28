# Packet P13: Admin Panel Core

## Goal
Implement Nuxt 4 admin-panel login, dashboard, users, items, item form, asset upload, and audit logs.

## Read First
- `docs/10-rebuild-technical-spec.md` § 7.12
- `docs/10-rebuild-technical-spec.md` § 9.1-9.3
- `docs/10-rebuild-technical-spec.md` § 14.3
- `docs/RULES.md`
- `docs/packets/README.md` § Архитектурный минимум для пакетов

## Scope In
- Nuxt 4 + Vue 3 + TypeScript admin scaffold in `apps/admin`.
- Pinia.
- Tailwind + SCSS.
- admin auth middleware.
- dashboard stats page.
- users table.
- items table.
- create/edit item form.
- asset upload UI.
- audit logs table.

## Scope Out
- No mobile app pages.
- No backend mutation logic.
- No manual XP/inventory editing.
- No heavy UI kit.

## Requirements
- User role cannot access admin app.
- Admin access token is memory-only.
- Admin refresh token uses `httpOnly Secure SameSite` cookie where backend supports it; otherwise use the shared P09 Bearer refresh strategy without `localStorage`/`sessionStorage` secrets.
- Dashboard is readable operational UI, not decorative hero.
- Tables have pagination/search/filter.
- Item form supports name, description, rarity, slot, asset, enabled.
- Disabling item warns that granted inventory must not break.
- Audit details JSON shown read-only in expandable block.
- Admin tables, filters, row actions, dialogs, and upload control are keyboard accessible.
- Focus states are visible; errors are linked to fields.
- Rarity/status are shown with text labels, not color only.
- Admin stores stay thin: state/loading/error/actions around the shared API client.
- Tables and forms must not duplicate backend RBAC, audit or mutation rules.

## Acceptance
- `cd apps/admin && npm/bun run typecheck` passes after scaffold scripts are fixed.
- `cd apps/admin && npm/bun run build` passes.
- admin login denies non-admin account with Russian message.
- users/items/logs pages render loading/empty/error states.
- asset upload uses backend endpoint and displays validation errors.
- table pagination/filter/action controls work by keyboard.
- upload validation message is exposed as field/status error.

## Escalation
- Stop if admin auth contract differs from backend OpenAPI.
- Stop if item rarity/slot enums differ from backend.
- Stop if UI starts offering manual XP/reward edits.
