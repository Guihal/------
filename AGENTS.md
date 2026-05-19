# AGENTS.md

Правила для AI-агентов (Claude Code / Cursor / Kimi / Codex), работающих с этим
репо. Читать **до первого изменения кода**. Источник истины архитектуры —
[docs/02-architecture.md](docs/02-architecture.md), решений —
[docs/04-technical-decisions.md](docs/04-technical-decisions.md), плана —
[docs/03-build-roadmap.md](docs/03-build-roadmap.md), границ scope —
[docs/00-scope-map.md](docs/00-scope-map.md), watchlist —
[docs/05-critic-pass.md](docs/05-critic-pass.md).

---

## 1. TL;DR

- Дипломный мобильный offline-first task-manager с легкой геймификацией (XP, уровни, маскот, предметы).
- Стек: Nuxt 4 (client-only, без SSR), Vue 3, TypeScript strict, Pinia, Capacitor, SQLite через `@capacitor-community/sqlite` (кандидат, подтвердить на scaffold), Vitest.
- Архитектура: hexagonal, ports & adapters. Domain чистый, infrastructure заменяема (SQLite на Android / memory в browser dev).
- Текущий этап — **MVP-0**: task flow + SQLite + XP/уровни. Маскот, инвентарь, уведомления, visual random — **Post-MVP-0**.
- Платформа MVP — Android. iOS не блокирует.

---

## 2. Layering rule (HARD)

```txt
UI (Vue components, pages)
  -> Store (Pinia, тонкий)
    -> Use Case (бизнес-операция)
      -> Port / Repository Interface
        -> Infrastructure (SQLite / memory / capacitor)
```

Стрелки **только вниз**. Обратные импорты запрещены.

Конкретные правила:

- UI **не** импортирует `infrastructure/*`. Никогда.
- UI **не** вызывает `Math.random()`, `crypto.randomUUID()`, `Date.now()` для доменного/визуального поведения. Идти через ports.
- Store **не** содержит business logic. State + loading/error + методы `load`, `create`, `complete`, диспатч в use case. Расчет XP / drop / сортировка — в use case, не в store.
- Use case принимает зависимости через аргумент (deps), **не** импортирует глобальный контейнер. Никаких `import { db } from '...'` внутри use case.
- Domain (`core/domain/*`) **не** зависит от Vue, Pinia, Nuxt, Capacitor, SQLite. Только TS типы + чистые функции.
- Use cases с несколькими write — через `UnitOfWorkPort.run(ctx => ...)`. Внутри callback писать только через `ctx.*Repository`, не через repos из `AppDependencies`.
- Nested transactions запрещены. Вложенный use case принимает `UnitOfWorkContext` как аргумент.

Базис правил — [docs/02-architecture.md § 4, § 13, § 18](docs/02-architecture.md), [ADR-007](docs/04-technical-decisions.md), [ADR-017](docs/04-technical-decisions.md).

---

## 3. Folder layout

