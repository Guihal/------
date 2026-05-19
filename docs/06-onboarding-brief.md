# Onboarding brief для fresh CC chat

Этот файл — карта для нового Claude Code chat, открытого в `/usr/projects/Диплом`
со словами «начинай MVP-0». Прочитать вместе с [README.md](README.md) и
[../AGENTS.md](../AGENTS.md) — за 5 минут понятно, что строим, что готово,
что делать первым.

> **State** (обновлять после каждой смены этапа): дата 2026-05-20; MVP-0 завершён (15/15 пакетов); scaffold + domain + infra + task flow + polish готовы; код > 0; Android-сборка работает. После каждого завершённого packet'а — обновить эту строчку (дата + sha + что готово).

## 0. Bootstrap для fresh chat (копипаста)

Скопируй блок ниже в новый CC chat первым сообщением:

```text
Проект Task Companion (mobile offline-first task manager). MVP-0 завершён.
1. Прочитай AGENTS.md → README.md → docs/06-onboarding-brief.md.
2. Уточни у юзера задачу: продолжить MVP-1, правка бага, или рефактор.
3. Если MVP-1 → возьми packet из docs/07-task-packet-template.md § 5 (маскот/инвентарь).
4. Реализуй packet строго по acceptance чеклисту.
5. После DoD обнови docs/06-onboarding-brief.md § State.
```

Следующие packet'ы (T02..) — взять из roadmap-этапа или попросить юзера
заполнить шаблон 07 § 3.

## 1. Контекст

Дипломный проект — мобильное offline-first приложение `Task Companion`
(низкая когнитивная нагрузка, локальные задачи, лёгкая геймификация). Стек:
Nuxt 4 + Vue 3 + TypeScript + Pinia + Capacitor + SQLite. Стадия: **MVP-0 завершён**
(15/15 пакетов). Код на месте, scaffold работает, Android-сборка собирается.
«Новый chat пришёл» → уточнить у юзера цель: MVP-1, багфикс, или рефактор.

## 2. Что готово

В `docs/` лежат 9 документов. MVP-0 код завершён и протестирован. `package.json`,
`nuxt.config.ts`, `tsconfig.json` на месте. Android-проект Capacitor сконфигурирован.

| Файл | Цель |
|------|------|
| [README.md](README.md) | Точка входа, индекс документов, базовое решение |
| [00-scope-map.md](00-scope-map.md) | Каноническое разделение фич на MVP-0/1/2/Post-MVP |
| [01-product-vision.md](01-product-vision.md) | Что строим, для кого, пользовательские сценарии, критерии успеха |
| [02-architecture.md](02-architecture.md) | Слои, ports/adapters, доменная модель, SQLite-схема, repository contracts |
| [03-build-roadmap.md](03-build-roadmap.md) | Этапы 0-11, Definition of Done, что нельзя делать раньше времени |
| [04-technical-decisions.md](04-technical-decisions.md) | ADR-001 — ADR-021 |
| [05-critic-pass.md](05-critic-pass.md) | Все исправленные риски + watchlist |

## 3. Что делать первым

MVP-0 завершён. Три возможных входа:

### Вход A — Продолжить MVP-1 (маскот, инвентарь)

