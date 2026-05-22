# Workspace App Interface Critic Pass

Дата: 2026-05-21.
Статус: read-only subagent audit converted into spec fixes.

Scope:

```txt
docs/specs/workspace-app-android-migration-fix.md
docs/specs/platform-qwen-packets.md
docs/specs/platform-wave.md
docs/01-product-vision.md
root app UI files
workspace/app current scaffold
```

## Findings

### Critical: Route And Screen Inventory Was Not Explicit

The wrong `workspace/app` invented a React route tree with English UI and
desktop navigation. Specs now require a phase-based route matrix in
`docs/specs/workspace-app-interface-contract.md`: Q10 `/login`, `/register`,
`/`, `/profile`; Q11 `/inventory`; Q12 `/settings`, `/settings/visual`; no
`/admin`.

### Critical: Auth Guard Behavior Was Underspecified

Specs now require `/auth/me` restore, full-screen Russian loading while pending,
protected-route redirects only after restore failure, public auth route redirect
when already authenticated, and refresh failure clearing only the two allowed
token keys.

### Critical: Task UI Could Degrade To Active/Completed

Specs now require the root grouping order: `Просроченные`, `Предстоящие`,
`Без дедлайна`, `Выполненные`; each group has count and empty state; archived
tasks are hidden; completed tasks have no active actions.

### High: Form/Card/Profile Logic Needed Concrete UI Rules

Specs now require title/description lengths, priority and complexity labels,
suggested-complexity badge, disabled submit/action states, `ru-RU` due dates,
server-owned profile/progression, and bans on local level/XP/reward calculation.

### High: Reward/Inventory/Settings Needed Positive UI Shape

Q11/Q12 now inherit the interface contract. Reward popup must render server item
payload; inventory must show item image/name/rarity/slot/equipped state; settings
must use server API and must not schedule push notifications in Q12.

### High: Mobile Layout Needed Acceptance Checks

Specs now check viewport-fit, `100dvh`, safe-area, 44px touch targets,
focus-visible, reduced motion, Russian copy, accessible loading/error states,
and absence of English scaffold labels.

## Applied Fixes

- Added `docs/specs/workspace-app-interface-contract.md`.
- Added WAPP-F05 interface logic gate to
  `docs/specs/workspace-app-android-migration-fix.md`.
- Updated Q10 to execute WAPP-F01..WAPP-F05.
- Added interface contract to Q11/Q12 read context and acceptance.
- Linked the contract from platform docs, onboarding, README, AGENTS, and
  project constitution vision.