**Канон — [docs/02-architecture.md § 5](docs/02-architecture.md#5-предлагаемая-структура-проекта).** Плоская раскладка от корня проекта: `app/`, `core/`, `infrastructure/`, `plugins/` (БЕЗ `src/` префикса). Полный tree с MVP-фазовыми пометками — в 02 § 5; здесь — правила, не дубль дерева.

Ключевые точки:

- `core/` (domain + use-cases + ports) не зависит от `app/` и `infrastructure/`.
- `app/` — Nuxt UI слой (pages, components, composables, stores).
- `infrastructure/` — реализации портов: `sqlite/`, `memory/`, `capacitor/`, `noop/`, `system/`.
- `plugins/dependencies.client.ts` — сборка `AppDependencies` (Nuxt plugin, client-only).
- MVP-фазирование папок (mascot/inventory — MVP-1; visual/settings/notification — MVP-2) — см. 02 § 5.

Если Nuxt scaffold потребует `src/` корень (Nuxt 4 srcDir convention) — это **отдельный ADR**, не silent decision; до ADR используется плоская раскладка из 02 § 5.

Расположение `tests/` — **открытое решение § 10 ниже**, по умолчанию `tests/` зеркалом `core/`.

---

## 4. Naming conventions

- Файлы: `kebab-case`. `task.repository.ts`, `complete-task.use-case.ts`, `memory-inventory.repository.ts`.
- Типы / интерфейсы / Vue components: `PascalCase`. `Task`, `TaskRepository`, `TaskCard.vue`.
- Функции, переменные, параметры: `camelCase`. `completeTask`, `xpTotal`.
- Константы — `UPPER_SNAKE_CASE`. `XP_PER_LEVEL`, `DROP_XP_UNIT`, `DEFAULT_MASCOT_SLOTS`.
- Use cases — **глагол + объект**: `completeTask`, `createTask`, `archiveTask`, `equipItem`, `grantLevelRewards`, `rollInventoryDrop`. Файл: `<verb-object>.use-case.ts`.
- Repositories — `<Entity>Repository` (`TaskRepository`, `InventoryRepository`). Файл: `<entity>.repository.ts`.
- Ports — `<Capability>Port` (`ClockPort`, `RandomPort`, `NotificationPort`, `UnitOfWorkPort`). Файл: `<capability>.port.ts`.
- Implementations — `<Adapter><Entity>Repository` / `<Adapter><Capability>Port`. `SqliteTaskRepository`, `MemoryTaskRepository`, `CapacitorNotificationPort`, `SystemClockPort`.
- Stores — `<feature>.store.ts`, `use<Feature>Store`.
- Composables — `use<X>` (`useAppDependencies`).
- Тестовые файлы — `*.test.ts` (см § 6).
- SQL: `snake_case` колонок и таблиц (`xp_total`, `user_inventory_items`). Доменные поля — `camelCase` (`xpTotal`).

---

## 5. TypeScript strict mode

`tsconfig.json` обязан включать:

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true
  }
}
```

Жесткие правила:

- `any` **запрещен**. `unknown` ok с narrowing (typeof / instanceof / zod-like guard / discriminated union).
- `as` cast — крайний случай. Перед cast попробовать narrowing / generics.
- Доменные ошибки use case — через **Result type**, не throw:

```ts
type Result<T, E = DomainError> =
  | { ok: true; value: T }
  | { ok: false; error: E }
