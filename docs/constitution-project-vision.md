# Project Vision For System Constitution

Дата: 2026-05-21.
Статус: project-local contract for `~/.agents/skills/system-constitution/SKILL.md`.

Этот файл не меняет global constitution. Он задает, как применять constitution
roles и feedback loops в репо `/usr/projects/Диплом` во время platform wave.

## 1. Project Goal

Task Companion должен стать client-server platform:

```txt
workspace/server       # Bun + PostgreSQL API, source of truth
workspace/admin-panel  # admin UI over server API
workspace/app          # migrated Android/Nuxt/Capacitor user app
```

Root Nuxt + Capacitor Android app в `/usr/projects/Диплом` является migration
source для `workspace/app`. Его Android runtime, auth/session flow,
login/register/logout, task/profile flow и полезная UI/domain логика должны
быть перенесены и адаптированы на server API.

## 2. Canonical Order

При конфликте документов использовать такой порядок:

1. `docs/specs/workspace-app-android-migration-fix.md` for Q10/app migration.
2. `docs/specs/workspace-app-interface-contract.md` for app UI logic.
3. `docs/specs/platform-wave.md`.
4. `docs/specs/platform-qwen-packets.md`.
5. ADR-029 and ADR-030 in `docs/04-technical-decisions.md`.
6. This file.
7. Root app code as migration source.
8. Legacy MVP-0 docs only as behavior reference.

Old offline-first text does not override platform specs.

## 3. Role Rights In This Repo

| Role | Writes | Must not do |
|---|---|---|
| Operator | `docs/**`, repo-root markdown, operator state files | code edits, server/app/admin implementation |
| Architect | nothing | code edits, style nits, inline implementation |
| Critic | nothing | architecture redesign, style nits |
| Executor | packet `allowed_write_paths` only | docs edits unless docs-only packet, adjacent refactors, architecture choices |

Executor context is bounded to the packet and listed `read_context`. If the
packet does not answer an implementation choice, executor stops instead of
guessing.

## 4. Hard Invariants

- `workspace/app` is not a fresh React/Vite app.
- `workspace/app` is not a blank Nuxt scaffold.
- `workspace/app` preserves Android/Capacitor runtime from root app.
- Auth/session/login/register/logout/task/profile flow migrates from root app
  into `workspace/app`.
- `workspace/app` uses Russian mobile UI from the interface contract, not an
  English generic web scaffold.
- `workspace/server` owns persisted domain state.
- App and admin use server API with Bearer tokens.
- SQLite/local repositories are not source of truth in `workspace/app`.
- App never computes authoritative XP, level, reward roll, item grant, or
  inventory mutation.
- Q11 and Q12 app packets are blocked until Q10 final acceptance passes.
- Server/admin files are not edited by app migration packets.

## 5. Packet Review Loop

Use `PER_PACKET_REVIEW_EVERY=1`.

Every committed packet must pass:

1. Local acceptance commands from the packet.
2. Read-only architect verdict for the packet diff.
3. Read-only critic verdict for the packet diff.

The packet is not done until architect and critic both return ok. If either
gate fails, operator dispatches one bounded fix round, then repeats both gates.
An override requires explicit user approval and evidence in the operator
history.

Strategic review remains separate: after every 3 completed implementation
packets, operator runs meta-goal review against recent packet commits.

## 6. Q10 App Migration Gate

Q10 must execute only through
`docs/specs/workspace-app-android-migration-fix.md`.

Minimum proof:

```bash
cd /usr/projects/Диплом/workspace/app
test -f MIGRATION_MAP.md
test -f package.json && test -f nuxt.config.ts && test -f capacitor.config.ts
test -d android && test -d app && test -f app.vue
test ! -f vite.config.ts && test ! -f index.html && test ! -d src
rg -n "nuxt|@capacitor|pinia|vue|Authorization|Bearer|/auth/login|/tasks|/profile|/progression" package.json app core infrastructure tests
rg -n "Таск Компаньон|Вход|Войти|Регистрация|Добавить задачу|Просроченные|Предстоящие|Без дедлайна|Выполненные|Профиль" app tests
! rg -n "Login|Register|My Tasks|New Task|Complete|Archive|Profile|Inventory|Settings|Logout|Active \\(|Completed \\(" app tests
! rg -n "react|react-dom|react-router-dom|zustand|@vitejs/plugin-react|@capacitor-community/sqlite|auth_session|passwordHash|hashPassword" package.json app core infrastructure tests
bun test
bun run typecheck
bun run build
bunx cap sync android
```

Do not run `cap run android` without explicit user request.

## 7. Escalation

Stop and ask the user when:

- root migration source files are missing;
- server API response shape contradicts the spec;
- app cannot compile without React/Vite or SQLite source-of-truth;
- Android sync cannot pass;
- Q10 requires server/admin edits;
- docs disagree after applying the canonical order;
- architect or critic asks for the second consecutive docs fix on one packet.
