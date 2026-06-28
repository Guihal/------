# Packet P05: Tasks and Progression

## Goal
Implement task CRUD, archive, task category metadata, and base progression helpers.

## Read First
- `docs/10-rebuild-technical-spec.md` § 7.3-7.5
- `docs/10-rebuild-technical-spec.md` § 12.3-12.5
- `docs/10-rebuild-technical-spec.md` § 13.1
- `docs/RULES.md`
- `docs/packets/README.md` § Архитектурный минимум для пакетов

## Scope In
- `GET /tasks`
- `POST /tasks`
- `GET /tasks/:id`
- `PATCH /tasks/:id`
- `POST /tasks/:id/archive`
- `GET /task-categories`
- task ownership checks.
- base XP calculation.
- progression read helpers used by the reward engine.

## Scope Out
- No inventory.
- No item drops.
- No level rewards.
- No full complete transaction; P06 owns `POST /tasks/:id/complete`.
- No frontend pages.
- No hard delete in user flow.

## Requirements
- Default priority = `normal`.
- Default complexity = `medium`.
- Default category = `общее`.
- Deadline is optional.
- Overdue is derived from active status and deadline.
- Task list sorting prioritizes overdue active tasks without storing `overdue` status.
- Archive is not physical delete.
- Negative XP and overdue penalties are forbidden.
- Category list returns stable ids, names, color tokens, and sort order.
- Task create/update validates `category_id`: it must be a system category or a category owned by the authenticated user.
- Base XP constants:
  - `tiny = 50`
  - `small = 100`
  - `medium = 200`
  - `large = 350`
  - high priority bonus `+50`
  - `XP_PER_LEVEL = 1000`
- `task_xp_grants.task_id` remains reserved for P06 double-XP prevention.
- Task mutations use backend service/usecase when ownership, status transitions,
  progression or idempotency are involved.
- Simple list/detail reads may stay `handler -> query/repository`.

## Acceptance
- `cd backend && go test ./...` passes task/progression tests.
- user cannot access another user's task.
- creating task with only title works.
- category metadata can be fetched for task forms.
- active list orders overdue tasks consistently.
- archiving removes task from active list and keeps it viewable as archived.
- OpenAPI documents task list filters/sort/pagination.

## Escalation
- Stop if client submits `final_xp`.
- Stop if completed/archived transitions conflict with reward packet.
- Stop if hard delete becomes required for normal user flow.