```

  Альтернатива — `neverthrow`. Выбор библиотеки — **предложение, согласовать на scaffold (ADR кандидат)**. До решения — ручной Result.

- `throw` ok для **программерских** ошибок (invariant violation, unreachable). Доменные ошибки (валидация, not-found, conflict) — Result.
- Domain types — `readonly` поля где уместно. Иммутабельные операции, новый объект вместо мутации.
- Date в domain — `string` (ISO-8601), получается из `ClockPort.nowIso()`. Никаких `new Date()` в domain.
- ID в domain — `string`. Получается из `IdGeneratorPort.newId()`. Никаких `crypto.randomUUID()` в domain/use case.
- `noUncheckedIndexedAccess` означает `arr[i]: T | undefined` — обязательно проверять или narrowing.

---

## 6. Test strategy

Базис — [ADR-008](docs/04-technical-decisions.md), [docs/02-architecture.md § 17](docs/02-architecture.md).

Tier 1 — **Domain (Vitest unit)**:

- 100% покрытие критичных правил.
- Чистые функции без mock'ов: `suggestTaskComplexity`, `calculateTaskXp`, `applyLevelProgress`, `rollTaskXpMultiplier`, `calculateEquipmentXpMultiplier`, `rollInventoryDrop`, `generateItemStats`.
- Идемпотентность: `completeTask` второй раз — без двойного начисления XP. `grantLevelRewards` — без повторной выдачи. `rollInventoryDrop` — без повторного reroll.
- Ownership / cross-profile invariants.

Tier 2 — **Use case (Vitest integration)**:

- Use case + memory repositories + memory UnitOfWorkPort.
- Detrministic ports: `FakeClockPort`, `FakeIdGeneratorPort`, `SeededRandomPort` (для предсказуемого roll).
- Транзакционность `completeTask`: проверить, что `grant-task-xp` + `apply-level-progress` (+ MVP-1 rewards/drop) выполняются через единый `ctx`.
- Запрет: **не мокать domain функции внутри use case теста**. Юзать реальные domain функции + memory repo.

Tier 3 — **Infrastructure (SQLite)**:

- Тестируется на Android device/emulator после scaffold.
- Локально (без Android) — smoke через mock Capacitor или skip.
- Migration runner: smoke-test применения из пустой БД — обязателен для MVP-0 ([docs/02-architecture.md § 12](docs/02-architecture.md)).
- Web SQLite — **не требуется**, browser dev на memory repos ([ADR-004](docs/04-technical-decisions.md)).

Tier 4 — **UI**:

- Ручное QA в `bunx nuxt dev` (mobile viewport).
- Vitest snapshot для атомарных stateless компонентов — опционально. UI-тесты приходят позже, после стабилизации flow ([docs/02-architecture.md § 17](docs/02-architecture.md)).

Расположение тестов:

- Доменные / use case тесты — `tests/` зеркалом структуры `core/` (`tests/domain/task.test.ts`, `tests/use-cases/tasks/complete-task.test.ts`) **или** `*.test.ts` рядом с источником. Выбрать на scaffold, зафиксировать ADR. **Предложение** — co-located для use case (`complete-task.use-case.ts` + `complete-task.use-case.test.ts`), а доменные функции собрать в `tests/domain/` для удобной навигации списком инвариантов.
- Файлы фикстур / fakes — `tests/fakes/` (FakeClockPort, SeededRandomPort, memory builders).

---

## 7. Dev workflow

Менеджер пакетов — **bun** (предлагается, требует подтверждения на scaffold). Допустим fallback на npm/pnpm. Команды ниже даны для bun, заменить при ином выборе.

```bash
# install
bun install

# browser dev (memory repositories, без Capacitor)
bunx nuxt dev

# unit / use case тесты
bun test

# lint (если eslint настроен)
bunx eslint .

# typecheck
bunx nuxi typecheck   # или bunx tsc --noEmit

