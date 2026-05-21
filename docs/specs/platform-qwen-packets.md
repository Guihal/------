# Qwen execution packets

Дата: 2026-05-20.
Статус: active / canonical for new platform wave.

> Уточнение от 2026-05-21: новая очередь приоритетна, но app packets должны
> мигрировать существующее root Nuxt + Capacitor Android-приложение в
> `workspace/app`. Нельзя scaffold'ить fresh React/Vite или blank Nuxt client.
> Auth/session, login/register/logout, task/profile flow и полезная UI/domain
> логика переносятся из root app и адаптируются на Bearer/server API. См.
> ADR-030.
> Детальный Q10 fix contract:
> [workspace-app-android-migration-fix.md](workspace-app-android-migration-fix.md)
> + [workspace-app-interface-contract.md](workspace-app-interface-contract.md).

Target executor: Qwen 3.6 Plus or similar bounded-context model.

Rules:

- Every packet is self-contained.
- `allowed_write_paths` is closed.
- Executor must stop when an escalation trigger fires.
- No executor may edit docs unless the packet is docs-only.
- No executor may write outside `/usr/projects/Диплом/workspace/**` unless explicitly allowed.
- Strategic review packets are read-only.
- Every implementation packet requires `PER_PACKET_REVIEW_EVERY=1`: read-only
  architect verdict and read-only critic verdict must pass before status done.
- Failed architect/critic gate blocks the next dependent packet.
- App executors must treat root `/usr/projects/Диплом/app`, `core`,
  `infrastructure`, `plugins`, `android`, `package.json`, `nuxt.config.ts`, and
  `capacitor.config.ts` as read-only migration context.

Default gates for every implementation packet, even when the packet JSON omits
`gates`:

```json
{
  "pre_architect_readonly": "required",
  "post_architect_readonly": "required",
  "post_critic_readonly": "required",
  "critic_fail_blocks_next_packet": true
}
```

## Q00-layout

```json
{
  "task_id": "Q00-layout",
  "goal": "Create the workspace folder layout and root pointers.",
  "non_goals": [
    "Do not scaffold applications.",
    "Do not move existing mobile files.",
    "Do not edit package dependencies."
  ],
  "allowed_write_paths": [
    "/usr/projects/Диплом/workspace/README.md",
    "/usr/projects/Диплом/workspace/server/.gitkeep",
    "/usr/projects/Диплом/workspace/admin-panel/.gitkeep",
    "/usr/projects/Диплом/workspace/app/.gitkeep"
  ],
  "read_context": [
    "/usr/projects/Диплом/docs/specs/platform-wave.md"
  ],
  "risk_tier": "ordinary",
  "acceptance": [
    "test -d /usr/projects/Диплом/workspace/server",
    "test -d /usr/projects/Диплом/workspace/admin-panel",
    "test -d /usr/projects/Диплом/workspace/app",
    "rg -n \"workspace/server|workspace/admin-panel|workspace/app\" /usr/projects/Диплом/workspace/README.md"
  ],
  "diff_budget_loc": 120,
  "file_count_max": 5,
  "rollback": "Remove the workspace README and .gitkeep files added by this packet.",
  "escalation_triggers": [
    "Existing workspace folder contains implementation files.",
    "Task requires moving old app code.",
    "README contains conflicting layout."
  ],
  "glossary": {
    "workspace": "Root subfolder containing server, admin-panel, and app."
  }
}
```

## Q01-doc-adr

```json
{
  "task_id": "Q01-doc-adr",
  "goal": "Record the server-source-of-truth and workspace architecture decision.",
  "non_goals": [
    "Do not edit code.",
    "Do not rewrite old ADR text.",
    "Do not create implementation files."
  ],
  "allowed_write_paths": [
    "/usr/projects/Диплом/docs/04-technical-decisions.md"
  ],
  "read_context": [
    "/usr/projects/Диплом/AGENTS.md",
    "/usr/projects/Диплом/docs/specs/platform-wave.md",
    "/usr/projects/Диплом/docs/04-technical-decisions.md"
  ],
  "risk_tier": "strong_gate",
  "acceptance": [
    "rg -n \"workspace/server|server.*source of truth|SQLite.*removed|Bearer\" /usr/projects/Диплом/docs/04-technical-decisions.md"
  ],
  "diff_budget_loc": 180,
  "file_count_max": 1,
  "rollback": "Remove only the appended ADR block.",
  "escalation_triggers": [
    "ADR numbering conflict.",
    "Decision requires keeping SQLite.",
    "Decision requires cookie auth."
  ],
  "glossary": {
    "source of truth": "Server database owns persisted domain state."
  }
}
```

