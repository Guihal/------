# Документы приложения

Эта папка хранит рабочее видение приложения. НИР и дипломный текст могут быть
переписаны позже; источником решений для разработки считаются эти документы.

## Структура

### Spec (00-05) — что и почему

1. [00-scope-map.md](00-scope-map.md) - каноническое разделение функций на
   MVP-0, MVP-1, MVP-2 и Post-MVP.
2. [01-product-vision.md](01-product-vision.md) - что строим, для кого, зачем и
   что входит в MVP.
3. [02-architecture.md](02-architecture.md) - техническая архитектура,
   слои приложения, зависимости, структура проекта и хранилище.
4. [03-build-roadmap.md](03-build-roadmap.md) - порядок разработки, чтобы не
   расползтись по фичам до появления рабочего ядра.
5. [04-technical-decisions.md](04-technical-decisions.md) - стартовые ADR:
   SQLite, уведомления, SSR, UI, тесты, ассеты и ключевые ограничения.
6. [05-critic-pass.md](05-critic-pass.md) - результат RLM-критики после
   разделения scope и исправления архитектурных рисков.

### Handoff (06-08) — для fresh AI-chat

7. [06-onboarding-brief.md](06-onboarding-brief.md) - карта для нового
   Claude Code / Cursor / Kimi чата: что готово, что делать первым, где
   искать ответ. **Читать первым после AGENTS.md.**
8. [07-task-packet-template.md](07-task-packet-template.md) - self-contained
   контракт для передачи конкретной задачи в fresh chat. Worked examples
   MVP0-T01 (scaffold), T05 (domain+XP), T08 (migration runner).
9. [08-glossary.md](08-glossary.md) - словарь терминов проекта. При
   расхождении в чатах — этот файл побеждает.

### Pipeline (09 + specs/) — для автоматизации

10. [09-pipeline-application.md](09-pipeline-application.md) - практический
    гайд: operator-loop (cron-driven wave processor) + plan-multi-review
    (3-critic gate) + gstack skill hooks. 3 слоя автоматизации,
    quickstart команды, troubleshooting.
11. [specs/mvp-0.md](specs/mvp-0.md) - wave spec MVP-0 для operator-loop:
    goal, success criteria, risk tiering, critic dispatch triggers,
    termination conditions.
12. [specs/mvp-0-packets.md](specs/mvp-0-packets.md) - packet queue
    T01..T15 с deps, risk_tier, file_count_max, gstack hooks per packet.

Правила для агентов — [../AGENTS.md](../AGENTS.md) (root репо).

## Базовое решение

Разрабатывается мобильное offline-first приложение для управления задачами с
низкой когнитивной нагрузкой, стабильной структурой интерфейса, локальным
хранением данных, а затем легкой геймификацией, маскотом, инвентарем,
напоминаниями и визуальной вариативностью.

Основной стек:

```txt
Nuxt 4
Vue 3
TypeScript
Pinia
Capacitor
SQLite
```

Сервер в MVP не нужен. MVP-0 фокусируется на задачах, SQLite, XP и уровнях.
MVP-1 добавляет маскота и инвентарь. MVP-2 добавляет уведомления, настройки и
visual random. Архитектура строится так, чтобы позже можно было добавить REST
API через новые repository-реализации и минимальные изменения доменной модели,
не переписывая UI и основной слой бизнес-логики.
