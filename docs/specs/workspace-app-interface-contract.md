# Workspace App Interface Contract

Дата: 2026-05-21.
Статус: mandatory UI contract for `workspace/app`.
Target executor: Kimi / weak-model executor.

This file exists because weak executors tend to build a generic web scaffold.
`workspace/app` must be a mobile Task Companion interface migrated from the root
Nuxt app, not a new English dashboard.

## 1. Priority

Use this file together with:

1. `docs/specs/workspace-app-android-migration-fix.md`.
2. `docs/specs/platform-wave.md`.
3. `docs/specs/platform-qwen-packets.md`.
4. ADR-030 in `docs/04-technical-decisions.md`.
5. Root app UI files as migration source.

If this file conflicts with old offline-first docs, this file wins for
`workspace/app`.

## 2. UI Source Files

Read these root files before changing `workspace/app` UI:

```txt
/usr/projects/Диплом/app.vue
/usr/projects/Диплом/app/pages/index.vue
/usr/projects/Диплом/app/pages/login.vue
/usr/projects/Диплом/app/pages/register.vue
/usr/projects/Диплом/app/pages/profile.vue
/usr/projects/Диплом/app/components/task/TaskCreateForm.vue
/usr/projects/Диплом/app/components/task/TaskCard.vue
/usr/projects/Диплом/app/components/task/TaskList.vue
/usr/projects/Диплом/app/components/ui/AppHeader.vue
/usr/projects/Диплом/app/components/ui/EmptyState.vue
/usr/projects/Диплом/app/components/ui/ErrorState.vue
/usr/projects/Диплом/app/components/ui/LoadingState.vue
/usr/projects/Диплом/app/stores/useAuthStore.ts
/usr/projects/Диплом/app/stores/useTaskStore.ts
/usr/projects/Диплом/app/stores/useProfileStore.ts
/usr/projects/Диплом/app/composables/useTaskForm.ts
/usr/projects/Диплом/app/composables/useTaskList.ts
/usr/projects/Диплом/app/composables/useTaskLoading.ts
/usr/projects/Диплом/app/composables/useTaskValidation.ts
```

Do not read current `workspace/app/src/**` as UI source. It is the wrong
React/Vite scaffold and must be deleted by Q10.

## 3. Route Map

Route inventory:

| Route | Phase | Access | Screen |
|---|---|---|---|
| `/login` | Q10 | public | login |
| `/register` | Q10 | public | registration |
| `/` | Q10 | authenticated | task list |
| `/profile` | Q10 | authenticated | profile/progression |
| `/inventory` | Q11 | authenticated | inventory/equipment |
| `/settings` | Q12 | authenticated | settings |
| `/settings/visual` | Q12 | authenticated | visual state |

Rules:

- Unauthenticated user visiting `/` or `/profile` is routed to `/login`.
- Authenticated user visiting `/login` or `/register` is routed to `/`.
- `/admin` is not present in `workspace/app`.
- Q10 does not create `/inventory`, `/settings`, or `/settings/visual`; Q11/Q12
  add them after Q10 final acceptance.

Auth guard:

- On app boot, call `GET /auth/me` once when `task-companion.access-token`
  exists.
- While auth restore is pending, show full-screen Russian loading state.
- Protected routes redirect to `/login` only after restore fails.
- `/login` and `/register` redirect to `/` when restore proves the user is
  authenticated.
- 401 refresh failure clears `task-companion.access-token` and
  `task-companion.refresh-token`.

## 4. App Shell

`workspace/app/app.vue` must provide:

- `lang="ru"` in `useHead`.
- mobile viewport with `viewport-fit=cover`.
- safe-area padding support.
- boot loading state with visible text `Загрузка...` or `Загрузка…`.
- boot error state with retry or reload text.
- skip link `Перейти к содержимому`.
- global focus-visible outline.
- no marketing hero, no landing page, no dashboard intro.

## 5. Header And Navigation

The header must be compact and mobile-first.

Required when authenticated:

- brand text `Таск Компаньон`;
- task link to `/`;
- profile link to `/profile`;
- logout button `Выйти`;
- current profile name or email;
- XP/progression summary when loaded.