## Q02-server-scaffold-contract

```json
{
  "task_id": "Q02-server-scaffold-contract",
  "goal": "Scaffold the Bun server with healthcheck and OpenAPI contract placeholders.",
  "non_goals": [
    "Do not implement auth.",
    "Do not connect PostgreSQL.",
    "Do not edit admin-panel or app."
  ],
  "allowed_write_paths": [
    "/usr/projects/Диплом/workspace/server/package.json",
    "/usr/projects/Диплом/workspace/server/tsconfig.json",
    "/usr/projects/Диплом/workspace/server/src/**",
    "/usr/projects/Диплом/workspace/server/tests/**",
    "/usr/projects/Диплом/workspace/server/openapi.json"
  ],
  "read_context": [
    "/usr/projects/Диплом/docs/specs/platform-wave.md"
  ],
  "risk_tier": "public-api",
  "acceptance": [
    "cd /usr/projects/Диплом/workspace/server && bun install && bun test && bun run typecheck",
    "cd /usr/projects/Диплом/workspace/server && rg -n \"Bearer|/health|/auth/login|/admin/items|reward\" openapi.json"
  ],
  "diff_budget_loc": 280,
  "file_count_max": 10,
  "rollback": "Delete the server scaffold files added by this packet.",
  "escalation_triggers": [
    "Bun unavailable.",
    "OpenAPI contract requires unresolved route.",
    "Task requires database implementation."
  ],
  "glossary": {
    "OpenAPI contract": "JSON API contract consumed by admin-panel and app."
  }
}
```

## Q03-server-db-auth

```json
{
  "task_id": "Q03-server-db-auth",
  "goal": "Implement PostgreSQL schema and auth endpoints with RBAC and audit logs.",
  "non_goals": [
    "Do not implement tasks.",
    "Do not implement item catalog.",
    "Do not use cookies."
  ],
  "allowed_write_paths": [
    "/usr/projects/Диплом/workspace/server/src/db/**",
    "/usr/projects/Диплом/workspace/server/src/http/auth/**",
    "/usr/projects/Диплом/workspace/server/src/security/**",
    "/usr/projects/Диплом/workspace/server/tests/auth/**"
  ],
  "read_context": [
    "/usr/projects/Диплом/workspace/server/openapi.json",
    "/usr/projects/Диплом/docs/specs/platform-wave.md"
  ],
  "risk_tier": "security",
  "acceptance": [
    "cd /usr/projects/Диплом/workspace/server && bun test tests/auth && bun run typecheck",
    "cd /usr/projects/Диплом/workspace/server && rg -n \"refresh|audit_logs|admin|Bearer\" src"
  ],
  "diff_budget_loc": 1000,
  "file_count_max": 16,
  "rollback": "Remove auth/db/security files and route registrations added by this packet.",
  "escalation_triggers": [
    "PostgreSQL connection cannot be configured.",
    "Password hashing package unavailable.",
    "Refresh token rotation cannot be tested."
  ],
  "glossary": {
    "RBAC": "Role-based access control with user and admin roles.",
    "audit log": "Append-only record of important user/admin/server events."
  }
}
```

## SR01

```json
{
  "task_id": "SR01",
  "goal": "Review Q00 through Q03 against the platform wave goal.",
  "non_goals": [
    "Do not edit files.",
    "Do not suggest style nits.",
    "Do not inspect unrelated code."
  ],
  "allowed_write_paths": [],
  "read_context": [
    "/usr/projects/Диплом/docs/specs/platform-wave.md",
    "/usr/projects/Диплом/docs/specs/platform-qwen-packets.md"
  ],
  "risk_tier": "strong_gate",
  "acceptance": [
    "Return JSON {\"drift_score\":0,\"recommendation\":\"continue\",\"evidence\":[]}."
  ],
  "diff_budget_loc": 0,
  "file_count_max": 0,
  "rollback": "No rollback because this packet is read-only.",
  "escalation_triggers": [
    "drift_score >= 5.",
    "Server is not source of truth.",
    "Implementation uses cookies."
  ],
  "glossary": {
    "drift_score": "0 means aligned; 10 means fully off target."
  }
}
```

