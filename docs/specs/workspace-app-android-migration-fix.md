# Workspace App Android Migration Fix Spec

Дата: 2026-05-21.
Статус: canonical fix spec for Q10.
Target executor: Kimi / weak-model executor.

## 1. Non-Negotiable Goal

Replace the wrong fresh React/Vite `workspace/app` with a migrated Nuxt +
Capacitor Android app based on the current root app, then adapt auth and task
flow to `workspace/server` API.

This is not a redesign task. This is not a new app scaffold task. This is a
repair-and-migration task.

## 2. Priority Order

When files conflict, follow this order:

1. This file.
2. `docs/specs/workspace-app-interface-contract.md`.
3. `docs/specs/platform-wave.md`.
4. `docs/specs/platform-qwen-packets.md`.
5. ADR-029 and ADR-030 in `docs/04-technical-decisions.md`.
6. Root app code as migration source.
7. Old MVP-0 docs only as behavior reference.

Old text saying auth/server/REST is Post-MVP is legacy offline-first text. It
does not apply to this platform migration.

## 3. Current State Facts

Root app exists and is the migration source:

```txt
/usr/projects/Диплом/package.json
/usr/projects/Диплом/nuxt.config.ts
/usr/projects/Диплом/capacitor.config.ts
/usr/projects/Диплом/android/
/usr/projects/Диплом/app.vue
/usr/projects/Диплом/app/
/usr/projects/Диплом/assets/
/usr/projects/Диплом/public/
/usr/projects/Диплом/core/
/usr/projects/Диплом/infrastructure/
/usr/projects/Диплом/plugins/
/usr/projects/Диплом/tests/
```

Wrong app exists and must be replaced:

```txt
/usr/projects/Диплом/workspace/app/package.json   # React/Vite/Zustand
/usr/projects/Диплом/workspace/app/vite.config.ts
/usr/projects/Диплом/workspace/app/index.html
/usr/projects/Диплом/workspace/app/src/
/usr/projects/Диплом/workspace/app/tests/*.tsx
```

`workspace/server` and `workspace/admin-panel` are not the target of this fix.
Do not rewrite them from app packets.

## 4. Architecture That Must Exist After The Fix

```txt
workspace/server
  Bun + PostgreSQL API
  owns auth, tasks, profile, progression, XP, rewards, inventory, stats

workspace/admin-panel
  admin web app
  uses server API with Bearer admin token

workspace/app
  Nuxt 4 + Vue 3 + Pinia + Capacitor Android app
  migrated from root app
  uses server API with Bearer access token
  does not own domain persistence
```

## 5. Hard Bans

The executor must stop and report spec drift if any ban is violated.

- Do not keep React, React Router, Zustand, Vite, or `src/*.tsx` in
  `workspace/app`.
- Do not create a blank Nuxt app that ignores the root app.
- Do not use SQLite, memory repositories, or localStorage as source of truth for
  tasks, profile, progression, users, inventory, rewards, XP, or levels.
- Do not copy `infrastructure/sqlite/**` into `workspace/app`.
- Do not keep `@capacitor-community/sqlite` in `workspace/app/package.json`.
- Do not keep root local password hashing as the auth implementation.
- Do not keep root `auth_session` logic as the session implementation.
- Do not let app send XP, level, reward roll, item grant, or inventory mutation
  authority except through documented server API actions.
- Do not migrate root `app/pages/admin.vue` into `workspace/app`; admin UI lives
  in `workspace/admin-panel`.
- Do not delete root app files in this fix.
- Do not edit `workspace/server/**` or `workspace/admin-panel/**` in this fix.

Allowed local storage in `workspace/app`:

```txt
task-companion.access-token
task-companion.refresh-token
non-authoritative UI state only
```

## 6. Required Source To Target Mapping

Executor must create this file before code changes:

```txt
/usr/projects/Диплом/workspace/app/MIGRATION_MAP.md
```

It must contain this exact table shape and real status values:

