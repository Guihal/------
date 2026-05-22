# Platform wave spec

Дата: 2026-05-20.
Статус: active / canonical for new platform wave.

> Уточнение от 2026-05-21: новая platform wave приоритетна. Root Nuxt +
> Capacitor Android app в `/usr/projects/Диплом` является migration source.
> `workspace/app` должен стать перенесенным Android/Nuxt/Capacitor приложением,
> а не fresh web-client. Auth/session, login/register/logout, task/profile flow
> и полезная UI/domain логика переносятся из root app и адаптируются на server
> API. См. ADR-030.
> Детальный Q10 fix contract: [workspace-app-android-migration-fix.md](workspace-app-android-migration-fix.md).
> Детальный UI contract: [workspace-app-interface-contract.md](workspace-app-interface-contract.md).

## 1. Goal

Собрать новую версию Task Companion как client-server platform:

```txt
/usr/projects/Диплом
  AGENTS.md
  docs/
  workspace/
    server/
    admin-panel/
    app/
```

`workspace/server` является единственным источником persisted domain state.
`workspace/admin-panel` и `workspace/app` работают только через server API.

## 2. Constitution rules

Источник: `~/.agents/skills/system-constitution/SKILL.md`.

- Operator writes only `docs/**` and repo-root markdown.
- Executor writes only closed `allowed_write_paths` from packet.
- Architect and critic are read-only.
- Executor context is bounded to packet + listed `read_context`.
- Spec drift is fixed by docs/ADR packets before implementation packets.
- `PER_PACKET_REVIEW_EVERY=1`: every implementation packet must pass read-only
  architect verdict and read-only critic verdict before status done.
- Failed architect/critic gate blocks dispatch of the next dependent packet.
- Strategic review runs after every 3 completed implementation packets.
- Project-local constitution vision:
  [../constitution-project-vision.md](../constitution-project-vision.md).

## 3. Hard decisions

1. Root repo remains `/usr/projects/Диплом`.
2. All application code moves under `workspace/`.
3. Backend path is `workspace/server`.
4. Admin path is `workspace/admin-panel`.
5. Client app path is `workspace/app`.
6. Server stack is Bun + PostgreSQL.
7. SQLite is removed from domain persistence.
8. No cookie auth. Auth transport is `Authorization: Bearer <accessToken>`.
9. Roles are `user` and `admin`.
10. Server owns XP, levels, item catalog, rarity, drop roll, inventory, equip, logs, stats.
11. Admin can create item assets and items.
12. Item rarity is configured on each catalog item by admin.
13. Random reward grant happens only on server.
14. Client reward popup renders server response only.
15. Existing root Android app is migration source for `workspace/app`.
16. `workspace/app` must preserve Android/Capacitor runtime unless a later ADR
    explicitly replaces it.
17. No fresh React/Vite or blank Nuxt app may replace the migration target.

## 4. Projects

### 4.1 Server

Path:

```txt
workspace/server
```

Responsibilities:

- auth and RBAC;
- users;
- tasks;
- profile/progression;
- item assets;
- item catalog;
- mascot slots;
- inventory/equipment;
- reward/drop mechanics;
- settings/visual/reminder state;
- audit logs;
- admin stats.

### 4.2 Admin panel

Path:

```txt
workspace/admin-panel
```

Responsibilities:

- admin login;
- dashboard;
- users list/detail;
- logs;
- level stats;
- drop stats;
- item asset upload;
- item CRUD with rarity/slot/XP range.

### 4.3 App

Path:

```txt
workspace/app
```

Responsibilities:

- user register/login/logout;
- task flow;
- profile/progression display;
- mascot display;
- inventory/equipment;
- reward popup;
- settings/visual/reminders.
- Android/Capacitor build/runtime.

Forbidden in app:

- SQLite domain persistence;
- random reward roll;
- XP grant;
- item grant;
- item catalog mutation;
- direct DB access.
- replacing the existing root app UX/auth/task flow without migration mapping.

Migration source for app:

```txt
/usr/projects/Диплом/package.json
/usr/projects/Диплом/nuxt.config.ts
/usr/projects/Диплом/capacitor.config.ts
/usr/projects/Диплом/android/
/usr/projects/Диплом/app/
/usr/projects/Диплом/core/
/usr/projects/Диплом/infrastructure/
/usr/projects/Диплом/plugins/
```

Target app rule:

```txt
workspace/app = migrated mobile app
workspace/app != new empty web app
```

Dispatch rule: Q10 app migration must use
[workspace-app-android-migration-fix.md](workspace-app-android-migration-fix.md).
The migrated app interface must use
[workspace-app-interface-contract.md](workspace-app-interface-contract.md).
Do not dispatch Q11 or Q12 until Q10 passes the final acceptance in that file.

## 5. Server API

Required routes:

```txt
GET    /health

POST   /auth/register
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh
GET    /auth/me

GET    /profile
GET    /progression

GET    /tasks
POST   /tasks
PATCH  /tasks/:id/complete
PATCH  /tasks/:id/archive

GET    /mascot
GET    /inventory
POST   /inventory/:userItemId/equip
POST   /inventory/:userItemId/unequip

GET    /settings
PATCH  /settings
GET    /visual-state
PATCH  /visual-state
PATCH  /tasks/:id/reminder

GET    /admin/users
GET    /admin/users/:id
GET    /admin/logs
GET    /admin/stats/levels
GET    /admin/stats/drops
GET    /admin/stats/tasks
GET    /admin/items
POST   /admin/items
PATCH  /admin/items/:id
POST   /admin/item-assets
```

## 6. Data model families

Server tables:

```txt
users
refresh_tokens
profiles
progressions
tasks

item_assets
items
mascots
mascot_slots
user_items
equipped_items
level_rewards
task_reward_rolls

settings
visual_state
reminder_events
audit_logs
```

## 7. Reward flow

`PATCH /tasks/:id/complete`:

1. authenticate user;
2. load task by `user_id + task_id`;
3. return idempotent response when already completed;
4. compute XP on server;
5. apply equipment XP multiplier;
6. update progression;
7. grant level rewards once for levels divisible by 5;
8. check task reward roll idempotency;
9. roll random drop on server;
10. choose active catalog item from rarity pool;
11. roll item XP multiplier inside catalog range;
12. create `user_items`;
13. write `task_reward_rolls`;
14. write `audit_logs`;
15. return optional `reward` payload.

Reward payload:

```json
{
  "type": "item",
  "item": {
    "userItemId": "uuid",
    "baseItemId": "uuid",
    "name": "Crystal Hat",
    "description": "A shiny reward.",
    "rarity": "rare",
    "slot": "head",
    "assetUrl": "/assets/items/crystal-hat.webp",
    "xpMultiplier": 1.18
  }
}
```

## 8. Admin MVP

Pages:

```txt
/login
/dashboard
/users
/users/:id
/items
/items/new
/items/:id/edit
/logs
/stats/levels
/stats/drops
```

Dashboard widgets:

- total users;
- active users;
- average level;
- users by level;
- tasks created/completed;
- items granted;
- drop rate by rarity;
- latest audit logs.

Item manager fields:

- name;
- description;
- rarity: `common | rare | epic | legendary`;
- slot: `head | body | accessory | background`;
- XP multiplier min/max;
- asset upload;
- active flag.

## 9. Wave order

Authoritative execution queue:

- [platform-qwen-packets.md](platform-qwen-packets.md)

Checkpoints:

```txt
SR01 after Q03
SR02 after Q06
SR03 after Q09
SR04 after Q12
SR05 after Q15
```

## 10. Final gates

```bash
cd /usr/projects/Диплом/workspace/server && bun test && bun run typecheck
cd /usr/projects/Диплом/workspace/admin-panel && bun test && bun run build
cd /usr/projects/Диплом/workspace/app && bun test && bun run build
cd /usr/projects/Диплом && bun test docs/specs/platform-contract-smoke.test.ts
```