## Q04-server-tasks-progression

```json
{
  "task_id": "Q04-server-tasks-progression",
  "goal": "Implement task, profile, and progression APIs with server-owned XP.",
  "non_goals": [
    "Do not implement item drops.",
    "Do not implement inventory.",
    "Do not accept XP from clients."
  ],
  "allowed_write_paths": [
    "/usr/projects/Диплом/workspace/server/src/domain/tasks/**",
    "/usr/projects/Диплом/workspace/server/src/db/**",
    "/usr/projects/Диплом/workspace/server/src/http/tasks/**",
    "/usr/projects/Диплом/workspace/server/src/index.ts",
    "/usr/projects/Диплом/workspace/server/tests/tasks/**"
  ],
  "read_context": [
    "/usr/projects/Диплом/workspace/server/openapi.json",
    "/usr/projects/Диплом/docs/specs/platform-wave.md"
  ],
  "risk_tier": "public-api",
  "acceptance": [
    "cd /usr/projects/Диплом/workspace/server && bun test tests/tasks && bun run typecheck",
    "cd /usr/projects/Диплом/workspace/server && ! rg \"xp\" src/http/tasks/create*"
  ],
  "diff_budget_loc": 800,
  "file_count_max": 14,
  "rollback": "Remove task/progression files and route registrations added by this packet.",
  "escalation_triggers": [
    "Client can submit XP.",
    "Complete task is not idempotent.",
    "Progression rules are missing."
  ],
  "glossary": {
    "server-owned XP": "Server computes and persists XP; client sends only task action."
  }
}
```

## Q05-server-item-catalog-assets

```json
{
  "task_id": "Q05-server-item-catalog-assets",
  "goal": "Implement admin item asset upload and item catalog CRUD.",
  "non_goals": [
    "Do not grant user items.",
    "Do not implement drop roll.",
    "Do not edit admin-panel UI."
  ],
  "allowed_write_paths": [
    "/usr/projects/Диплом/workspace/server/src/http/admin/items/**",
    "/usr/projects/Диплом/workspace/server/src/storage/**",
    "/usr/projects/Диплом/workspace/server/tests/admin-items/**"
  ],
  "read_context": [
    "/usr/projects/Диплом/workspace/server/openapi.json"
  ],
  "risk_tier": "security",
  "acceptance": [
    "cd /usr/projects/Диплом/workspace/server && bun test tests/admin-items && bun run typecheck",
    "cd /usr/projects/Диплом/workspace/server && rg -n \"common|rare|epic|legendary|webp|png\" src/http/admin/items src/storage"
  ],
  "diff_budget_loc": 420,
  "file_count_max": 14,
  "rollback": "Remove item catalog and storage files added by this packet.",
  "escalation_triggers": [
    "Asset validation cannot reject non-image files.",
    "Rarity enum mismatch appears.",
    "Storage path points outside workspace/server."
  ],
  "glossary": {
    "item catalog": "Admin-managed base item definitions.",
    "rarity": "common, rare, epic, or legendary."
  }
}
```

## Q06-server-inventory-rewards

```json
{
  "task_id": "Q06-server-inventory-rewards",
  "goal": "Implement inventory, equip, level rewards, and server-side drop roll.",
  "non_goals": [
    "Do not expose RNG to clients.",
    "Do not create popup UI.",
    "Do not allow users to edit catalog items."
  ],
  "allowed_write_paths": [
    "/usr/projects/Диплом/workspace/server/src/domain/inventory/**",
    "/usr/projects/Диплом/workspace/server/src/domain/rewards/**",
    "/usr/projects/Диплом/workspace/server/src/http/inventory/**",
    "/usr/projects/Диплом/workspace/server/tests/rewards/**"
  ],
  "read_context": [
    "/usr/projects/Диплом/workspace/server/openapi.json",
    "/usr/projects/Диплом/docs/specs/platform-wave.md"
  ],
  "risk_tier": "strong_gate",
  "acceptance": [
    "cd /usr/projects/Диплом/workspace/server && bun test tests/rewards && bun run typecheck",
    "cd /usr/projects/Диплом/workspace/server && ! rg \"Math.random\" src/http"
  ],
  "diff_budget_loc": 480,
  "file_count_max": 16,
  "rollback": "Remove inventory/rewards files and route registrations added by this packet.",
  "escalation_triggers": [
    "Reward roll cannot be deterministic in tests.",
    "Equip ownership validation cannot be proven.",
    "Task completion can grant duplicate rewards."
  ],
  "glossary": {
    "drop roll": "Server random chance to grant item after task completion.",
    "equip": "Assign owned user item to mascot slot."
  }
}
```