```md
| Source | Target | Action | Status |
|---|---|---|---|
| /usr/projects/Диплом/package.json | /usr/projects/Диплом/workspace/app/package.json | migrate scripts/deps, remove React/Vite/SQLite | pending/done |
| /usr/projects/Диплом/nuxt.config.ts | /usr/projects/Диплом/workspace/app/nuxt.config.ts | migrate, add API runtime config | pending/done |
| /usr/projects/Диплом/capacitor.config.ts | /usr/projects/Диплом/workspace/app/capacitor.config.ts | migrate Android app config | pending/done |
| /usr/projects/Диплом/android/ | /usr/projects/Диплом/workspace/app/android/ | migrate Android project | pending/done |
| /usr/projects/Диплом/app.vue | /usr/projects/Диплом/workspace/app/app.vue | migrate boot shell, adapt to server auth | pending/done |
| /usr/projects/Диплом/app/pages/login.vue | /usr/projects/Диплом/workspace/app/app/pages/login.vue | migrate UI, replace local auth with API | pending/done |
| /usr/projects/Диплом/app/pages/register.vue | /usr/projects/Диплом/workspace/app/app/pages/register.vue | migrate UI, remove role selector, use API | pending/done |
| /usr/projects/Диплом/app/pages/index.vue | /usr/projects/Диплом/workspace/app/app/pages/index.vue | migrate task flow to server API | pending/done |
| /usr/projects/Диплом/app/pages/profile.vue | /usr/projects/Диплом/workspace/app/app/pages/profile.vue | migrate profile UI to server API | pending/done |
| /usr/projects/Диплом/app/components/ | /usr/projects/Диплом/workspace/app/app/components/ | migrate UI components | pending/done |
| /usr/projects/Диплом/app/composables/ | /usr/projects/Диплом/workspace/app/app/composables/ | migrate only UI helpers | pending/done |
| /usr/projects/Диплом/app/stores/ | /usr/projects/Диплом/workspace/app/app/stores/ | migrate state shape, replace repositories with API | pending/done |
| /usr/projects/Диплом/assets/ | /usr/projects/Диплом/workspace/app/assets/ | migrate tokens/css | pending/done |
| /usr/projects/Диплом/public/ | /usr/projects/Диплом/workspace/app/public/ | migrate public assets | pending/done |
| /usr/projects/Диплом/core/domain/task | /usr/projects/Диплом/workspace/app/core/domain/task | migrate read-only client types/helpers | pending/done |
| /usr/projects/Диплом/core/domain/profile | /usr/projects/Диплом/workspace/app/core/domain/profile | migrate display types only | pending/done |
| /usr/projects/Диплом/core/domain/progression | /usr/projects/Диплом/workspace/app/core/domain/progression | migrate display types only | pending/done |
| /usr/projects/Диплом/core/domain/user | /usr/projects/Диплом/workspace/app/core/domain/user | migrate public user types only | pending/done |
| /usr/projects/Диплом/core/use-cases/resolve-task-list.use-case.ts | /usr/projects/Диплом/workspace/app/core/use-cases/resolve-task-list.use-case.ts | migrate grouping helper | pending/done |
| /usr/projects/Диплом/core/use-cases/suggest-task-complexity.use-case.ts | /usr/projects/Диплом/workspace/app/core/use-cases/suggest-task-complexity.use-case.ts | migrate form helper | pending/done |
```

Do not mark a row `done` until the target exists and forbidden persistence has
been removed.

## 7. Required Target Files

After the fix, `workspace/app` must contain at least:

```txt
workspace/app/package.json
workspace/app/nuxt.config.ts
workspace/app/capacitor.config.ts
workspace/app/android/
workspace/app/app.vue
workspace/app/app/pages/index.vue
workspace/app/app/pages/login.vue
workspace/app/app/pages/register.vue
workspace/app/app/pages/profile.vue
workspace/app/app/components/
workspace/app/app/composables/
workspace/app/app/stores/use-auth.store.ts
workspace/app/app/stores/use-task.store.ts
workspace/app/app/stores/use-profile.store.ts
workspace/app/assets/
workspace/app/public/
workspace/app/core/domain/
workspace/app/core/use-cases/resolve-task-list.use-case.ts
workspace/app/core/use-cases/suggest-task-complexity.use-case.ts
workspace/app/infrastructure/api/client.ts
workspace/app/infrastructure/api/auth.api.ts
workspace/app/infrastructure/api/tasks.api.ts
workspace/app/infrastructure/api/profile.api.ts
workspace/app/tests/
workspace/app/MIGRATION_MAP.md
```

The store filenames above are mandatory. Use kebab-case. Do not keep
`useAuthStore.ts` in `workspace/app/app/stores`.

## 8. Required Package Shape

`workspace/app/package.json` must use this stack:

Required dependencies:

```txt
@capacitor/android
@capacitor/cli
@capacitor/core
@pinia/nuxt
nuxt
pinia
vue
vue-router
@fontsource-variable/inter
```

Required dev dependencies:

```txt
@nuxt/test-utils
@vue/test-utils
happy-dom
typescript
vitest
vue-tsc
```

Forbidden dependencies:

```txt
react
react-dom
react-router-dom
zustand
vite
@vitejs/plugin-react
@testing-library/react
@testing-library/user-event
@capacitor-community/sqlite
pg
bcryptjs
```

Required scripts:

```json
{
  "dev": "nuxt dev",
  "build": "nuxt build",
  "generate": "nuxt generate",
  "preview": "nuxt preview",
  "postinstall": "nuxt prepare",
  "test": "vitest run",
  "typecheck": "nuxt typecheck",
  "cap:sync": "cap sync",
  "cap:open": "cap open android"
}
```

## 9. Required API Client Behavior

Create `workspace/app/infrastructure/api/client.ts`.

Behavior:

- Read base URL from `useRuntimeConfig().public.apiBaseUrl`.
- Default base URL is `http://localhost:3000`.
- Store access token under `task-companion.access-token`.
- Store refresh token under `task-companion.refresh-token`.
- Add `Authorization: Bearer <accessToken>` to authenticated requests.
- Send `Content-Type: application/json` when body exists.
- Parse JSON responses.
- Throw typed errors for non-2xx responses.
- On 401, call `/auth/refresh` once when refresh token exists.
- If refresh fails, clear both tokens and route user to `/login`.

`nuxt.config.ts` must contain:

```ts
runtimeConfig: {
  public: {
    apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000",
  },
},
```

Do not hardcode `10.0.2.2` in source code. Use
`NUXT_PUBLIC_API_BASE_URL=http://10.0.2.2:3000` for Android emulator smoke.

## 10. Required Auth Mapping

Root auth UI is source:

```txt
root app/pages/login.vue
root app/pages/register.vue
root app/stores/useAuthStore.ts
root core/domain/user/types.ts
```

Target behavior:

- Keep login page UX and Russian labels.
- Keep register page UX and Russian labels.
- Remove role selector from user app registration.
- Register sends only `{ email, password }` to `POST /auth/register`.
- Because current server register response does not return tokens, register
  must immediately call `POST /auth/login` with the same credentials.
- Login stores `accessToken`, `refreshToken`, and public user from server.
- `GET /auth/me` restores auth state on app load.
- Logout calls `POST /auth/logout` when a token exists, then clears local tokens.
- App header keeps login/logout state.
- Admin route is not migrated into `workspace/app`.

Forbidden auth behavior:

- No local password hash.
- No local users table.
- No client-created admin users from public register page.
- No SQLite `auth_session`.

Expected server shapes:

```ts
type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: { id: string; email: string; role: "user" | "admin"; createdAt: string };
};

type RegisterResponse = {
  id: string;
  email: string;
  role: "user" | "admin";
  created_at: string;
};
```

## 11. Required Task/Profile Mapping

Root task/profile UI is source:

```txt
root app/pages/index.vue
root app/pages/profile.vue
root app/components/task/*
root app/components/profile/*
root app/stores/useTaskStore.ts
root app/stores/useProfileStore.ts
root app/composables/useTaskForm.ts
root app/composables/useTaskList.ts
root core/domain/task/*
root core/domain/profile/*
root core/domain/progression/*
root core/use-cases/resolve-task-list.use-case.ts
root core/use-cases/suggest-task-complexity.use-case.ts
```

Target API calls:

```txt
GET   /tasks
POST  /tasks
PATCH /tasks/:id/complete
PATCH /tasks/:id/archive
GET   /profile
GET   /progression
```

Root UI field mapping to current server task API:

```txt
title                  -> title
description            -> description
dueAt                  -> dueDate
complexity tiny/small  -> difficulty easy
complexity medium      -> difficulty medium
complexity large       -> difficulty hard
category               -> literal "general"
priority               -> not persisted in Q10; display returned server tasks as normal priority
```

Do not persist `priority` locally. If server schema later adds priority, that is
a separate server/API contract packet.

Server task response mapping to client display:

```txt
id          -> id
title       -> title
description -> description
difficulty  -> complexity for UI display
dueDate     -> dueAt
status      -> active/completed/archived equivalent
completedAt -> completedAt
archivedAt  -> archivedAt
createdAt   -> createdAt
```

Complete task behavior:

- Button calls `PATCH /tasks/:id/complete`.
- UI uses server response for XP/progression/reward display.
- UI never computes authoritative XP.
- Repeated complete must render server idempotent response without adding local XP.

Profile behavior:

- Profile page calls `/profile` and `/progression`.
- XP and level display uses server response only.

## 12. Required Cleanup

Delete these wrong `workspace/app` paths during the fix:

```txt
workspace/app/index.html
workspace/app/vite.config.ts
workspace/app/src/
workspace/app/tests/*.tsx
workspace/app/tests/inventory/*.tsx
workspace/app/tests/settings/*.tsx
workspace/app/tsconfig.node.json
workspace/app/dist/
workspace/app/node_modules/
```

Then recreate `workspace/app/tests/` with Vue/Nuxt/Vitest tests only.

Do not delete:

```txt
workspace/server/
workspace/admin-panel/
root app/
root core/
root infrastructure/
root android/
```

## 13. Execution Packets

Run packets in order. Do not run F02 before F01 passes. Do not run F03 before
F02 passes. Do not run F04 before F03 passes. Do not run F05 before F04 passes.

### WAPP-F01 Replace Wrong App Scaffold

```json
{
  "task_id": "WAPP-F01-replace-react-vite-with-nuxt-capacitor",
  "goal": "Replace workspace/app React/Vite scaffold with a migrated Nuxt Capacitor shell from the root app.",
  "non_goals": [
    "Do not implement server API auth.",
    "Do not implement task API flow.",
    "Do not edit workspace/server or workspace/admin-panel.",
    "Do not delete root app files."
  ],
  "allowed_write_paths": [
    "/usr/projects/Диплом/workspace/app/**"
  ],
  "read_context": [
    "/usr/projects/Диплом/docs/specs/workspace-app-android-migration-fix.md",
    "/usr/projects/Диплом/docs/specs/workspace-app-interface-contract.md",
    "/usr/projects/Диплом/package.json",
    "/usr/projects/Диплом/nuxt.config.ts",
    "/usr/projects/Диплом/capacitor.config.ts",
    "/usr/projects/Диплом/android/**",
    "/usr/projects/Диплом/app.vue",
    "/usr/projects/Диплом/app/**",
    "/usr/projects/Диплом/assets/**",
    "/usr/projects/Диплом/public/**"
  ],
  "risk_tier": "public-api",
  "gates": {
    "pre_architect_readonly": "required",
    "post_architect_readonly": "required",
    "post_critic_readonly": "required",
    "critic_must_check": [
      "migration map exists before code changes",
      "Nuxt/Capacitor Android runtime preserved",
      "React/Vite/Zustand removed",
      "no SQLite source-of-truth dependency"
    ]
  },
  "acceptance": [
    "cd /usr/projects/Диплом/workspace/app && test -f MIGRATION_MAP.md",
    "cd /usr/projects/Диплом/workspace/app && test -f package.json && test -f nuxt.config.ts && test -f capacitor.config.ts",
    "cd /usr/projects/Диплом/workspace/app && test -d android && test -d app && test -f app.vue",
    "cd /usr/projects/Диплом/workspace/app && rg -n \"nuxt|@capacitor/core|@capacitor/android|@pinia/nuxt|vue\" package.json",
    "cd /usr/projects/Диплом/workspace/app && test ! -f vite.config.ts && test ! -f index.html && test ! -d src",
    "cd /usr/projects/Диплом/workspace/app && ! rg -n \"react|react-dom|react-router-dom|zustand|@vitejs/plugin-react|@testing-library/react|@capacitor-community/sqlite\" package.json",
    "cd /usr/projects/Диплом/workspace/app && bun install && bun run typecheck"
  ],
  "diff_budget_loc": 900,
  "file_count_max": 80,
  "rollback": "Restore the previous workspace/app tree from git and remove files added by this packet.",
  "escalation_triggers": [
    "Root app files required by the mapping are missing.",
    "Capacitor Android project cannot be copied or preserved.",
    "package.json still requires React, Vite, Zustand, or Capacitor SQLite.",
    "Nuxt typecheck cannot run after two fix attempts."
  ],
  "glossary": {
    "root app": "/usr/projects/Диплом app before migration",
    "source of truth": "workspace/server persisted state, not local app DB"
  }
}
```

### WAPP-F02 Migrate Auth To Server API

