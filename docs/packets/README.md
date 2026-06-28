# Rebuild Packets

Пакеты для реализации `Task Companion Rebuild`. Формат намеренно Markdown, не
JSON: так не теряются детали, сценарии и запреты из полного ТЗ.

Источник правды: [../10-rebuild-technical-spec.md](../10-rebuild-technical-spec.md).

## Правила

- Один packet = один измеримый результат.
- Перед работой читать полный packet и указанные разделы ТЗ.
- Перед изменениями читать [../RULES.md](../RULES.md).
- Если packet противоречит ТЗ, останавливать работу и править ТЗ/packet.
- Не принимать архитектурные решения молча.
- Не переносить XP/reward/random/audit/visual-state логику на frontend.
- Acceptance должен проходить командами или проверяемым smoke-сценарием.

## Архитектурный минимум для пакетов

Базовая схема разработки:

```txt
Vue page/component
  -> Pinia store
    -> API client/service
      -> backend handler
        -> backend usecase/service
          -> repository/query
            -> PostgreSQL
```

- Backend остается source of truth для auth, `user_id`, XP, level, rewards,
  random roll, audit, equip, ownership и visual state.
- Pinia store хранит state, loading/error и actions. Store не считает XP, не
  роллит награды, не решает ownership и не содержит reward/drop/equip логику.
- Backend usecase/service обязателен для операций с инвариантами:
  `completeTask`, auth/session refresh, reward/drop, equip/unequip,
  visual-state refresh, admin mutations with audit.
- Простые read-only запросы могут оставаться `handler -> query/repository` без
  отдельного usecase, если там нет доменного решения.
- Идемпотентность и критичные связи фиксировать DB constraints и транзакциями,
  а не только UI-состоянием.
- Frontend и backend общаются через OpenAPI/DTO. Frontend не угадывает форму
  completion/reward/profile payload.
- Feature-first структура предпочтительнее абстрактной раскладки по всем
  слоям сразу, если границы зависимостей остаются явными.
- Class wrapper над Pinia не является стандартным слоем. Для XP/profile можно
  делать readonly helper/view-model форматтеры, но не источник бизнес-логики.

## Очередь

| ID | Packet | Результат |
|---|---|---|
| P00 | [project-clean-slate.md](project-clean-slate.md) | Удалена старая реализация, зафиксирована новая структура |
| P01 | [backend-scaffold.md](backend-scaffold.md) | Go backend skeleton, config, health, OpenAPI shell |
| P02 | [database-schema-migrations-seed.md](database-schema-migrations-seed.md) | PostgreSQL schema, migrations, seed |
| P03 | [auth-rbac-sessions.md](auth-rbac-sessions.md) | Auth, refresh rotation, RBAC |
| P04 | [backend-profiles-settings-visual.md](backend-profiles-settings-visual.md) | Profile, settings, visual state API |
| P05 | [backend-tasks-progression.md](backend-tasks-progression.md) | Task CRUD, archive, categories, base progression helpers |
| P06 | [backend-rewards-engine.md](backend-rewards-engine.md) | Complete transaction, XP grant, drops, level rewards, audit |
| P07 | [backend-inventory-mascot-equip.md](backend-inventory-mascot-equip.md) | Inventory, mascot, equip/unequip |
| P08 | [backend-admin-assets-audit-stats.md](backend-admin-assets-audit-stats.md) | Admin API, assets, audit, stats |
| P09 | [frontend-contracts-shared-client.md](frontend-contracts-shared-client.md) | OpenAPI client, shared DTO/error handling |
| P10 | [mobile-scaffold-auth-shell.md](mobile-scaffold-auth-shell.md) | Nuxt+Capacitor app shell, auth gate, nav |
| P11 | [mobile-task-flow.md](mobile-task-flow.md) | Mobile task list/form/details/complete/archive |
| P12 | [mobile-rewards-profile-inventory-settings.md](mobile-rewards-profile-inventory-settings.md) | Rewards, profile, inventory, settings |
| P13 | [admin-panel-core.md](admin-panel-core.md) | Admin login/dashboard/users/items/logs |
| P14 | [quality-demo-acceptance.md](quality-demo-acceptance.md) | Tests, smoke, demo path, accessibility checks |
| P15 | [reminders-model-ui.md](reminders-model-ui.md) | Reminder model/API/UI without native push |

P09 can start after P01 creates the OpenAPI shell, but it must be refreshed after
P03-P08 stabilize endpoints and DTOs.

## Packet Template

Use this shape for future packets:

```md
# Packet PXX: <name>

## Goal
<imperative one-sentence result>

## Read First
- docs/10-rebuild-technical-spec.md § ...

## Scope In
- ...

## Scope Out
- ...

## Requirements
- ...

## Acceptance
- ...

## Escalation
- ...
```