## SR02

```json
{
  "task_id": "SR02",
  "goal": "Review Q04 through Q06 against the server-owned game mechanics rule.",
  "non_goals": [
    "Do not edit files.",
    "Do not inspect admin-panel implementation.",
    "Do not propose UI changes."
  ],
  "allowed_write_paths": [],
  "read_context": [
    "/usr/projects/Диплом/docs/specs/platform-wave.md",
    "/usr/projects/Диплом/docs/specs/platform-qwen-packets.md"
  ],
  "risk_tier": "strong_gate",
  "acceptance": [
    "Return JSON {\"drift_score\":0,\"recommendation\":\"continue\",\"evidence\":[]}."
  ],
  "diff_budget_loc": 0,
  "file_count_max": 0,
  "rollback": "No rollback because this packet is read-only.",
  "escalation_triggers": [
    "Client-visible contract asks client to roll rewards.",
    "Duplicate reward risk remains.",
    "Admin catalog is bypassed."
  ],
  "glossary": {
    "server-owned game mechanics": "XP, level reward, drop roll, and item grant live on server."
  }
}
```

## Q07-server-settings-stats

```json
{
  "task_id": "Q07-server-settings-stats",
  "goal": "Implement settings, visual state, reminder config, logs, and stats APIs.",
  "non_goals": [
    "Do not implement push notifications.",
    "Do not implement admin UI.",
    "Do not change reward mechanics."
  ],
  "allowed_write_paths": [
    "/usr/projects/Диплом/workspace/server/src/http/settings/**",
    "/usr/projects/Диплом/workspace/server/src/http/admin/stats/**",
    "/usr/projects/Диплом/workspace/server/src/http/admin/logs/**",
    "/usr/projects/Диплом/workspace/server/tests/stats/**"
  ],
  "read_context": [
    "/usr/projects/Диплом/workspace/server/openapi.json"
  ],
  "risk_tier": "public-api",
  "acceptance": [
    "cd /usr/projects/Диплом/workspace/server && bun test tests/stats && bun run typecheck"
  ],
  "diff_budget_loc": 360,
  "file_count_max": 14,
  "rollback": "Remove settings/stats/logs files and route registrations added by this packet.",
  "escalation_triggers": [
    "Stats query requires missing schema.",
    "Reminder config requires push delivery.",
    "Audit log payload shape is undefined."
  ],
  "glossary": {
    "stats": "Admin aggregate data for dashboard charts.",
    "reminder config": "Stored reminder settings consumed by app."
  }
}
```

## Q08-admin-scaffold-dashboard

```json
{
  "task_id": "Q08-admin-scaffold-dashboard",
  "goal": "Create admin-panel app with login, dashboard, users, logs, and stats pages.",
  "non_goals": [
    "Do not implement item manager.",
    "Do not edit server code.",
    "Do not use cookies."
  ],
  "allowed_write_paths": [
    "/usr/projects/Диплом/workspace/admin-panel/package.json",
    "/usr/projects/Диплом/workspace/admin-panel/tsconfig.json",
    "/usr/projects/Диплом/workspace/admin-panel/src/**",
    "/usr/projects/Диплом/workspace/admin-panel/tests/**"
  ],
  "read_context": [
    "/usr/projects/Диплом/workspace/server/openapi.json",
    "/usr/projects/Диплом/docs/specs/platform-wave.md"
  ],
  "risk_tier": "ordinary",
  "acceptance": [
    "cd /usr/projects/Диплом/workspace/admin-panel && bun install && bun test && bun run build",
    "cd /usr/projects/Диплом/workspace/admin-panel && rg -n \"Authorization|Dashboard|Users|Logs|Levels|Drops\" src"
  ],
  "diff_budget_loc": 480,
  "file_count_max": 18,
  "rollback": "Delete admin-panel scaffold files added by this packet.",
  "escalation_triggers": [
    "OpenAPI contract missing admin routes.",
    "Build tool cannot be installed.",
    "Auth transport requires cookies."
  ],
  "glossary": {
    "admin-panel": "Separate web app for admin role."
  }
}
```

