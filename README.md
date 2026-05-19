# Task Companion

> Дипломный проект: мобильный offline-first таск-менеджер с лёгкой геймификацией.
> **Статус:** MVP-0 завершён (15/15 пакетов). Рабочее ядро — задачи, XP, уровни, SQLite.

---

## Quick start

```bash
# Установка зависимостей
bun install

# Dev-сервер (браузер, memory-репозитории)
bun run dev

# Тесты (Vitest)
bun run test

# Сборка production
bun run build

# Typecheck
bunx nuxt typecheck
```

> **Android** (после scaffold Capacitor):
> ```bash
> bunx cap sync android && bunx cap run android
> ```

---

## Технологический стек

| Слой | Технология |
|------|------------|
| Framework | Nuxt 4 (client-only, без SSR) |
| UI | Vue 3, Vue Router |
| State | Pinia |
| Language | TypeScript strict |
| Mobile | Capacitor + Android |
| Database | SQLite (`@capacitor-community/sqlite`) |
| Tests | Vitest + `@vue/test-utils` + happy-dom |
| DevOps | bun |

---

## Архитектура

Hexagonal / Ports & Adapters. Чистое ядро, заменяемая инфраструктура.

```
UI (Vue pages, components)
  → Store (Pinia, тонкий — state + вызов use case)
    → Use Case (бизнес-операция)
      → Port / Repository Interface
        → Infrastructure (SQLite / memory / capacitor / system)
```

Правила:
- UI **не** импортирует `infrastructure/*`.
- Store **не** содержит бизнес-логику.
- Use case получает зависимости через аргументы, не глобальный контейнер.
- Domain (`core/domain/*`) — чистый TypeScript, без Vue/Nuxt/SQLite.
- Multi-write операции — через `UnitOfWorkPort.run(ctx => ...)`.

Структура проекта — плоская: `app/`, `core/`, `infrastructure/`, `plugins/`, `tests/`.

---

## Функции (MVP-0)

- **Задачи** — создание, редактирование, выполнение, архивация
- **Сложность** — автоматический ordered decision tree + ручная правка
- **Список задач** — группы: просроченные → ближайшие → без дедлайна → выполненные
- **Профиль / XP** — начисление XP за выполнение задачи, фиксированный `XP_PER_LEVEL = 1000`
- **Уровни** — linear progression, `level = floor(xpTotal / XP_PER_LEVEL) + 1`
- **Offline-first** — SQLite на Android, memory-репозитории в браузере
- **Персистентность** — данные сохраняются после перезапуска
- **Миграции** — runner + `schema_migrations`, применяются из пустой БД
- **Idempotency** — повторное выполнение задачи не начисляет XP дважды
- **Транзакционность** — выполнение + XP + level-up в одной транзакции

---

## Роадмап

| Фаза | Статус | Что внутри |
|------|--------|------------|
| **MVP-0** | ✅ Завершён | Задачи, профиль, XP, уровни, SQLite, Android-сборка |
| MVP-1 | ⏳ Запланирован | Маскот, инвентарь, предметы, XP-множители |
| MVP-2 | ⏳ Запланирован | Уведомления, visual random, настройки |
| Post-MVP | 📋 Backlog | Синхронизация, повторяющиеся задачи, магазин |

---

## Документация

- [docs/00-scope-map.md](docs/00-scope-map.md) — разделение фич на MVP-0/1/2/Post-MVP
- [docs/01-product-vision.md](docs/01-product-vision.md) — продуктовое видение, пользовательские сценарии
- [docs/02-architecture.md](docs/02-architecture.md) — слои, доменная модель, SQLite-схема, контракты
- [docs/03-build-roadmap.md](docs/03-build-roadmap.md) — этапы 0-11, Definition of Done
- [docs/04-technical-decisions.md](docs/04-technical-decisions.md) — ADR-001 … ADR-021
- [docs/05-critic-pass.md](docs/05-critic-pass.md) — риски, watchlist, что было исправлено
- [docs/06-onboarding-brief.md](docs/06-onboarding-brief.md) — стартовая карта для нового агента
- [docs/07-task-packet-template.md](docs/07-task-packet-template.md) — шаблон задачи + worked examples
- [AGENTS.md](AGENTS.md) — правила для AI-агентов (layering, naming, tests, workflow)

---

## Лицензия

Приватный дипломный проект.