# Android build (после scaffold MVP-0 + sync Capacitor)
bunx cap sync android
bunx cap run android
```

Правила:

- Если плагин Capacitor (`@capacitor-community/sqlite` или другой) **еще не установлен** — не запускать `cap run android`. Сначала установка + sync + проверка с юзером.
- `bunx nuxt dev` обязан работать на memory repositories. Если упало — баг в DI / browser fallback, не в SQLite.
- Перед каждым PR/commit: `bun test` + typecheck зелёные.
- Migration smoke (пустая БД → 001_initial → проверка таблиц) — обязателен в CI/local при изменении миграций.

---

## 8. Definition of Done (per задача)

- [ ] Типы в `core/domain/` обновлены / новые добавлены.
- [ ] Доменные функции / use case с pure logic — чистые, тестируемые без I/O.
- [ ] Use case реализован через ports. Multi-write — через `UnitOfWorkPort.run(ctx => ...)`.
- [ ] Memory repository обновлен (browser dev должен работать).
- [ ] SQLite repository обновлен ИЛИ явный TODO + ADR/комментарий, если этап разрешает (MVP-0 — обязателен SQLite; MVP-1/2 — синхронно).
- [ ] Миграция добавлена, если меняется SQL-схема. Новая `00X_<name>.sql` + смок применения из пустой БД.
- [ ] Vitest тесты зеленые (`bun test`). Покрыты: invariants, идемпотентность, ownership, ordered decision tree, transaction boundary.
- [ ] `tsc --noEmit` чистый. Без `any`.
- [ ] UI прокликан в `bunx nuxt dev`, mobile viewport. Empty / loading / error states присутствуют там, где применимо.
- [ ] Если меняется invariant / архитектурное решение — добавлен ADR в [docs/04-technical-decisions.md](docs/04-technical-decisions.md) (см § 10).
- [ ] Коммит с осмысленным сообщением. Caveman ru ok, императив (`add complete-task use case`, `fix double xp on idempotent complete`).

---

## 9. Anti-patterns (HARD)

Все запреты из [docs/02-architecture.md § 18](docs/02-architecture.md) + [00-scope-map.md](docs/00-scope-map.md) + watchlist [05-critic-pass.md](docs/05-critic-pass.md):

1. **SSR / серверный код в Nuxt** — приложение client-only ([ADR-001](docs/04-technical-decisions.md)). Никаких `useFetch` к серверу, `defineEventHandler`, `server/` directory как production источника данных.
2. **Pomodoro, командные задачи, синхронизация, ИИ-помощник, магазин, привычки, календарь, регистрация/авторизация** — Post-MVP ([00-scope-map.md](docs/00-scope-map.md)). В MVP-0/1/2 не добавлять.
3. **Hard delete задач** в пользовательском flow → только archive ([ADR-011](docs/04-technical-decisions.md)). Hard delete допустим в debug/настройках Post-MVP.
4. **Повторная выдача reward за тот же level** → идемпотентность через `level_rewards.(profile_id, level)` ([ADR-015](docs/04-technical-decisions.md)).
5. **Повторный roll drop за ту же задачу** → `task_reward_rolls.task_id PRIMARY KEY` ([ADR-015](docs/04-technical-decisions.md)).
6. **Business logic в Pinia store** (расчет XP, сортировка, drop chance) → перенести в use case или domain функцию ([ADR-007](docs/04-technical-decisions.md)).
7. **Импорт `infrastructure/sqlite/*` в browser bundle** → memory fallback через DI плагин ([ADR-004](docs/04-technical-decisions.md)). Capacitor SQLite не должен попасть в `bunx nuxt dev` bundle.
8. **Бонусы предметов кроме `xpMultiplier`** в MVP-1 (бонусы к шансам выпадения, штрафам, сериям) → Post-MVP ([ADR-009](docs/04-technical-decisions.md)).
9. **Negative XP / штрафы за просрочку** → нет наказаний в MVP ([docs/02-architecture.md § 9](docs/02-architecture.md), [ADR-010](docs/04-technical-decisions.md)).
10. **`any` в TS** → `unknown` + narrowing.
11. **Прямой `Date.now()` / `new Date()` в domain или use case** → `ClockPort.nowIso()`.
12. **`Math.random()` в domain / use case / компоненте** → `RandomPort` ([docs/02-architecture.md § 4.1](docs/02-architecture.md)).
13. **`crypto.randomUUID()` в domain / use case** → `IdGeneratorPort.newId()`.
14. **Cross-profile FK без ownership check** → composite unique `(profile_id, id)` + repository check для optional-ссылок ([docs/02-architecture.md § 11 same-profile ownership](docs/02-architecture.md)).
15. **Nested `unitOfWork.run`** → один уровень. Внутренние use case принимают существующий `ctx` ([ADR-017](docs/04-technical-decisions.md)).
16. **Reminder поля в MVP-0 `tasks` table** → перенесены в MVP-2 ALTER migration ([критика #11](docs/05-critic-pass.md)).
17. **Обычные repos из `AppDependencies` внутри `unitOfWork.run` callback** → только `ctx.*Repository` ([docs/02-architecture.md § 18](docs/02-architecture.md)).
18. **`Math.random()` для визуальной вариативности в компоненте** → visual use case + `visual_state` ([ADR-012](docs/04-technical-decisions.md)). MVP-0 — static dark, без random.
19. **Status `overdue` в БД** → derived state `status = active AND dueAt < now` ([ADR-010](docs/04-technical-decisions.md)).
20. **Изменение примененной миграции** → новая миграция с новым `version` ([ADR-018](docs/04-technical-decisions.md)).
21. **Side effect (notification schedule/cancel) внутри transaction** → после commit. Расхождение чинит reconciliation на bootstrap ([ADR-020](docs/04-technical-decisions.md)).
22. **CSS / template как место бизнес-правил** → правила в domain / use case ([docs/02-architecture.md § 18](docs/02-architecture.md)).
23. **MVP-1/2 фичи до рабочего MVP-0 task flow** → блокирует scaffold по плану ([03-build-roadmap.md § 6](docs/03-build-roadmap.md)).
24. **Пропуск CHECK constraints из [docs/02-architecture.md § 11](docs/02-architecture.md#11-sqlite-схема)** при создании / правке миграций. Канонические инварианты (копировать дословно):
   - `xp_multiplier REAL NOT NULL CHECK (xp_multiplier >= 1.0 AND xp_multiplier <= 1.45)` (user_inventory_items)
   - `CHECK (source = 'level' AND source_level IS NOT NULL AND source_task_id IS NULL) OR (source = 'task-drop' AND source_task_id IS NOT NULL AND source_level IS NULL)` — XOR источника
   - `CHECK (source_level IS NULL OR source_level >= 1)`
   - `CHECK ((dropped_rarity IS NULL AND user_inventory_item_id IS NULL) OR (dropped_rarity IS NOT NULL AND user_inventory_item_id IS NOT NULL))` — связь rarity ↔ item в task_reward_rolls
   - `PRAGMA foreign_keys = ON` в КАЖДОМ открытии connection (не один раз)
25. **`ON DELETE CASCADE` на audit FK** (`task_reward_rolls`, `level_rewards`) → audit должен запрещать reroll, использовать `ON DELETE RESTRICT` ([критика #30](docs/05-critic-pass.md#что-было-исправлено)). Каскад на audit ломает невозможность повторной выдачи.
26. **`createTaskRewardRoll` без проверки `item.rarity === droppedRarity`** → audit может ссылаться на предмет другой редкости ([критика #32](docs/05-critic-pass.md#что-было-исправлено)). Use case обязан загрузить item и сверить.
27. **`equipItem` без 5-шаговой pre-write валидации** ([02-architecture § 8 Экипировка](docs/02-architecture.md#экипировка-предмета) + [критика #28](docs/05-critic-pass.md#что-было-исправлено)): обязательно загрузить (1) owned UserInventoryItem (2) base InventoryItem (3) active Mascot (4) Mascot slots, и (5) валидировать slot compatibility (`item.slot === mascotSlot.key` + same-profile ownership) ДО любого repository write. Прямой `repository.equip()` без сверки → cross-profile / wrong-slot bug.

---

## 10. Decisions log policy

- Все архитектурные решения — ADR в [docs/04-technical-decisions.md](docs/04-technical-decisions.md). Формат уже задан (ADR-001 ... ADR-021).
- Новое решение / изменение инварианта → **новый** ADR-N с датой и обоснованием, **не** редакт старого.
- Старый ADR помечается `Superseded by ADR-N`, оригинальный текст не удалять.
- Watchlist пункты из [05-critic-pass.md](docs/05-critic-pass.md) при закрытии — становятся ADR или фиксируются в коде с TODO + ссылкой на pass.
- Решения, требующие закрытия до или в начале scaffold (см [docs/02-architecture.md § 19](docs/02-architecture.md)):
  1. SQLite-плагин Capacitor — финально подтвердить установкой.
  2. Минимальный Android SDK / target version.
  3. Формат ассетов маскота и предметов (webp/png + anchor json).
  4. Web SQLite vs memory-only для browser dev (пока memory).
  5. Менеджер пакетов: bun / npm / pnpm.
  6. Result-style либа: ручной Result vs `neverthrow`.

---

## 11. Agent collaboration rules

- **Неоднозначность → спрашивать юзера**, не угадывать. Особенно: scope (MVP-0 vs MVP-1), новые сущности, изменение SQL-схемы, выбор библиотеки.
- **Новые документы вне `docs/`** не создавать без согласования. README проекта, ADR, scope — только patch существующих файлов в `docs/`.
- **Existing 00-05 docs целиком не переписывать** — patch-style edit (Edit tool, мелкие диффы). Не reformatting ради reformatting.
- **Перед большим refactor / новой механикой → читать [docs/05-critic-pass.md](docs/05-critic-pass.md)** (история ошибок и watchlist). Не повторять закрытые баги (cross-profile, double-grant, reminder-в-MVP-0 и т.д.).
- **Перед изменением domain → перечитать § 2 Layering rule + [docs/02-architecture.md § 7 Доменная модель](docs/02-architecture.md)**.
- **Перед изменением SQL → [docs/02-architecture.md § 11 SQLite схема + § 12 Migration runner](docs/02-architecture.md)**. Никогда не редактировать примененную миграцию.
- **Перед `completeTask` / multi-write use case → § 13 UnitOfWorkPort**.
- **Стиль обсуждения / коммитов** — caveman ru (короткие фрагменты, дроп частиц, инфинитив/императив). Технический контент / код — стандартный TS.
- **Безопасные пути / clarity override** — destructive операции (drop table, delete migration, force push) — полными фразами, без caveman compression.
- **Не запускать `cap run android`, `gh`, `git push`, deploy** без явной просьбы юзера.
- **Subagent/Teams**: для параллельных независимых задач — Teams (см глобальный CLAUDE.md). Single-shot — Agent. Max 3 параллельных subagent'а.

---

## 12. Quickstart для fresh chat

Перед любой work-задачей AI-агент делает **4 шага**:

1. **Прочитать spec**: AGENTS.md (этот файл) + [docs/README.md](docs/README.md) + [docs/06-onboarding-brief.md](docs/06-onboarding-brief.md).

   ```bash
   cat AGENTS.md docs/README.md docs/06-onboarding-brief.md
   ```

2. **Взять / заполнить packet** → [docs/07-task-packet-template.md](docs/07-task-packet-template.md). Готовые worked examples (MVP0-T01 scaffold, T05 domain+XP, T08 migration runner) — копипастом. Кастомная задача — заполнить шаблон § 3.

3. **Понять этап и dependencies** → [docs/03-build-roadmap.md](docs/03-build-roadmap.md) + § 10 этого файла (open decisions, которые блокируют scaffold). Не пропускать `read_first` секцию packet'а.

4. **Перед изменением domain / SQL / use case** → перечитать § 2 Layering rule + § 9 Anti-patterns + соответствующую секцию [docs/02-architecture.md](docs/02-architecture.md). Перед сложным refactor — [docs/05-critic-pass.md](docs/05-critic-pass.md) watchlist (не повторять закрытые баги).

Если spec НЕ покрывает вопрос → § 11 правило «спросить юзера, не угадывать».

---

## 13. Cheat sheet — частые операции

- **Добавить новое поле в Task**: domain `task.ts` → migration `00X_*.sql` (ALTER) → SqliteTaskRepository (mapper) → MemoryTaskRepository → use case (если затрагивает logic) → UI → тесты domain + use case.
- **Новый use case с multi-write**: signature принимает `deps: { unitOfWork, clock, idGenerator, ... }` → внутри `unitOfWork.run(async ctx => { ... })` → писать через `ctx.*Repository`.
- **Новая port-зависимость**: добавить в `core/ports/<x>.port.ts` → реализация в `infrastructure/...` (sqlite + memory + noop, по необходимости) → добавить в `AppDependencies` + `plugins/dependencies.client.ts` → передать use case через arg.
- **Новая миграция**: `infrastructure/sqlite/migrations/00X_<name>.sql` с возрастающим `version` → migration runner подхватит → smoke-test пустая БД → 00X → assert.
- **Random/Date в новом use case**: получать через `RandomPort` / `ClockPort` из deps, не глобально.

---

Конец AGENTS.md. Любое расширение правил — через PR + ADR.