## Q09-admin-item-manager

```json
{
  "task_id": "Q09-admin-item-manager",
  "goal": "Implement admin item manager with asset upload and rarity fields.",
  "non_goals": [
    "Do not grant items to users.",
    "Do not edit server code.",
    "Do not bypass admin auth."
  ],
  "allowed_write_paths": [
    "/usr/projects/Диплом/workspace/admin-panel/src/pages/items/**",
    "/usr/projects/Диплом/workspace/admin-panel/src/components/items/**",
    "/usr/projects/Диплом/workspace/admin-panel/tests/items/**"
  ],
  "read_context": [
    "/usr/projects/Диплом/workspace/server/openapi.json"
  ],
  "risk_tier": "ordinary",
  "acceptance": [
    "cd /usr/projects/Диплом/workspace/admin-panel && bun test tests/items && bun run build",
    "cd /usr/projects/Диплом/workspace/admin-panel && rg -n \"common|rare|epic|legendary|asset|xp\" src/pages/items src/components/items"
  ],
  "diff_budget_loc": 420,
  "file_count_max": 14,
  "rollback": "Remove item manager pages, components, and tests.",
  "escalation_triggers": [
    "Asset upload endpoint missing.",
    "Rarity enum mismatch.",
    "Item save can omit XP multiplier range."
  ],
  "glossary": {
    "XP multiplier range": "Min/max value server uses when granting a user item."
  }
}
```

## SR03

```json
{
  "task_id": "SR03",
  "goal": "Review Q07 through Q09 against admin and stats requirements.",
  "non_goals": [
    "Do not edit files.",
    "Do not inspect unrelated old mobile app.",
    "Do not suggest visual redesign."
  ],
  "allowed_write_paths": [],
  "read_context": [
    "/usr/projects/Диплом/docs/specs/platform-wave.md",
    "/usr/projects/Диплом/docs/specs/platform-qwen-packets.md"
  ],
  "risk_tier": "strong_gate",
  "acceptance": [
    "Return JSON {\"drift_score\":0,\"recommendation\":\"continue\",\"evidence\":[]}."
  ],
  "diff_budget_loc": 0,
  "file_count_max": 0,
  "rollback": "No rollback because this packet is read-only.",
  "escalation_triggers": [
    "Admin cannot create items.",
    "Stats do not use server API.",
    "Logs are absent."
  ],
  "glossary": {
    "logs": "Audit log records exposed to admin panel."
  }
}
```

## Q10-app-migrate-android-auth-tasks