Взять packet из [07-task-packet-template.md § 5](07-task-packet-template.md#5-worked-example-mvp-0-domain-task)
или запросить у юзера custom packet. Этапы roadmap → [03-build-roadmap.md § MVP-1](03-build-roadmap.md#3-mvp-1-маскот-инвентарь-и-xp-множители).

### Вход B — Правка бага / рефактор MVP-0

1. Прочитать `AGENTS.md` § 9 (anti-patterns) + § 12 (cheat sheet).
2. Найти соответствующий use case / domain файл.
3. Тест → правка → тест. UI править последним.

### Вход C — Новая фича вне роадмапа

Заполнить [07-task-packet-template.md § 3](07-task-packet-template.md#3-custom-task-packet) custom packet,
согласовать scope с юзером, не прыгать в инфраструктуру раньше domain.

## 4. Где искать что

| Вопрос | Файл / раздел |
|--------|---------------|
| Какие фичи в MVP-0? | [00-scope-map.md § MVP-0](00-scope-map.md#mvp-0-рабочее-ядро) |
| Что НЕ входит в MVP-0? | [00-scope-map.md § Не входит в MVP-0](00-scope-map.md#mvp-0-рабочее-ядро) |
| Как считать XP? | [02-architecture.md § 9 Правила XP и уровней](02-architecture.md#9-правила-xp-и-уровней) |
| Формула уровня? | `level = floor(xpTotal / XP_PER_LEVEL) + 1`, `XP_PER_LEVEL = 1000` — [02-architecture.md § 7.3](02-architecture.md#73-progression) |
| Как считать suggested complexity? | [02-architecture.md § 8 Автоматическое предположение сложности](02-architecture.md#автоматическое-предположение-сложности) — ordered decision tree |
| Как сортировать список задач? | [02-architecture.md § 8 Сортировка и группировка](02-architecture.md#сортировка-и-группировка-задач) |
| Почему Nuxt 4 client-only? | [04-technical-decisions.md ADR-001](04-technical-decisions.md#adr-001-nuxt-работает-как-клиентское-приложение) |
| Почему SQLite + memory? | [ADR-003](04-technical-decisions.md#adr-003-локальное-хранилище-production-runtime---sqlite) + [ADR-004](04-technical-decisions.md#adr-004-browser-dev-использует-memory-repositories) |
| Зачем `UnitOfWorkPort`? | [ADR-017](04-technical-decisions.md#adr-017-многошаговые-use-cases-выполняются-транзакционно) + [02-architecture.md § 13 UnitOfWorkPort](02-architecture.md#unitofworkport) |
| SQLite-схема MVP-0? | [02-architecture.md § 11 MVP-0 таблицы](02-architecture.md#11-sqlite-схема) |
| Migration runner contract? | [02-architecture.md § 12](02-architecture.md#12-migration-runner-contract) |
| Bootstrap flow? | [02-architecture.md § 16](02-architecture.md#16-bootstrap-flow) |
| Просрочка — это статус? | Нет, derived state. [ADR-010](04-technical-decisions.md#adr-010-просрочка-не-является-статусом) |
| Архивация vs delete? | [ADR-011](04-technical-decisions.md#adr-011-архивация-вместо-удаления-в-основном-flow) |
| Layering rules? | [02-architecture.md § 4](02-architecture.md#4-слои) + [§ 18 Запреты](02-architecture.md#18-архитектурные-запреты) |
| Tasks UI экраны? | [01-product-vision.md § 13](01-product-vision.md#13-ключевые-экраны) |
| Тестировать что в MVP-0? | [ADR-008](04-technical-decisions.md#adr-008-доменная-логика-тестируется-первой) + [02-architecture.md § 17](02-architecture.md#17-тестируемость) |
| Что было исправлено критиком? | [05-critic-pass.md § Что было исправлено](05-critic-pass.md#что-было-исправлено) |
| Watchlist рисков? | [05-critic-pass.md § Watchlist](05-critic-pass.md#watchlist) |

## 5. Точки принятия решений (спросить юзера, не угадывать)

**Источник правды для всех open decisions** — [02-architecture.md § 19](02-architecture.md#19-открытые-решения)
+ [AGENTS.md § 10](../AGENTS.md#10-decisions-log-policy). Этот раздел —
карта-индекс, не дубль:

| Решение | Где |
|---------|-----|
| Package manager (bun / pnpm / npm) | AGENTS § 10 п.5 + § 7 |
| SQLite плагин (`@capacitor-community/sqlite` финал) | ADR-003 + 02 § 19 п.1 |
| Минимальный Android SDK / target | 02 § 19 п.2 |
| Формат ассетов маскота / предметов | ADR-013 + 02 § 19 п.3 |
| Web SQLite vs memory-only | 02 § 19 п.4 (по умолчанию memory) |
| Result-style либа (ручной vs `neverthrow`) | AGENTS § 10 п.6 + § 5 |
| Расположение tests (co-located vs `tests/`) | AGENTS § 6 |
| `src/` srcDir vs плоская раскладка | AGENTS § 3 (по умолчанию плоская из 02 § 5) |

UI-вопросы (не блокируют scaffold, но появятся на этапе 4):

- Дизайн `TaskCard` — layout/badges/sizes (01 § 15 только запреты структуры).
- Цвета темы — hex палитра для static dark ([03 § Этап 5](03-build-roadmap.md#этап-5-mvp-0-polish)).
- UX контрола сложности — segmented/select/slider.
- Конкретные ассеты маскота и предметов (MVP-1, [05 watchlist § 3](05-critic-pass.md#watchlist)).

Правило: если ответа нет в таблице → спросить юзера. Не выбирать молча.

## 6. Правила взаимодействия

Базовые правила в `~/.claude/CLAUDE.md` и `AGENTS.md`. Кратко для этого проекта:

- **caveman ru**: дроп частиц/местоимений/связок, императив > спряжения, стрелки
  `→`, сокращения `т.е./т.к./напр./см.`. Code/paths/version-числа НЕ сокращать.
- **Layering**: UI → Store → Use Case → Port → Infrastructure. Обратные
  зависимости запрещены. См. [02-architecture.md § 1](02-architecture.md#1-архитектурная-цель).
- **Stores не содержат бизнес-логику** ([ADR-007](04-technical-decisions.md#adr-007-stores-не-содержат-бизнес-логику)).
  Pinia store = loading/error + вызов use case. Расчёт XP, сортировка, выдача
  предмета — НЕ в store.
- **Hexagonal / ports & adapters**: use case получает зависимости через
  интерфейсы, не импортирует SQLite класс напрямую.
- **Vitest для domain** ([ADR-008](04-technical-decisions.md#adr-008-доменная-логика-тестируется-первой)).
  UI-тесты — позже.
- **Surgical changes**: не «improve» соседний код. Каждая правка trace до user
  request. См. global rules § Behavioral rules.
- **Перед коммитом**: `/task` RLM-cycle для нетривиальных правок (см. `/task` skill).

## 7. Чего НЕ делать

Anti-patterns из [02-architecture.md § 18 Архитектурные запреты](02-architecture.md#18-архитектурные-запреты)
+ [03-build-roadmap.md § 6](03-build-roadmap.md#6-что-нельзя-делать-раньше-времени):

1. **Не тащить серверный код в Nuxt** — client-only ([ADR-001](04-technical-decisions.md#adr-001-nuxt-работает-как-клиентское-приложение)).
   Никакого `defineEventHandler`, никакого server/ folder.
2. **Не делать маскота, инвентарь, Pomodoro, команды, синхронизацию, REST, ИИ-помощника** —
   Post-MVP / MVP-1+ ([00-scope-map.md](00-scope-map.md)).
3. **Не выдавать награду повторно** — idempotent через `level_rewards` и
   `task_reward_rolls` ([ADR-015](04-technical-decisions.md#adr-015-награды-за-уровни-идемпотентны)).
   Повторный `completeTask` → не начислять XP второй раз.
4. **Не делать hard delete** в пользовательском flow — только archive
   ([ADR-011](04-technical-decisions.md#adr-011-архивация-вместо-удаления-в-основном-flow)).
5. **Не импортировать SQLite в Vue компоненты**. Не писать `Math.random()` в
   компонентах. Не считать XP в store.
6. **Не использовать обычные repositories внутри `unitOfWork.run`** — только
   repositories из `UnitOfWorkContext` ([ADR-017](04-technical-decisions.md#adr-017-многошаговые-use-cases-выполняются-транзакционно)).
7. **Не делать просрочку статусом** — derived state из `status=active AND dueAt<now`
   ([ADR-010](04-technical-decisions.md#adr-010-просрочка-не-является-статусом)).
8. **Не редактировать примененные миграции задним числом** — только новая версия
   ([ADR-018](04-technical-decisions.md#adr-018-миграции-выполняются-через-migration-runner)).

## 8. Definition of Done для MVP-0 task'а

Полный DoD MVP-0 в [03-build-roadmap.md § 7 Definition of Done](03-build-roadmap.md#7-definition-of-done).
Для каждого отдельного use case / фичи в рамках MVP-0:

- [ ] Типы доменной модели в `core/domain/` есть и не зависят от Vue/Pinia/Nuxt/Capacitor/SQLite.
- [ ] Vitest для domain функций / use case → зелёные.
- [ ] Use case с multi-step записью вызывается через `UnitOfWorkPort.run` с
      transaction-bound repositories.
- [ ] Memory repository реализован для browser dev.
- [ ] SQLite repository реализован (если фича касается персистентности).
- [ ] UI компонент / страница подключены через `useAppDependencies`.
- [ ] Проверено в браузере через memory repository.
- [ ] Готово к Android prove (smoke на устройстве / эмуляторе — этап 5).

## 9. Lifecycle команды

Канон — [AGENTS.md § 7 Dev workflow](../AGENTS.md#7-dev-workflow). Кратко
(после scaffold подтверждения package manager'а):

```bash
bun install          # установка
bunx nuxt dev        # browser dev на memory repositories
bun test             # vitest
bunx tsc --noEmit    # typecheck
bunx cap sync android && bunx cap run android   # Android (после Capacitor scaffold)
```

Если на scaffold юзер выбрал pnpm/npm — поменять prefix в AGENTS § 7
и здесь, не размножать.