```json
{
  "task_id": "WAPP-F02-migrate-auth-to-server-api",
  "goal": "Replace root local auth logic with server Bearer auth in the migrated workspace/app.",
  "non_goals": [
    "Do not add admin registration to workspace/app.",
    "Do not persist users locally.",
    "Do not edit server auth endpoints.",
    "Do not implement tasks."
  ],
  "allowed_write_paths": [
    "/usr/projects/Диплом/workspace/app/**"
  ],
  "read_context": [
    "/usr/projects/Диплом/docs/specs/workspace-app-android-migration-fix.md",
    "/usr/projects/Диплом/docs/specs/workspace-app-interface-contract.md",
    "/usr/projects/Диплом/workspace/server/openapi.json",
    "/usr/projects/Диплом/workspace/server/src/http/auth/login.ts",
    "/usr/projects/Диплом/workspace/server/src/http/auth/register.ts",
    "/usr/projects/Диплом/workspace/server/src/http/auth/me.ts",
    "/usr/projects/Диплом/workspace/server/src/http/auth/refresh.ts",
    "/usr/projects/Диплом/workspace/server/src/http/auth/logout.ts",
    "/usr/projects/Диплом/app/pages/login.vue",
    "/usr/projects/Диплом/app/pages/register.vue",
    "/usr/projects/Диплом/app/stores/useAuthStore.ts"
  ],
  "risk_tier": "security",
  "gates": {
    "pre_architect_readonly": "required",
    "post_architect_readonly": "required",
    "post_critic_readonly": "required",
    "critic_must_check": [
      "Bearer token storage keys only",
      "no local password hash",
      "no auth_session",
      "no public admin registration"
    ]
  },
  "acceptance": [
    "cd /usr/projects/Диплом/workspace/app && test -f infrastructure/api/client.ts && test -f infrastructure/api/auth.api.ts",
    "cd /usr/projects/Диплом/workspace/app && test -f app/stores/use-auth.store.ts",
    "cd /usr/projects/Диплом/workspace/app && rg -n \"/auth/login|/auth/register|/auth/refresh|/auth/logout|/auth/me|Authorization|Bearer|access-token|refresh-token\" infrastructure app tests",
    "cd /usr/projects/Диплом/workspace/app && ! rg -n \"passwordHash|hashPassword|findByEmail|findAll\\(|auth_session|role.*admin\" app infrastructure core tests",
    "cd /usr/projects/Диплом/workspace/app && rg -n \"Регистрация|Вход|Войти|Создать аккаунт\" app/pages/login.vue app/pages/register.vue",
    "cd /usr/projects/Диплом/workspace/app && ! rg -n \"<option value=\\\"admin\\\"|Админ\" app/pages/register.vue",
    "cd /usr/projects/Диплом/workspace/app && bun test && bun run typecheck"
  ],
  "diff_budget_loc": 500,
  "file_count_max": 16,
  "rollback": "Restore workspace/app auth files to the state after WAPP-F01.",
  "escalation_triggers": [
    "Server auth response shape contradicts this spec.",
    "Token storage policy is changed from the two allowed keys.",
    "Register cannot be completed without inventing a server endpoint.",
    "Unauthorized handling cannot be tested."
  ],
  "glossary": {
    "Bearer auth": "Authorization header formatted as Bearer accessToken",
    "public register": "User-facing registration page in workspace/app"
  }
}
```

### WAPP-F03 Migrate Task And Profile Flow To Server API

```json
{
  "task_id": "WAPP-F03-migrate-task-profile-flow-to-server-api",
  "goal": "Replace local task and profile persistence with server API calls in the migrated workspace/app.",
  "non_goals": [
    "Do not edit server task endpoints.",
    "Do not persist task/profile/progression data in localStorage.",
    "Do not implement inventory UI.",
    "Do not compute authoritative XP on the client."
  ],
  "allowed_write_paths": [
    "/usr/projects/Диплом/workspace/app/**"
  ],
  "read_context": [
    "/usr/projects/Диплом/docs/specs/workspace-app-android-migration-fix.md",
    "/usr/projects/Диплом/docs/specs/workspace-app-interface-contract.md",
    "/usr/projects/Диплом/workspace/server/src/http/tasks/list.ts",
    "/usr/projects/Диплом/workspace/server/src/http/tasks/create.ts",
    "/usr/projects/Диплом/workspace/server/src/http/tasks/complete.ts",
    "/usr/projects/Диплом/workspace/server/src/http/tasks/archive.ts",
    "/usr/projects/Диплом/workspace/server/src/http/tasks/profile.ts",
    "/usr/projects/Диплом/workspace/server/src/http/tasks/progression.ts",
    "/usr/projects/Диплом/app/pages/index.vue",
    "/usr/projects/Диплом/app/pages/profile.vue",
    "/usr/projects/Диплом/app/stores/useTaskStore.ts",
    "/usr/projects/Диплом/app/stores/useProfileStore.ts",
    "/usr/projects/Диплом/core/use-cases/resolve-task-list.use-case.ts",
    "/usr/projects/Диплом/core/use-cases/suggest-task-complexity.use-case.ts"
  ],
  "risk_tier": "public-api",
  "gates": {
    "pre_architect_readonly": "required",
    "post_architect_readonly": "required",
    "post_critic_readonly": "required",
    "critic_must_check": [
      "tasks/profile/progression use server API",
      "no local task/profile source of truth",
      "client does not compute authoritative XP",
      "root task/profile flow migrated"
    ]
  },
  "acceptance": [
    "cd /usr/projects/Диплом/workspace/app && test -f infrastructure/api/tasks.api.ts && test -f infrastructure/api/profile.api.ts",
    "cd /usr/projects/Диплом/workspace/app && test -f app/stores/use-task.store.ts && test -f app/stores/use-profile.store.ts",
    "cd /usr/projects/Диплом/workspace/app && rg -n \"/tasks|/profile|/progression|PATCH|complete|archive|difficulty|category\" infrastructure app tests",
    "cd /usr/projects/Диплом/workspace/app && rg -n \"tiny|small|medium|large|easy|hard|general\" infrastructure app core tests",
    "cd /usr/projects/Диплом/workspace/app && ! rg -n \"createTask\\(|completeTask\\(|grantTaskXp|applyLevelProgress|Sqlite|schema_migrations|localStorage.*task|localStorage.*profile\" app infrastructure core tests",
    "cd /usr/projects/Диплом/workspace/app && bun test && bun run typecheck"
  ],
  "diff_budget_loc": 650,
  "file_count_max": 22,
  "rollback": "Restore workspace/app task and profile files to the state after WAPP-F02.",
  "escalation_triggers": [
    "Server task response shape contradicts this spec.",
    "Task priority persistence is required by a test or product requirement.",
    "Client code computes authoritative XP or levels.",
    "Task flow cannot be implemented without local persistence."
  ],
  "glossary": {
    "authoritative XP": "XP value persisted or accepted as source of truth",
    "difficulty mapping": "client complexity to server difficulty mapping in section 11"
  }
}
```