```json
{
  "task_id": "Q10-app-migrate-android-auth-tasks",
  "goal": "Execute WAPP-F01 through WAPP-F05 from docs/specs/workspace-app-android-migration-fix.md.",
  "non_goals": [
    "Do not use this packet as an implementation contract by itself.",
    "Do not skip any WAPP-F01..WAPP-F05 packet.",
    "Do not keep React/Vite workspace/app files.",
    "Do not keep English generic web UI.",
    "Do not edit workspace/server or workspace/admin-panel."
  ],
  "allowed_write_paths": [
    "/usr/projects/Диплом/workspace/app/**"
  ],
  "read_context": [
    "/usr/projects/Диплом/docs/specs/workspace-app-android-migration-fix.md",
    "/usr/projects/Диплом/docs/specs/workspace-app-interface-contract.md",
    "/usr/projects/Диплом/docs/specs/platform-wave.md",
    "/usr/projects/Диплом/docs/04-technical-decisions.md#adr-030-platform-migration--root-app-is-migration-source"
  ],
  "risk_tier": "public-api",
  "gates": {
    "pre_architect_readonly": "required",
    "post_architect_readonly": "required",
    "post_critic_readonly": "required",
    "critic_must_check": [
      "no React/Vite/Zustand in workspace/app",
      "no SQLite/local repository source of truth",
      "Android/Capacitor runtime preserved",
      "Bearer auth and server API used",
      "root auth/task/profile flow migrated",
      "Russian mobile interface contract implemented"
    ]
  },
  "acceptance": [
    "cd /usr/projects/Диплом/workspace/app && test -f MIGRATION_MAP.md",
    "cd /usr/projects/Диплом/workspace/app && test -f package.json && test -f nuxt.config.ts && test -f capacitor.config.ts",
    "cd /usr/projects/Диплом/workspace/app && test -d android && test -d app && test -f app.vue",
    "cd /usr/projects/Диплом/workspace/app && test ! -f vite.config.ts && test ! -f index.html && test ! -d src",
    "cd /usr/projects/Диплом/workspace/app && rg -n \"nuxt|@capacitor/core|@capacitor/android|@pinia/nuxt|vue|pinia\" package.json",
    "cd /usr/projects/Диплом/workspace/app && ! rg -n \"react|react-dom|react-router-dom|zustand|@vitejs/plugin-react|@testing-library/react|@capacitor-community/sqlite|Sqlite.*Repository|schema_migrations\" package.json app core infrastructure tests",
    "cd /usr/projects/Диплом/workspace/app && ! rg -n \"passwordHash|hashPassword|findByEmail|findAll\\(|auth_session|local.*users|role.*admin|<option value=\\\"admin\\\"|Админ\" app core infrastructure tests",
    "cd /usr/projects/Диплом/workspace/app && rg -n \"/auth/login|/auth/register|/auth/refresh|/auth/logout|/auth/me|Authorization|Bearer\" app infrastructure tests",
    "cd /usr/projects/Диплом/workspace/app && rg -n \"/tasks|/profile|/progression|difficulty|category|general\" app infrastructure core tests",
    "cd /usr/projects/Диплом/workspace/app && rg -n \"Таск Компаньон|Вход|Войти|Регистрация|Создать аккаунт|Добавить задачу|Просроченные|Предстоящие|Без дедлайна|Выполненные|Профиль|Выполнить|В архив\" app tests",
    "cd /usr/projects/Диплом/workspace/app && rg -n \"Низкий|Обычный|Высокий|Крошечная|Маленькая|Средняя|Большая|Подобрано автоматически\" app tests",
    "cd /usr/projects/Диплом/workspace/app && ! rg -n \">Login<|>Register<|>My Tasks<|>New Task<|>Complete<|>Archive<|>Profile<|>Inventory<|>Settings<|>Logout<|Active \\(|Completed \\(\" app tests",
    "cd /usr/projects/Диплом/workspace/app && bun test",
    "cd /usr/projects/Диплом/workspace/app && bun run typecheck",
    "cd /usr/projects/Диплом/workspace/app && bun run build",
    "cd /usr/projects/Диплом/workspace/app && bunx cap sync android"
  ],
  "diff_budget_loc": 2300,
  "file_count_max": 140,
  "rollback": "Restore only workspace/app to the pre-Q10 state; do not delete root app files.",
  "escalation_triggers": [
    "Any WAPP packet acceptance cannot pass after two fix attempts.",
    "Root app files required by workspace-app-android-migration-fix.md are missing.",
    "React/Vite remains in workspace/app.",
    "English React scaffold UI remains in workspace/app.",
    "SQLite source-of-truth remains in workspace/app.",
    "Capacitor Android runtime cannot be preserved."
  ],
  "glossary": {
    "Q10 fix contract": "docs/specs/workspace-app-android-migration-fix.md",
    "interface contract": "docs/specs/workspace-app-interface-contract.md",
    "WAPP packet": "One of WAPP-F01, WAPP-F02, WAPP-F03, WAPP-F04, WAPP-F05 from the Q10 fix contract."
  }
}
```

## Q11-app-inventory-reward-popup

Blocked until Q10 passes
[workspace-app-android-migration-fix.md](workspace-app-android-migration-fix.md)
final acceptance and
[workspace-app-interface-contract.md](workspace-app-interface-contract.md).
After Q10, use the migrated Nuxt layout (`app/`, `core/`, `infrastructure/`,
`tests/`). Do not introduce `src/`.

