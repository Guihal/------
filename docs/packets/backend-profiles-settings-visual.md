# Packet P04: Profiles, Settings, Visual State

## Goal
Implement profile, settings, and visual-state APIs as backend-owned data.

## Read First
- `docs/10-rebuild-technical-spec.md` § 7.2
- `docs/10-rebuild-technical-spec.md` § 7.10-7.11
- `docs/10-rebuild-technical-spec.md` § 12.7
- `docs/10-rebuild-technical-spec.md` § 14.5
- `docs/RULES.md`
- `docs/packets/README.md` § Архитектурный минимум для пакетов

## Scope In
- `GET /profile`
- `PATCH /profile`
- `GET /profile/progression`
- `GET /settings`
- `PATCH /settings`
- `GET /visual-state`
- `POST /visual-state/refresh`
- backend whitelist of visual tokens and texts.

## Scope Out
- No frontend visual implementation.
- No task completion integration.
- No random in frontend.
- No large theme system beyond defined token slots.

## Requirements
- Visual state is persisted per user.
- Visual state changes only allowed token values.
- `disable_visual_randomness` returns last state without reroll.
- `reduced_motion` is stored in settings.
- Settings include `notifications_enabled`.
- Settings include `default_reminder_minutes_before_deadline`.
- Invalid/unavailable visual state must have stable dark fallback.
- Client never chooses random visual state.
- Visual-state refresh is a backend service/usecase.
- Frontend only applies returned visual-state data.

## Acceptance
- `cd backend && go test ./...` passes profile/settings/visual tests.
- visual refresh persists new state when enabled.
- visual refresh does not reroll when disabled.
- API never returns arbitrary colors outside whitelist.
- OpenAPI documents settings and visual-state schemas.

## Escalation
- Stop if visual random requires component-side randomness.
- Stop if token whitelist is not defined.
- Stop if settings keys conflict with seed data.