### WAPP-F04 Android And Drift Gates

```json
{
  "task_id": "WAPP-F04-android-and-drift-gates",
  "goal": "Add verification gates that prove workspace/app is migrated Nuxt Capacitor and not React SQLite drift.",
  "non_goals": [
    "Do not add new product screens.",
    "Do not edit server behavior.",
    "Do not edit admin-panel behavior.",
    "Do not run cap run android."
  ],
  "allowed_write_paths": [
    "/usr/projects/Диплом/workspace/app/**"
  ],
  "read_context": [
    "/usr/projects/Диплом/docs/specs/workspace-app-android-migration-fix.md",
    "/usr/projects/Диплом/docs/specs/workspace-app-interface-contract.md",
    "/usr/projects/Диплом/workspace/app/MIGRATION_MAP.md"
  ],
  "risk_tier": "public-api",
  "gates": {
    "pre_architect_readonly": "required",
    "post_architect_readonly": "required",
    "post_critic_readonly": "required",
    "critic_must_check": [
      "final drift gates fail on React/Vite",
      "final drift gates fail on SQLite source-of-truth",
      "Android sync and manifest checks pass",
      "no cap run android"
    ]
  },
  "acceptance": [
    "cd /usr/projects/Диплом/workspace/app && bun test && bun run typecheck && bun run build",
    "cd /usr/projects/Диплом/workspace/app && bunx cap sync android",
    "cd /usr/projects/Диплом/workspace/app && test -f android/app/src/main/AndroidManifest.xml",
    "cd /usr/projects/Диплом/workspace/app && rg -n \"android.permission.INTERNET\" android/app/src/main/AndroidManifest.xml android/app/src/main",
    "cd /usr/projects/Диплом/workspace/app && test ! -f vite.config.ts && test ! -d src",
    "cd /usr/projects/Диплом/workspace/app && ! rg -n \"react|react-dom|react-router-dom|zustand|@vitejs/plugin-react|@testing-library/react|@capacitor-community/sqlite|Sqlite.*Repository|schema_migrations\" package.json app core infrastructure tests",
    "cd /usr/projects/Диплом/workspace/app && ! rg -n \"passwordHash|hashPassword|findByEmail|findAll\\(|auth_session|local.*users|role.*admin|<option value=\\\"admin\\\"|Админ\" app core infrastructure tests",
    "cd /usr/projects/Диплом/workspace/app && rg -n \"nuxt|@capacitor|pinia|vue|Authorization|Bearer|/auth/login|/tasks|/profile|/progression\" package.json app core infrastructure tests"
  ],
  "diff_budget_loc": 220,
  "file_count_max": 8,
  "rollback": "Remove only verification files added by this packet.",
  "escalation_triggers": [
    "Capacitor sync fails after two fix attempts.",
    "React/Vite files still exist.",
    "SQLite source-of-truth code still exists.",
    "Android INTERNET permission is absent."
  ],
  "glossary": {
    "drift gate": "Command that fails when the wrong architecture remains",
    "cap sync": "Capacitor project sync, not launching an emulator"
  }
}
```

### WAPP-F05 Interface Logic Gates