After Q11:

- inventory link `Инвентарь` to `/inventory`.

After Q12:

- settings link `Настройки` to `/settings`.

Required when unauthenticated:

- login link `Войти`;
- register link `Регистрация`.

Forbidden:

- admin link;
- desktop-only horizontal nav that overflows on 360px width;
- English labels such as `Login`, `Register`, `My Tasks`, `Profile`,
  `Inventory`, `Settings`, `Complete`, `Archive`, `New Task`.

## 6. Auth Screens

`/login`:

- page title `Вход`;
- email input with `autocomplete="email"`;
- password input with `autocomplete="current-password"`;
- submit button `Войти`;
- link to `/register` with text `Регистрация`;
- loading disables submit and inputs;
- error is visible in `role="alert"` or `aria-live`.

`/register`:

- page title `Регистрация`;
- email input with `autocomplete="email"`;
- password input with `autocomplete="new-password"`;
- submit button `Создать аккаунт`;
- link to `/login` with text `Уже есть аккаунт`;
- no role selector;
- no admin option;
- no local user table;
- after successful register, call login and route to `/`.

Name field:

- If server register accepts only `{ email, password }`, do not show a required
  name field in Q10.
- If a display name is needed later, add it in a separate server/API contract
  packet.

## 7. Main Task Screen

`/` is the main daily screen. It is not a dashboard.

Required layout order:

1. Header.
2. One full-width primary action `Добавить задачу`.
3. Task creation form only when the action is opened.
4. Task groups in this exact order:
   - `Просроченные`;
   - `Предстоящие`;
   - `Без дедлайна`;
   - `Выполненные`.

Required states:

- initial loading state while `/tasks`, `/profile`, and `/progression` load;
- error state with retry when loading fails;
- empty state per group;
- per-task loading state for complete/archive actions;
- form submit loading state.
- required Russian state copy: `Загрузка…`, `Что-то пошло не так`,
  `Повторить`, `Нет активных задач`, `Нет предметов в инвентаре`.

Task creation form:

- title is the only required field;
- title has `maxlength="100"`;
- description is optional;
- description has `maxlength="2000"`;
- due date is optional;
- priority select is visible with labels `Низкий`, `Обычный`, `Высокий`;
- complexity is visible and editable: `Крошечная`, `Маленькая`, `Средняя`,
  `Большая`;
- suggested complexity badge text: `Подобрано автоматически`;
- Q10 does not persist priority locally and does not send priority unless the
  server API explicitly supports it;
- if priority is later added to server API, implement persistence in a separate
  server/API contract packet.

Task card:

- title;
- description when present;
- priority label: `Низкий`, `Обычный`, `Высокий`;
- complexity label;
- due date formatted with `ru-RU` when present;
- active task actions: `Выполнить`, `В архив`;
- completed tasks do not show `Выполнить` or `В архив`;
- no hard delete action;
- no client-side XP calculation.

## 8. Profile Screen

`/profile` must load server `/profile` and `/progression`.

Required content:

- page title `Профиль`;
- back link `Назад`;
- user name or email;
- current level;
- total XP;
- progress to next level when server returns enough data;
- completed task count when server returns it.
- client may compute percent for a progress bar only from server-returned
  display values.

Required states:

- loading state;
- error state with retry;
- empty fallback if profile/progression response is missing optional fields.

Forbidden:

- admin role management;
- user list;
- local XP mutation;
- profile state invented on the client.
- importing or calling root `computeLevel`, `computeProgress`, `XP_PER_LEVEL`,
  `grantTaskXp`, or `applyLevelProgress`.

## 9. Reward, Inventory, Settings Handoff

Q10:

- does not implement inventory page;
- does not implement settings page;
- does not implement reward roll logic;
- may store the last server reward response only as transient UI state if the
  server returns it from complete-task.

Q11:

- adds `/inventory`;
- adds inventory and reward popup UI;
- reward popup renders server payload only: image, item name, description,
  rarity, slot, `XP xN`, close button, and link `В инвентарь`;