```json
{
  "task_id": "Q11-app-inventory-reward-popup",
  "goal": "Implement app mascot, inventory, equip, and reward popup from server payloads.",
  "non_goals": [
    "Do not compute reward drops.",
    "Do not create item catalog UI.",
    "Do not mutate inventory without API."
  ],
  "allowed_write_paths": [
    "/usr/projects/Диплом/workspace/app/app/pages/profile/**",
    "/usr/projects/Диплом/workspace/app/app/pages/inventory/**",
    "/usr/projects/Диплом/workspace/app/app/components/inventory/**",
    "/usr/projects/Диплом/workspace/app/app/components/rewards/**",
    "/usr/projects/Диплом/workspace/app/app/stores/use-inventory.store.ts",
    "/usr/projects/Диплом/workspace/app/app/stores/use-reward.store.ts",
    "/usr/projects/Диплом/workspace/app/infrastructure/api/inventory.api.ts",
    "/usr/projects/Диплом/workspace/app/infrastructure/api/rewards.api.ts",
    "/usr/projects/Диплом/workspace/app/tests/inventory/**"
  ],
  "read_context": [
    "/usr/projects/Диплом/docs/specs/workspace-app-android-migration-fix.md",
    "/usr/projects/Диплом/docs/specs/workspace-app-interface-contract.md",
    "/usr/projects/Диплом/docs/04-technical-decisions.md#adr-030-platform-migration--root-app-is-migration-source",
    "/usr/projects/Диплом/workspace/app/MIGRATION_MAP.md",
    "/usr/projects/Диплом/workspace/server/openapi.json"
  ],
  "risk_tier": "public-api",
  "gates": {
    "pre_architect_readonly": "required",
    "post_architect_readonly": "required",
    "post_critic_readonly": "required",
    "critic_must_check": [
      "Q10 final acceptance already passed",
      "inventory/equip uses server API",
      "reward popup renders server payload only",
      "no local inventory/reward source of truth",
      "no client reward random"
    ]
  },
  "acceptance": [
    "cd /usr/projects/Диплом/workspace/app && bun test tests/inventory && bun run build",
    "cd /usr/projects/Диплом/workspace/app && test ! -d src",
    "cd /usr/projects/Диплом/workspace/app && rg -n \"/inventory|/rewards|/equip|Authorization|Bearer\" app infrastructure tests",
    "cd /usr/projects/Диплом/workspace/app && rg -n \"Инвентарь|Надеть|Снять|В инвентарь|XP x|Нет предметов в инвентаре\" app tests",
    "cd /usr/projects/Диплом/workspace/app && ! rg -n \"Math.random|crypto.getRandomValues|localStorage.*inventory|Memory.*Inventory|Sqlite.*Inventory|reward.*roll|drop.*roll\" app core infrastructure tests"
  ],
  "diff_budget_loc": 460,
  "file_count_max": 16,
  "rollback": "Remove inventory and reward UI files added by this packet.",
  "escalation_triggers": [
    "Reward payload missing assetUrl.",
    "Equip API lacks slot field.",
    "Popup requires client-generated reward data."
  ],
  "glossary": {
    "reward popup": "Modal that displays server-returned item after task completion."
  }
}
```

## Q12-app-settings-visual

Blocked until Q10 passes
[workspace-app-android-migration-fix.md](workspace-app-android-migration-fix.md)
final acceptance and
[workspace-app-interface-contract.md](workspace-app-interface-contract.md).
After Q10, use the migrated Nuxt layout (`app/`, `core/`, `infrastructure/`,
`tests/`). Do not introduce `src/`.

