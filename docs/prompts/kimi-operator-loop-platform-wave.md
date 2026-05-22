# Оператор-луп: platform wave (Q00-Q13) на кими, 1 мин тик

## Источник истины (приоритет)

1. `docs/specs/workspace-app-android-migration-fix.md` — Q10 fix contract
2. `docs/specs/workspace-app-interface-contract.md` — UI mandatory
3. `docs/specs/platform-wave.md` — architecture hard decisions
4. `docs/specs/platform-qwen-packets.md` — authoritative queue
5. `docs/04-technical-decisions.md#adr-029` + `#adr-030`
6. Root app (`/usr/projects/Диплом/app/`, `core/`, `infrastructure/`, `plugins/`, `android/`) — migration source
7. AGENTS.md § 0 — platform override

Старые MVP-0 docs (offline-first, SQLite source of truth, запрет REST/auth) — **legacy, не применять**. Auth/server/REST обязательны.

## СТЕК — ЖЁСТКО

| Компонента | Стек | Запрещено навсегда |
|---|---|---|
| **workspace/app** | Nuxt 4 (client-only) + Vue 3 + TS + Pinia + Capacitor Android | ❌ React, Svelte, Angular, Solid, Vite, vanilla JS. ❌ Native Android (Java/Kotlin). ❌ SQLite source of truth. ❌ localStorage для доменных данных. |
| **workspace/admin-panel** | Nuxt 4 (client-only) + Vue 3 + TS + Pinia | ❌ React, Svelte, Angular, Solid, Vite. |
| **workspace/server** | Bun + Elysia + TS + PostgreSQL | ❌ Node.js, Express, Fastify, Python, Go, PHP. ❌ SQLite. ❌ Cookies. ❌ Client-owned XP. |

**Capacitor** — только webview-обёртка для Android. Никакого Java/Kotlin. Весь UI на Vue 3.

**Auth transport**: `Authorization: Bearer <accessToken>`. Никаких кук.

## Проблема: кими не следует инструкциям

K2.6:
- Не сверяет spec если не указать явно
- Уходит в React/Svelte/Angular когда надо Nuxt
- Не вызывает critic/architect внутри /task
- Дрифтует без внешних границ
- Не удаляет React/Vite файлы когда надо заменить на Nuxt

**Лекарство**: physical rails + PER_PACKET_REVIEW_EVERY=1 + явные acceptance команды

## Physical rails (уже есть)

| Рельса | Путь |
|---|---|
| Launcher | `~/.local/bin/kimi-claude-role <role>` |
| PreToolUse Edit/Write | `~/.claude/hooks/kimi-role-guard.sh` |
| PreToolUse Skill | `~/.claude/hooks/kimi-mode-block-task.sh` |
| PreToolUse Bash | `~/.claude/hooks/kimi-mode-block-prod-bash.sh` |
| Pre-commit | `<repo>/scripts/role-rails/check-role.sh` |
| Packet contract | `<repo>/.packet-context.<PACKET_ID>.json` |

## Loop (1 мин тик)

```
tick N:
  1. читать `.operator-state.platform-wave.json`
  2. фаза:
     init              → подготовить первый пакет, записать .packet-context.{id}.json
     dispatching       → kimi-claude-role executor --packet=<id>
     awaiting-commit   → git log --oneline -1. OK маркер? FAIL маркер?
     verdict-spawning  → architect + critic (kimi-claude-role architect, kimi-claude-role critic)
     fix-dispatching   → забрать blocker-ы, spawn executor r{N+1}
     challenge-gate    → Codex Challenger (если risk_tier=security|db_migration|strong_gate)
     vision-gate       → vision keeper review (см. ниже)
     done              → следующий пакет
  3. записать state
  4. если HEALTH < 6 → STOP, user
```

## Vision gate (финальный ревьюер)

Запускается после verdict-spawning (architect + critic ok) перед `done`. Отдельная роль — **не architect, не critic**. Смотрит на результат целиком.

**Когда запускать:**
- **per packet**: всегда, если risk_tier = strong_gate | security | db_migration
- **per wave**: после Q03, Q06, Q09, Q10, Q13 — обязательный полный ревью

**Что проверяет vision keeper:**

