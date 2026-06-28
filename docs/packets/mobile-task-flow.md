# Packet P11: Mobile Task Flow

## Goal
Implement mobile task list, create/edit form, details, complete, archive, and archive filter.

## Read First
- `docs/10-rebuild-technical-spec.md` § 7.3-7.5
- `docs/10-rebuild-technical-spec.md` § 12.3-12.5
- `docs/10-rebuild-technical-spec.md` § 14.2
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

## Scope Out
- No reward popup beyond consuming completion payload.
- No profile/inventory UI.
- No admin UI.
- No client XP calculation.

## Requirements
- First visible mobile screen shows header, CTA and first tasks without scroll.
- Create task can submit title only.
- Defaults: priority `normal`, complexity `medium`, category `общее`.
- Completed tasks do not visually compete with active tasks.
- Archived tasks are viewable but not in active list.
- Task card shows category, deadline, priority, complexity, and derived overdue status.
- Overdue active tasks are ordered/emphasized without storing `overdue` as task status.
- Complete button is disabled while request is in flight.
- Client never computes XP/reward.
- Status/rarity/category meaning is not communicated by color only.
- Form labels and validation errors are programmatically linked.
- Task stores stay thin: state/loading/error/actions around backend calls.
- Client has no XP authority and no status-transition authority beyond calling
  backend actions.

## Acceptance
- task create/list/details/edit/complete/archive flows work against backend.
- repeated tap complete does not create duplicate UI reward event.
- no network shows Russian error and blocks authoritative mutations.
- form errors keep entered fields.
- mobile width 320px has no horizontal scroll.
- accessible labels exist for create/edit/complete/archive/filter actions.

## Escalation
- Stop if backend completion payload is missing required fields.
- Stop if task filters require backend parameters not in OpenAPI.
- Stop if offline mutation queue is requested.