```json
{
  "task_id": "WAPP-F05-interface-logic-gates",
  "goal": "Implement the workspace/app interface contract with Russian mobile screens and state handling.",
  "non_goals": [
    "Do not add inventory or settings routes in Q10.",
    "Do not edit workspace/server or workspace/admin-panel.",
    "Do not create a landing page.",
    "Do not keep English React scaffold UI."
  ],
  "allowed_write_paths": [
    "/usr/projects/Диплом/workspace/app/**"
  ],
  "read_context": [
    "/usr/projects/Диплом/docs/specs/workspace-app-interface-contract.md",
    "/usr/projects/Диплом/docs/specs/workspace-app-android-migration-fix.md",
    "/usr/projects/Диплом/app.vue",
    "/usr/projects/Диплом/app/pages/index.vue",
    "/usr/projects/Диплом/app/pages/login.vue",
    "/usr/projects/Диплом/app/pages/register.vue",
    "/usr/projects/Диплом/app/pages/profile.vue",
    "/usr/projects/Диплом/app/components/task/TaskCreateForm.vue",
    "/usr/projects/Диплом/app/components/task/TaskCard.vue",
    "/usr/projects/Диплом/app/components/task/TaskList.vue",
    "/usr/projects/Диплом/app/components/ui/AppHeader.vue",
    "/usr/projects/Диплом/app/components/ui/EmptyState.vue",
    "/usr/projects/Диплом/app/components/ui/ErrorState.vue",
    "/usr/projects/Диплом/app/components/ui/LoadingState.vue"
  ],
  "risk_tier": "public-api",
  "gates": {
    "pre_architect_readonly": "required",
    "post_architect_readonly": "required",
    "post_critic_readonly": "required",
    "critic_must_check": [
      "route guards follow interface contract",
      "Russian mobile UI copy replaces English scaffold copy",
      "task groups match root app order",
      "loading empty error states exist",
      "no local XP or reward calculation"
    ]
  },
  "acceptance": [
    "cd /usr/projects/Диплом/workspace/app && test ! -d src",
    "cd /usr/projects/Диплом/workspace/app && rg -n \"Таск Компаньон|Вход|Войти|Регистрация|Создать аккаунт|Добавить задачу|Просроченные|Предстоящие|Без дедлайна|Выполненные|Профиль|Выполнить|В архив\" app tests",
    "cd /usr/projects/Диплом/workspace/app && rg -n \"Низкий|Обычный|Высокий|Крошечная|Маленькая|Средняя|Большая|Подобрано автоматически\" app tests",
    "cd /usr/projects/Диплом/workspace/app && rg -n \"Загрузка|Что-то пошло не так|Повторить|role=\\\"status\\\"|role=\\\"alert\\\"|aria-live\" app tests",
    "cd /usr/projects/Диплом/workspace/app && rg -n \"viewport-fit=cover|100dvh|safe-area|prefers-reduced-motion|44px|focus-visible\" app assets tests",
    "cd /usr/projects/Диплом/workspace/app && ! rg -n \">Login<|>Register<|>My Tasks<|>New Task<|>Complete<|>Archive<|>Profile<|>Inventory<|>Settings<|>Logout<|Active \\(|Completed \\(\" app tests",
    "cd /usr/projects/Диплом/workspace/app && ! rg -n \"role.*admin|<option value=\\\"admin\\\"|Админ|/admin\" app tests",
    "cd /usr/projects/Диплом/workspace/app && ! rg -n \"Math.random|crypto.getRandomValues|['\\\"]accessToken['\\\"]|localStorage.*task|localStorage.*profile|localStorage.*inventory|localStorage.*settings|localStorage.*visual|Memory.*Repository|Sqlite.*Repository|schema_migrations|computeLevel|computeProgress|XP_PER_LEVEL|grantTaskXp|applyLevelProgress\" app core infrastructure tests",
    "cd /usr/projects/Диплом/workspace/app && bun test && bun run typecheck && bun run build"
  ],
  "diff_budget_loc": 520,
  "file_count_max": 18,
  "rollback": "Restore workspace/app interface files to the state after WAPP-F04.",
  "escalation_triggers": [
    "Interface contract contradicts current server API response shape.",
    "Russian route labels cannot be rendered without adding a new UI framework.",
    "Mobile layout checks cannot pass after two fix attempts.",
    "Protected route behavior cannot be tested."
  ],
  "glossary": {
    "interface contract": "docs/specs/workspace-app-interface-contract.md",
    "generic web scaffold": "English desktop-oriented UI copied from the wrong React/Vite workspace/app"
  }
}
```

## 14. Final Acceptance

Run all commands from repo root:

```bash
cd /usr/projects/Диплом/workspace/app && test -f MIGRATION_MAP.md
cd /usr/projects/Диплом/workspace/app && test -f package.json && test -f nuxt.config.ts && test -f capacitor.config.ts
cd /usr/projects/Диплом/workspace/app && test -d android && test -d app && test -f app.vue
cd /usr/projects/Диплом/workspace/app && test ! -f vite.config.ts && test ! -f index.html && test ! -d src
cd /usr/projects/Диплом/workspace/app && rg -n "nuxt|@capacitor/core|@capacitor/android|@pinia/nuxt|vue|pinia" package.json
cd /usr/projects/Диплом/workspace/app && ! rg -n "react|react-dom|react-router-dom|zustand|@vitejs/plugin-react|@testing-library/react|@capacitor-community/sqlite|Sqlite.*Repository|schema_migrations" package.json app core infrastructure tests
cd /usr/projects/Диплом/workspace/app && ! rg -n "passwordHash|hashPassword|findByEmail|findAll\(|auth_session|local.*users|role.*admin|<option value=\"admin\"|Админ" app core infrastructure tests
cd /usr/projects/Диплом/workspace/app && rg -n "/auth/login|/auth/register|/auth/refresh|/auth/logout|/auth/me|Authorization|Bearer" app infrastructure tests
cd /usr/projects/Диплом/workspace/app && rg -n "/tasks|/profile|/progression|difficulty|category|general" app infrastructure core tests
cd /usr/projects/Диплом/workspace/app && rg -n "Таск Компаньон|Вход|Войти|Регистрация|Создать аккаунт|Добавить задачу|Просроченные|Предстоящие|Без дедлайна|Выполненные|Профиль|Выполнить|В архив" app tests
cd /usr/projects/Диплом/workspace/app && rg -n "Низкий|Обычный|Высокий|Крошечная|Маленькая|Средняя|Большая|Подобрано автоматически" app tests
cd /usr/projects/Диплом/workspace/app && rg -n "viewport-fit=cover|100dvh|safe-area|prefers-reduced-motion|44px|focus-visible" app assets tests
cd /usr/projects/Диплом/workspace/app && ! rg -n ">Login<|>Register<|>My Tasks<|>New Task<|>Complete<|>Archive<|>Profile<|>Inventory<|>Settings<|>Logout<|Active \(|Completed \(" app tests
cd /usr/projects/Диплом/workspace/app && ! rg -n "Math.random|crypto.getRandomValues|['\"]accessToken['\"]|localStorage.*task|localStorage.*profile|localStorage.*inventory|localStorage.*settings|localStorage.*visual|Memory.*Repository|Sqlite.*Repository|schema_migrations|computeLevel|computeProgress|XP_PER_LEVEL|grantTaskXp|applyLevelProgress" app core infrastructure tests
cd /usr/projects/Диплом/workspace/app && bun test
cd /usr/projects/Диплом/workspace/app && bun run typecheck
cd /usr/projects/Диплом/workspace/app && bun run build
cd /usr/projects/Диплом/workspace/app && bunx cap sync android
```

Do not run `cap run android` unless the user explicitly asks.

## 15. Autoplan Multifactor Review Gates

This section applies the `autoplan` review frame: CEO, design, engineering, and
DX. It is written into the spec so Kimi does not have to run an interactive
review or choose tradeoffs.

### 15.1 Spec Drift Gate

Fail if any is true:

- `workspace/app` still has React/Vite/Zustand.
- `workspace/app` lacks Nuxt/Capacitor markers.
- `workspace/app` uses SQLite/local repositories for domain state.
- Executor changed server/admin to make app tests pass.
- Executor used old MVP-0 docs to override this file.

### 15.2 CEO Review

Decision: replace wrong app, do not patch React/Vite.

Reason: patching React/Vite preserves the exact drift that caused the failure.
The product goal is mobile Android app, so the migration must keep Capacitor and
the existing mobile UX.

### 15.3 Design Review

Decision: preserve root app mobile screens and Russian UX copy unless server API
forces data mapping.

Reason: user-facing value already exists in root task/profile/auth screens.
Fresh UI would add risk and lose work.

### 15.4 Engineering Review

Decision: split into F01-F04 and close write scope to `workspace/app/**`.

Reason: server/admin are separate surfaces. The app fix can be verified by
negative drift checks and Nuxt/Capacitor build checks.

### 15.5 DX Review

Decision: acceptance commands are literal, runnable, and fail fast.

Reason: weak executor must not infer stack, paths, auth transport, or persistence
model. Commands catch the most likely wrong outputs.

## 16. Stop Conditions

Stop and report blockers instead of guessing when:

- Server endpoint response differs from section 10 or 11.
- App cannot compile without reintroducing React/Vite.
- App cannot compile without SQLite source-of-truth code.
- Android project cannot be synced after migration.
- Required root source files are missing.
- Existing `workspace/app` files cannot be safely removed because they contain
  uncommitted human work not represented in this spec.

End of spec.
