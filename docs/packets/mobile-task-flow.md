# Packet P11: Mobile Task Flow

## Goal
Implement mobile task list, create/edit form, details, complete, archive, and
archive filter, as a calm functional task surface with only weak magic
(background + task-list empty state + success feedback from backend payload).

## Read First
- `docs/10-rebuild-technical-spec.md` § 7.3-7.5
- `docs/10-rebuild-technical-spec.md` § 12.3-12.5
- `docs/10-rebuild-technical-spec.md` § 14.2
- `docs/visual-foundation.md` § 3, § 6, § 10, § 13
- `docs/RULES.md`
- `docs/packets/README.md` § Архитектурный минимум для пакетов

## Scope In
- main tasks page.
- create/edit task form.
- task details page/modal.
- active/completed/archive filters.
- sort controls.
- complete/archive actions.
- category selection from backend metadata.
- reminder form field as P1/deferred integration with P15.
- degraded network states.
- unsaved changes/double-submit handling.
- task-list empty state with subtle decorative magic (shared
  `VisualBackground` low-opacity decor) consuming backend-owned
  `empty_state_text`.
- compact complete-success magic feedback driven ONLY by the backend
  completion payload.

## Scope Out
- No reward popup beyond consuming completion payload.
- No profile/inventory UI.
- No admin UI.
- No client XP calculation.
- No strong magic layer (mascot central, rarity frame/glow) — that is P12.
- No component-side `Math.random()` for visual placement or accent.
- No change to layout from visual random.

## Requirements
- First visible mobile screen shows header, CTA and first tasks without scroll.
- Create task can submit title only.
- Defaults: priority `normal`, complexity `medium`, category `общее`.
- Completed tasks do not visually compete with active tasks.
- Archived tasks are viewable but not in active list.
- Task card shows category, deadline, priority, complexity, and derived overdue
  status.
- Overdue active tasks are ordered/emphasized without storing `overdue` as task
  status.
- Complete button is disabled while request is in flight.
- Client never computes XP/reward.
- Status/rarity/category meaning is not communicated by color only; use
  text/icon labels too.
- Form labels and validation errors are programmatically linked.
- Task stores stay thin: state/loading/error/actions around backend calls.
- Client has no XP authority and no status-transition authority beyond calling
  backend actions.
- Task list uses calm dark translucent surfaces and the visual-state accent
  (`--accent` from P09-1); the decorative layer is background-only and
  low-opacity (shared `VisualBackground`), never a primary status indicator on
  task cards.
- Task cards do NOT use magic decoration as a primary status indicator.
- Overdue/completed/archived statuses remain text/icon labeled, not color-only.
- Complete success may trigger compact magic feedback ONLY from the backend
  completion payload; no client-side random.
- Consume backend-owned UI text from `VisualState`: `task_list_heading` for the
  list heading and `task_button_text` for the primary CTA, plus
  `empty_state_text` for the task-list empty state — not hard-coded component
  copy.
- Visual random changes tokens/texts only, never layout, nav position, card
  structure or status semantics.
- No `Math.random()` in the mobile app for visual placement or accent.

## Acceptance
- task create/list/details/edit/complete/archive flows work against backend.
- repeated tap complete does not create duplicate UI reward event.
- no network shows Russian error and blocks authoritative mutations.
- form errors keep entered fields.
- mobile width 320px has no horizontal scroll.
- accessible labels exist for create/edit/complete/archive/filter actions.
- statuses have text/icon labels, not color-only.
- task-list empty state uses backend `empty_state_text`, not hard-coded copy.
- list heading and primary CTA use backend `task_list_heading` and
  `task_button_text` respectively.
- `rg -n "Math.random|roll_value|final_xp" apps/mobile` finds no UI business
  logic.
- decorative layer is background-only and does not reduce task-card
  readability.

## Escalation
- Stop if backend completion payload is missing required fields.
- Stop if task filters require backend parameters not in OpenAPI.
- Stop if offline mutation queue is requested.
- Stop if `task_list_heading`/`task_button_text`/`empty_state_text` are not
  present in the `VisualState` contract.