1. **Проект работает?** Не spec compliance, а реальный запуск: `bun run dev` не падает, страницы открываются, кнопки работают.
2. **Соответствие видению?** Не «есть ли эндпоинт /auth/login», а «человек может зайти, создать задачу, получить XP, увидеть профиль».
3. **Связность.** Server + app + admin-panel работают вместе, не изолированно.
4. **User-facing качество.** Не «есть ли loading state», а «выглядит адекватно на мобилке, не разваливается, нет английских лейблов».
5. **Дрифт от meta-goal.** Мы всё ещё делаем Task Companion для диплома, или ушли в абстрактный API-дизайн?

**Формат вердикта:**

```json
{
  "ok": true|false,
  "blockers": ["конкретная проблема: файл, строка"],
  "verdict": "accept|fix|wave-blocker",
  "vision_drift": 0-10,
  "evidence": ["что конкретно не так"]
}
```

- `accept` — всё ок
- `fix` — мелкие проблемы, исправить в этом пакете
- `wave-blocker` — проблема уровня всей волны, STOP, звать юзера

**Пример:** architect сказал «роуты есть, spec ok». Vision keeper запустил `bun run dev`, увидел 500 ошибку в /profile, потому что сервер не подключён к БД. Это blocker. Architect его не поймает — он смотрит spec, не рантайм.

**Имплементация:** kimi-claude-role vision -p '<prompt>' — те же physical rails что у architect/critic (read-only). Ничего не пишет, только вердикт.

## Правила executor (кими) — НАРУШЕНИЕ = ROLLBACK

1. **allowed_write_paths — НЕ НАРУШАТЬ.**
2. **СТЕК**: только Nuxt 4 + Vue 3 + TS. Не React, не Svelte, не другой фреймворк.
3. **Перед write — прочитать spec.** Если spec не описывает → STOP.
4. **НЕ рефакторить соседние файлы.** Только файлы из packet.
5. **НЕ добавлять сущности/зависимости без spec.**
6. **auth = Bearer token.** Не куки, не local password hash, не auth_session.
7. **НЕ использовать `Date.now()`, `Math.random()`, `crypto.randomUUID()` в domain/use case** — только через порты.
8. **После кода — acceptance команды.** Упало → fix.
9. **commit:** `Q<id> r<N>: <что сделано>`
10. **file_count_max + diff_budget_loc — не превышать.**

## Детектор дрифта (перед каждым коммитом)

```
□ 1. Все файлы внутри allowed_write_paths?         → нет → удалить лишнее
□ 2. Стек Nuxt/Vue/TS/Bun/Elysia?                  → нет → переписать
□ 3. Для app: нет React/Vite/Zustand/SQLite?        → есть → удалить
□ 4. Auth через Bearer, не куки?                    → нет → переписать
□ 5. Нет локальной XP/уровней/дропа?                → есть → удалить
□ 6. Acceptance проходит?                           → нет → fix
```

MAX_ROUNDS=5 на пакет. Round 6 → user escalation.

## Авторитетная очередь (из platform-qwen-packets.md)

### Q00-Q03: Server foundation

| Packet | Описание | allowed_write_paths | risk | blocked_by |
|---|---|---|---|---|
| **Q00-layout** | Создать workspace папки + README | `workspace/README.md`, `.gitkeep` | ordinary | — |
| **Q01-doc-adr** | ADR-029/030 server-source-of-truth + workspace | `docs/04-technical-decisions.md` | strong_gate | Q00 |
| **Q02-server-scaffold-contract** | Bun server scaffold + OpenAPI contract | `workspace/server/{package.json,tsconfig.json,src/**,tests/**,openapi.json}` | public-api | Q01 |
| **Q03-server-db-auth** | PostgreSQL schema + auth endpoints + RBAC + audit logs | `workspace/server/src/db/**,src/http/auth/**,src/security/**,tests/auth/**` | **security** | Q02 |
| **SR01** | Strategic review Q00-Q03 | read-only | strong_gate | Q03 |

### Q04-Q07: Server domain

| Packet | Описание | allowed_write_paths | risk | blocked_by |
|---|---|---|---|---|
| **Q04-server-tasks-progression** | Task, profile, progression APIs + server-owned XP | `src/domain/tasks/**,src/http/tasks/**,tests/tasks/**` | public-api | SR01 |
| **Q05-server-item-catalog-assets** | Admin item asset upload + catalog CRUD | `src/http/admin/items/**,src/storage/**,tests/admin-items/**` | security | Q04 |
| **Q06-server-inventory-rewards** | Inventory, equip, level rewards, server drop roll | `src/domain/inventory/**,domain/rewards/**,http/inventory/**,tests/rewards/**` | strong_gate | Q05 |
| **SR02** | Strategic review Q04-Q06 | read-only | strong_gate | Q06 |