```json
{
  "task_id": "Q12-app-settings-visual",
  "goal": "Implement app settings, visual state, and reminder configuration screens.",
  "non_goals": [
    "Do not implement push notifications.",
    "Do not use random in components.",
    "Do not change reward mechanics."
  ],
  "allowed_write_paths": [
    "/usr/projects/Диплом/workspace/app/app/pages/settings/**",
    "/usr/projects/Диплом/workspace/app/app/stores/settings.store.ts",
    "/usr/projects/Диплом/workspace/app/app/stores/visual.store.ts",
    "/usr/projects/Диплом/workspace/app/infrastructure/api/settings.api.ts",
    "/usr/projects/Диплом/workspace/app/infrastructure/api/visual.api.ts",
    "/usr/projects/Диплом/workspace/app/tests/settings/**"
  ],
  "read_context": [
    "/usr/projects/Диплом/docs/specs/workspace-app-android-migration-fix.md",
    "/usr/projects/Диплом/docs/specs/workspace-app-interface-contract.md",
    "/usr/projects/Диплом/docs/04-technical-decisions.md#adr-030-platform-migration--root-app-is-migration-source",
    "/usr/projects/Диплом/workspace/app/MIGRATION_MAP.md",
    "/usr/projects/Диплом/workspace/server/openapi.json"
  ],
  "risk_tier": "ordinary",
  "gates": {
    "pre_architect_readonly": "required",
    "post_architect_readonly": "required",
    "post_critic_readonly": "required",
    "critic_must_check": [
      "Q10 final acceptance already passed",
      "settings/visual state uses server API",
      "no local authoritative settings persistence",
      "no component random"
    ]
  },
  "acceptance": [
    "cd /usr/projects/Диплом/workspace/app && test ! -d src",
    "cd /usr/projects/Диплом/workspace/app && rg -n \"/settings|/visual-state|Authorization|Bearer\" app infrastructure tests",
    "cd /usr/projects/Диплом/workspace/app && rg -n \"Настройки|Визуальная|Напоминания|reduced|motion|Сохранить\" app tests",
    "cd /usr/projects/Диплом/workspace/app && ! rg -n \"Math.random|crypto.getRandomValues|localStorage.*settings|localStorage.*visual|Memory.*Settings|Sqlite.*Settings|Memory.*Visual|Sqlite.*Visual\" app core infrastructure tests",
    "cd /usr/projects/Диплом/workspace/app && bun test tests/settings && bun run build"
  ],
  "diff_budget_loc": 320,
  "file_count_max": 10,
  "rollback": "Remove settings and visual files added by this packet.",
  "escalation_triggers": [
    "Settings API missing.",
    "Visual state requires client random.",
    "Reminder config requires push delivery."
  ],
  "glossary": {
    "visual state": "Server-persisted UI variant state rendered by app."
  }
}
```

## SR04

```json
{
  "task_id": "SR04",
  "goal": "Review Q10 through Q12 against client-display-only requirements.",
  "non_goals": [
    "Do not edit files.",
    "Do not inspect server internals.",
    "Do not add new scope."
  ],
  "allowed_write_paths": [],
  "read_context": [
    "/usr/projects/Диплом/docs/specs/platform-wave.md",
    "/usr/projects/Диплом/docs/specs/platform-qwen-packets.md"
  ],
  "risk_tier": "strong_gate",
  "acceptance": [
    "Return JSON {\"drift_score\":0,\"recommendation\":\"continue\",\"evidence\":[]}."
  ],
  "diff_budget_loc": 0,
  "file_count_max": 0,
  "rollback": "No rollback because this packet is read-only.",
  "escalation_triggers": [
    "App owns reward logic.",
    "App stores domain data locally.",
    "App bypasses server API."
  ],
  "glossary": {
    "client-display-only": "Client renders server state and sends actions; it does not own mechanics."
  }
}
```

## Q13-integration-smoke

```json
{
  "task_id": "Q13-integration-smoke",
  "goal": "Add integration smoke tests for server, admin-panel, and app flows.",
  "non_goals": [
    "Do not edit product UI.",
    "Do not require Android device.",
    "Do not seed data outside test database."
  ],
  "allowed_write_paths": [
    "/usr/projects/Диплом/workspace/server/tests/integration/**",
    "/usr/projects/Диплом/workspace/server/scripts/smoke.ts",
    "/usr/projects/Диплом/docs/specs/platform-contract-smoke.test.ts"
  ],
  "read_context": [
    "/usr/projects/Диплом/docs/specs/platform-wave.md",
    "/usr/projects/Диплом/workspace/server/openapi.json"
  ],
  "risk_tier": "strong_gate",
  "acceptance": [
    "cd /usr/projects/Диплом/workspace/server && bun test tests/integration",
    "cd /usr/projects/Диплом && bun test docs/specs/platform-contract-smoke.test.ts"
  ],
  "diff_budget_loc": 300,
  "file_count_max": 6,
  "rollback": "Remove integration smoke tests and smoke script.",
  "escalation_triggers": [
    "PostgreSQL test database unavailable.",
    "Reward roll cannot be deterministic.",
    "Admin item creation cannot be verified through API."
  ],
  "glossary": {
    "smoke": "Register admin, create item, register user, complete task, verify reward/log/stats."
  }
}
```

## Final gate

```bash
cd /usr/projects/Диплом/workspace/server && bun test && bun run typecheck
cd /usr/projects/Диплом/workspace/admin-panel && bun test && bun run build
cd /usr/projects/Диплом/workspace/app && bun test && bun run build
cd /usr/projects/Диплом && bun test docs/specs/platform-contract-smoke.test.ts
```
