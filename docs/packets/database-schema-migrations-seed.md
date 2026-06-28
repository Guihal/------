# Packet P02: Database Schema, Migrations, Seed

## Goal
Implement PostgreSQL schema, migrations, constraints, and demo seed data.

## Read First
- `docs/10-rebuild-technical-spec.md` § 11
- `docs/10-rebuild-technical-spec.md` § 11.3
- `docs/10-rebuild-technical-spec.md` § 11.4
- `docs/10-rebuild-technical-spec.md` § 15.2
- `docs/RULES.md`
- `docs/packets/README.md` § Архитектурный минимум для пакетов

## Scope In
- SQL migrations with `goose`.
- PostgreSQL schema with at least 20 proposed tables unless explicitly reduced.
- indexes for auth, task list, admin lists, reward audit.
- seed command for demo/dev data.
- migration and seed docs.

## Scope Out
- No HTTP handlers.
- No frontend work.
- No production auto-seed.
- No changing reward formulas.

## Requirements
- DB must contain not less than 10 tables.
- Required tables:
  - `users`
  - `sessions`
  - `profiles`
  - `progressions`
  - `task_categories`
  - `tasks`
  - `task_xp_grants`
  - `mascots`
  - `user_mascots`
  - `mascot_slots`
  - `inventory_items`
  - `user_inventory_items`
  - `equipped_items`
  - `level_rewards`
  - `task_reward_rolls`
  - `notification_settings`
  - `task_reminders`
  - `audit_logs`
  - `visual_state`
  - `settings`
- Required constraints:
  - normalized unique email.
  - role/status/priority/complexity/rarity checks.
  - non-negative XP and level >= 1.
  - FK ownership for user-owned rows: `profiles.user_id`, `progressions.user_id`, `task_categories.user_id`, `tasks.user_id`, `task_xp_grants.user_id`, `user_mascots.user_id`, `user_inventory_items.user_id`, `equipped_items.user_id`, `level_rewards.user_id`, `task_reward_rolls.user_id`, `notification_settings.user_id`, `task_reminders.user_id`, `audit_logs.user_id`, `visual_state.user_id`, `settings.user_id`.
  - task/category FK: `tasks.category_id -> task_categories.id`.
  - reminder/task FK: `task_reminders.task_id -> tasks.id`.
  - mascot slot FK: `mascot_slots.mascot_id -> mascots.id`.
  - inventory/equipment FK coverage for base item and owned item relations.
  - uniqueness: `profiles(user_id)`, `progressions(user_id)`, `settings(user_id,key)`, `visual_state(user_id,scope,key)`, `notification_settings(user_id)`.
  - unique task XP grant.
  - unique task reward roll.
  - unique level reward per user+level.
  - unique equipped item per user+slot.
- Required indexes:
  - `users(email_normalized)`.
  - `sessions(user_id, revoked_at, expires_at)`.
  - `tasks(user_id, status, due_at)`.
  - `tasks(user_id, category_id)`.
  - `audit_logs(user_id, action, created_at)`.
  - `task_reward_rolls(user_id, task_id)`.
  - `user_inventory_items(user_id, item_id)`.
  - admin list indexes for users/items/logs filters.
- Seed must create admin user, ordinary demo user, categories, optional demo tasks, default mascot, slots, items across all rarities, settings keys, visual palettes.
- DB constraints are the primary guard for idempotency and source-of-truth invariants.

## Acceptance
- `cd backend && goose up` applies all migrations to an empty DB.
- `cd backend && goose status` reports applied migrations.
- `cd backend && go test ./...` passes DB migration tests.
- seed command can run twice without duplicating demo rows.
- invalid enum/negative XP/duplicate reward inserts fail in tests.

## Escalation
- Stop if schema needs fewer than 10 tables.
- Stop if any required invariant cannot be expressed by DB constraint or transactional backend check.
- Stop if seed requires real production secrets.