### Q07-Q09: Server settings + Admin panel

| Packet | Описание | allowed_write_paths | risk | blocked_by |
|---|---|---|---|---|
| **Q07-server-settings-stats** | Settings, visual, reminders, logs, stats APIs | `src/http/settings/**,http/admin/stats/**,http/admin/logs/**,tests/stats/**` | public-api | SR02 |
| **Q08-admin-scaffold-dashboard** | Admin-panel Nuxt app + login + dashboard + users + logs + stats | `workspace/admin-panel/{package.json,tsconfig.json,src/**,tests/**}` | ordinary | Q07 |
| **Q09-admin-item-manager** | Admin item manager + asset upload + rarity fields | `admin-panel/src/pages/items/**,components/items/**,tests/items/**` | ordinary | Q08 |
| **SR03** | Strategic review Q07-Q09 | read-only | strong_gate | Q09 |

### ⚠️ Q10: App migration (CRITICAL — блокирует Q11/Q12)

**Q10-app-migrate-android-auth-tasks** — выполнить 5 подпакетов WAPP-F01..F05 из `workspace-app-android-migration-fix.md`.

**Суть**: заменить React/Vite `workspace/app` на Nuxt + Capacitor, перенесённый из root app.

| WAPP | Описание | diff_budget | files | escalation |
|---|---|---|---|---|
| **F01** | Заменить React/Vite на Nuxt/Capacitor из root | 900 LOC | 80 | React остался, Nuxt typecheck не прошёл |
| **F02** | Auth на server API (Bearer, /auth/*) | 500 LOC | 16 | Server ответ не совпадает со spec |
| **F03** | Task/profile на server API | 650 LOC | 22 | Client считает XP, локальная source of truth |
| **F04** | Drift gates (нет React/SQLite, Android sync) | 220 LOC | 8 | cap sync не прошёл, React/Vite есть |
| **F05** | Russian mobile UI per interface contract | 520 LOC | 18 | Английские лейблы, нет loading/error/empty |

**Жёсткие запреты Q10:**
- Никакого React/Vite/Zustand в `workspace/app`
- Никакого SQLite/localStorage source of truth
- Android/Capacitor runtime сохранён
- Bearer auth + server API
- Root auth/task/profile flow перенесён
- Russian mobile UI из interface contract
- `MIGRATION_MAP.md` создан до кода
- `workspace/server/**` и `workspace/admin-panel/**` НЕ трогать

### Q11-Q13: App UI + Integration

| Packet | Описание | blocked_by | risk |
|---|---|---|---|
| **Q11-app-inventory-reward-popup** | Mascot, inventory, equip, reward popup из server payload | Q10 | public-api |
| **Q12-app-settings-visual** | Settings, visual state, reminders | Q10 | ordinary |
| **SR04** | Strategic review Q10-Q12 | Q12 | strong_gate |
| **Q13-integration-smoke** | Integration smoke tests server+admin+app | SR04 | strong_gate |

### Final gate

```bash
cd /usr/projects/Диплом/workspace/server && bun test && bun run typecheck
cd /usr/projects/Диплом/workspace/admin-panel && bun test && bun run build
cd /usr/projects/Диплом/workspace/app && bun test && bun run typecheck && bun run build
cd /usr/projects/Диплом && bun test docs/specs/platform-contract-smoke.test.ts
```

## Quick reference

```bash
# Тик оператора (cron каждую минуту):
kimi-operator-tick
# Инициализация волны:
kimi-operator-init --wave=platform-wave --readme=docs/specs/platform-qwen-packets.md
# Ручной executor:
kimi-claude-role executor --packet=Q02-server-scaffold-contract
# Architect review:
kimi-claude-role architect -p 'Сверить коммит <sha> со spec {platform-wave.md,platform-qwen-packets.md}'
# Critic review:
kimi-claude-role critic -p 'Проверить diff на нарушения правил (стек, allowed_write_paths, Bearer, no SQLite)'
```

## Stop conditions

- `MAX_ROUNDS=5` превышен на любом пакете
- React/Vite/SQLite source of truth обнаружен после Q10
- Capacitor Android sync не работает
- Server ответ не совпадает с ожидаемой формой из spec
- Стратегик ревью показал drift_score >= 5
- User interrupt
