# Platform Docs Critic Pass

Дата: 2026-05-21.
Статус: active doc-drift review.

Scope:

```txt
AGENTS.md
README.md
docs/README.md
docs/06-onboarding-brief.md
docs/04-technical-decisions.md
docs/specs/platform-wave.md
docs/specs/platform-qwen-packets.md
docs/specs/workspace-app-android-migration-fix.md
```

## Findings

### Critical: Legacy Offline-First Rules Still Look Current

`AGENTS.md`, `README.md`, `docs/README.md`, and
`docs/06-onboarding-brief.md` still expose old MVP-0/SQLite/offline-first text
near the top-level entry points. A weak executor can treat those sections as
current and rebuild old persistence, reject REST/auth work, or work in root
instead of `workspace/**`.

Fix:

- mark old sections as legacy reference;
- state that platform specs + ADR-029/030 override old offline-first text;
- say that server/API/auth are required for platform wave.

### Critical: Q10 Must Stay The Only App Migration Contract

`workspace-app-android-migration-fix.md` correctly fixes Q10, but aggregate
packet checks must also reject stale local auth/session patterns. Q10 cannot pass
with hidden `passwordHash`, `auth_session`, local users, React/Vite, or SQLite
source-of-truth.

Fix:

- copy WAPP-F02 forbidden auth checks into Q10 aggregate acceptance;
- require per-packet architect and critic gates.

### High: Q11/Q12 Need Server-API Rails

Q11/Q12 are blocked on Q10, but their contracts must also inherit ADR-030,
`MIGRATION_MAP.md`, and server-source-of-truth rules. They need explicit API
paths and negative checks for local authoritative persistence.

Fix:

- add ADR-030, Q10 fix spec, and `MIGRATION_MAP.md` to read context;
- allow only app UI/API/store/test files needed for server API calls;
- acceptance must grep for `/inventory`, `/settings`, `/visual-state`,
  `Authorization`, and reject `localStorage`, memory repos, SQLite repos, and
  random reward logic.

### High: Packet Gates Must Be Mechanical

The global constitution now requires `PER_PACKET_REVIEW_EVERY=1`, but project
docs must also say every implementation packet needs read-only architect and
critic verdicts before done.

Fix:

- add platform rule for per-packet gates;
- add `gates` fields to Q10 and WAPP-F01..F04;
- state that a failed critic blocks next packet dispatch.

### Medium: ADR Legacy Status Must Be Explicit

ADR-001..004 and ADR-027..028 describe the old offline-first root app. For
platform packets they are superseded by ADR-029/030. Leaving that implicit makes
weak executors preserve SQLite.

Fix:

- mark those ADRs as legacy for platform wave;
- remove wording that waits until after full transition to supersede them.

## Acceptance

The critique is closed only when:

```bash
rg -n "legacy reference|platform specs \\+ ADR-029/030|PER_PACKET_REVIEW_EVERY|workspace-app-android-migration-fix|MIGRATION_MAP" AGENTS.md README.md docs/README.md docs/06-onboarding-brief.md docs/specs/platform-wave.md docs/specs/platform-qwen-packets.md
rg -n "passwordHash|hashPassword|auth_session|findByEmail|role.*admin" docs/specs/platform-qwen-packets.md docs/specs/workspace-app-android-migration-fix.md
rg -n "superseded for platform wave" docs/04-technical-decisions.md
```