- inventory page lists item image, name, rarity, slot, equipped state, and
  `Надеть`/`Снять`;
- equip/unequip calls server API;
- no local inventory source of truth.

Q12:

- adds `/settings`;
- adds `/settings/visual`;
- settings and visual state are loaded/saved through server API;
- no component random;
- no local authoritative settings persistence.
- settings page includes visual randomness, reduced motion, and reminder config
  entries;
- Q12 does not schedule push notifications.

## 10. Mobile Layout And Accessibility

Required:

- max readable content width on tablet/desktop; full mobile width with padding;
- no horizontal overflow at 360px width;
- tap targets at least 44px high;
- focus-visible styles on links, buttons, inputs, selects, textareas;
- `prefers-reduced-motion` disables non-essential animation;
- text wraps instead of overlapping;
- Russian UI copy for user-facing labels and errors;
- loading states use `role="status"` or `aria-live="polite"`;
- error states use `role="alert"` or `aria-live`.

Forbidden:

- landing page hero;
- dashboard cards unrelated to task flow;
- nested cards;
- English UI labels from the wrong React app;
- two-section `Active`/`Completed` task UI;
- Tailwind utility-class scaffold copied from `workspace/app/src/**`;
- token key `accessToken`;
- icons/emoji as the only way to understand an action;
- visual random that changes layout, task order, or button placement.

## 11. Required UI Tests

Q10 must include Vue/Nuxt/Vitest tests that prove:

- login screen renders `Вход`, `Войти`, `Регистрация`;
- register screen renders `Регистрация`, `Создать аккаунт`, and no admin role;
- unauthenticated protected route sends user to `/login`;
- task screen renders `Добавить задачу` and the four group titles;
- task form rejects blank title and renders priority and complexity choices;
- task card exposes `Выполнить` and `В архив` for active tasks only;
- profile screen renders `Профиль` and progression fields from server data;
- error and loading state components render accessible text.

Q11 tests must prove:

- reward popup renders server item data;
- inventory page calls server API and renders equipped state;
- no reward random or drop roll exists in client code.

Q12 tests must prove:

- settings page loads and saves through server API;
- visual state page renders server visual state;
- no `Math.random`, `crypto.getRandomValues`, local storage, or local repository
  source of truth is used for settings/visual state.

## 12. Acceptance Commands

Use these checks in addition to packet-specific acceptance:

```bash
cd /usr/projects/Диплом/workspace/app && test ! -d src
cd /usr/projects/Диплом/workspace/app && rg -n "Таск Компаньон|Вход|Войти|Регистрация|Создать аккаунт|Добавить задачу|Просроченные|Предстоящие|Без дедлайна|Выполненные|Профиль|Выполнить|В архив" app tests
cd /usr/projects/Диплом/workspace/app && rg -n "Низкий|Обычный|Высокий|Крошечная|Маленькая|Средняя|Большая|Подобрано автоматически" app tests
cd /usr/projects/Диплом/workspace/app && rg -n "viewport-fit=cover|100dvh|safe-area|prefers-reduced-motion|44px|focus-visible" app assets tests
cd /usr/projects/Диплом/workspace/app && ! rg -n ">Login<|>Register<|>My Tasks<|>New Task<|>Complete<|>Archive<|>Profile<|>Inventory<|>Settings<|>Logout<|Active \\(|Completed \\(" app tests
cd /usr/projects/Диплом/workspace/app && ! rg -n "role.*admin|<option value=\"admin\"|Админ|/admin" app tests
cd /usr/projects/Диплом/workspace/app && ! rg -n "Math.random|crypto.getRandomValues|['\"]accessToken['\"]|localStorage.*task|localStorage.*profile|localStorage.*inventory|localStorage.*settings|localStorage.*visual|Memory.*Repository|Sqlite.*Repository|schema_migrations|computeLevel|computeProgress|XP_PER_LEVEL|grantTaskXp|applyLevelProgress" app core infrastructure tests
cd /usr/projects/Диплом/workspace/app && bun test
cd /usr/projects/Диплом/workspace/app && bun run typecheck
cd /usr/projects/Диплом/workspace/app && bun run build
```
