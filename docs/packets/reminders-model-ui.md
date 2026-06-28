# Packet P15: Reminders Model and UI

## Goal
Implement reminder data model, backend validation, and mobile reminder UI without native push scheduling.

## Read First
- `docs/10-rebuild-technical-spec.md` § 7.9-7.10
- `docs/10-rebuild-technical-spec.md` § 11.3
- `docs/10-rebuild-technical-spec.md` § 14.4
- `docs/10-rebuild-technical-spec.md` § 15
- `docs/RULES.md`
- `docs/packets/README.md` § Архитектурный минимум для пакетов

## Scope In
- reminder API:
  - `GET /tasks/:id/reminder`
  - `PUT /tasks/:id/reminder`
  - `DELETE /tasks/:id/reminder`
- `notification_settings` API fields used by mobile settings.
- mobile task form reminder field.
- mobile settings toggles for reminder defaults.
- backend validation and ownership checks.
- lifecycle hooks for P05 archive and P06 complete status transitions.

## Scope Out
- No native push.
- No background scheduler.
- No remote notifications.
- No calendar integration.

## Requirements
- Completed tasks cannot have active reminders.
- Archived tasks cannot have active reminders.
- Reminder time must belong to the authenticated user's task.
- `notifications_enabled` disables reminder creation in UI and returns clear backend error for mutations.
- `default_reminder_minutes_before_deadline` pre-fills task form only when task has deadline.
- Offline mobile state can show cached reminder values, but reminder mutations are blocked with explicit error.
- P15 patches P05 archive lifecycle so archived tasks deactivate reminders in the same status transition.
- P15 patches P06 complete lifecycle so completed tasks deactivate reminders in the complete transaction.
- Reminder lifecycle transitions are backend service/usecase integration.
- UI only submits requested reminder metadata.

## Acceptance
- `cd backend && go test ./...` passes reminder validation tests.
- task form can create/edit/remove reminder metadata.
- settings can toggle notifications and default reminder offset.
- completed/archive transition cancels or deactivates active reminders.
- P05 archive and P06 complete tests cover reminder deactivation after P15 is applied.
- no Capacitor local notification scheduling is required in this packet.

## Escalation
- Stop if native notifications become required for acceptance.
- Stop if reminder creation needs trusted client `user_id`.
- Stop if reminder lifecycle conflicts with complete/archive transaction.
