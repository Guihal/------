# Packet P14: Quality, Smoke, Demo Acceptance

## Goal
Add automated and manual verification for auth, task, reward, inventory, admin, accessibility, and demo flow.

## Read First
- `docs/10-rebuild-technical-spec.md` § 8.5
- `docs/10-rebuild-technical-spec.md` § 9.5
- `docs/10-rebuild-technical-spec.md` § 15-17
- `docs/RULES.md`
- `docs/packets/README.md` § Архитектурный минимум для пакетов

## Scope In
- backend test matrix.
- API smoke test.
- frontend build/typecheck/test commands.
- mobile viewport smoke.
- admin smoke.
- demo seed verification.
- accessibility checklist.
- final demo script.

## Scope Out
- No new product features.
- No new reward mechanics.
- No visual redesign beyond fixing acceptance failures.
- No production deployment.

## Requirements
- Demo path:
  1. register user;
  2. create first task by title;
  3. complete task;
  4. show XP/multiplier/reward or no-drop;
  5. open profile;
  6. open inventory;
  7. equip item if available;
  8. prove another user cannot see data;
  9. admin login;
  10. view users/items/audit.
- Acceptance must include OpenAPI, migrations, seed, auth rotation, concurrent complete, admin RBAC, upload validation, mobile layout, and accessibility checks.
- Audit verification covers login success, login failure threshold, admin login, admin role failure, task completion, task reward roll, level reward, equip/unequip, item mutation, and asset upload.
- Verification must check thin Pinia stores, backend source of truth,
  OpenAPI/DTO boundary, and no frontend XP/reward/random authority.

## Acceptance
- `cd backend && go test ./...` passes.
- backend smoke registers user, completes task and verifies reward audit.
- admin build/typecheck/test pass.
- mobile build/typecheck/test pass.
- 320px mobile screenshot has no horizontal scroll and bottom nav does not cover content.
- audit log contains auth, complete, reward, equip/admin events after smoke.
- WCAG AA smoke checklist passes for labels, focus, color contrast, non-color-only status, and `aria-live` reward/error feedback.

## Escalation
- Stop if smoke requires manual DB edits.
- Stop if seed cannot create deterministic demo state.
- Stop if a P1/P2 feature blocks P0 demo acceptance.
