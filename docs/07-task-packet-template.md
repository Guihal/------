# Task packet template

## 1. Зачем packet

Fresh CC chat не имеет контекста проекта. Без packet'а агент угадывает scope,
acceptance, имена файлов и слоёв → bugs, лишние файлы, нарушение
[архитектурных запретов](02-architecture.md#18-Архитектурные-запреты),
кросс-MVP утечка фич. Packet = self-contained контракт между юзером и
fresh chat'ом: одна задача, явные границы, измеримый "готово". Юзер копирует
шаблон, заполняет, отправляет в новый чат → агент работает без догадок.

## 2. Анатомия packet'а

Обязательные поля:

- `id` — short ref, формат `<phase>-T<nn>-<kebab-slug>`. Напр.
  `MVP0-T03-create-task-use-case`. Помогает cross-ref'ить из других packet'ов
  и Daily notes.
- `goal` — одно предложение, что хотим. Глагол + измеримый результат.
- `scope_in` — конкретные файлы + сущности. Не "доменные типы", а
  `core/domain/task.ts: Task, TaskStatus, TaskPriority`. Пути — относительно
  корня репо, плоская раскладка из [02-architecture.md § 5](02-architecture.md#5-предлагаемая-структура-проекта)
  (без `src/` префикса).
- `scope_out` — явно за рамки. Особенно фичи будущих MVP, граничащих с этой
  задачей.
- `acceptance` — измеримые критерии чеклистом. Каждый пункт проверяемый:
  тест зелёный, файл существует, инвариант X выполняется, `tsc --noEmit`
  чистый.
- `dependencies` — что должно быть сделано до. ID других packet'ов либо
  ссылка на этап [03-build-roadmap.md](03-build-roadmap.md).
- `read_first` — docs/* которые читать обязательно перед кодом. Конкретный
  раздел/якорь, не "вся документация".
- `risk_tier` — `ordinary | strong_gate | security | db_migration`.
  Определяет, какой моделью и с каким критиком исполнять.
- `file_count_max` — sanity ограничение размера diff. Если агент собрался
  трогать больше — стоп, переосмыслить.
- `notes` — крайние случаи, известные ловушки, fallback'и при отсутствии
  инструмента.

## 3. Шаблон для копипасты

```markdown
# Task packet: <ID>

## Goal
<one sentence: глагол + результат>

## Scope IN
- <file or entity>
- ...

## Scope OUT
- <explicit non-goal>

## Acceptance criteria
- [ ] <criterion 1>
- [ ] <criterion 2>

## Dependencies
- <ID or roadmap stage, или "нет">

## Read first
- docs/02-architecture.md § <section>
- docs/04-technical-decisions.md ADR-<n>

## Risk tier
ordinary | strong_gate | security | db_migration

## File count max
<n>

## Notes
- <edge case / gotcha>
```

## 4. Worked example: MVP-0 scaffold

```markdown
# Task packet: MVP0-T01-scaffold-base

## Goal
Создать рабочий Nuxt 4 client-only проект с строгим TS, Pinia, Vitest и
базовой папочной структурой под hexagonal layout.

## Scope IN
- nuxt.config.ts (ssr:false, modules: @pinia/nuxt)
- tsconfig.json (strict: true, noUncheckedIndexedAccess: true, exactOptionalPropertyTypes: true)
- package.json (Nuxt 4, Vue 3, Pinia, Vitest, @vue/test-utils, TS)
- vitest.config.ts
- app/app.vue (минимальный shell с <NuxtPage/>)
- app/pages/index.vue (заглушка с заголовком "Task Companion")
- core/{domain,use-cases,ports}/.gitkeep
- infrastructure/{sqlite,memory,system,capacitor,noop}/.gitkeep
- app/{components,composables,stores}/.gitkeep
- plugins/.gitkeep
- tests/.gitkeep
- README.md (1 абзац: чем проект, как запускать)
- placeholder test tests/placeholder.test.ts

## Scope OUT
- Capacitor SDK install (следующий packet)
- @capacitor-community/sqlite (отдельный packet T08)
- доменные типы (T05)
- UI компоненты, экраны (этап 4 roadmap)
- design tokens (этап 5)

## Acceptance criteria
- [ ] `bun install` (или npm ci) проходит без ошибок
- [ ] `bunx nuxt dev` стартует, открывает пустой shell без ошибок в консоли
- [ ] `bun test` зелёный на placeholder тесте
- [ ] `bunx tsc --noEmit` без ошибок
- [ ] папки из scope_in присутствуют с .gitkeep
- [ ] README.md описывает запуск dev / test

## Dependencies
- нет (первый packet wave'а)

## Read first
- docs/03-build-roadmap.md § Этап 1
- docs/04-technical-decisions.md ADR-001, ADR-002
- docs/02-architecture.md § 5 Предлагаемая структура проекта

## Risk tier
ordinary

## File count max
15

## Notes
- client-only mode: `ssr: false` в nuxt.config обязательно
- никаких server routes, server middleware
- если bun отсутствует на машине → fallback npm + обновить AGENTS.md § 7 отдельным packet'ом
- структура папок — плоская из 02-architecture § 5 (БЕЗ `src/` префикса). Если Nuxt 4 потребует srcDir — отдельный ADR, не silent decision
- никаких UI styles кроме base reset
- если выбран `src/` корень — обновить AGENTS § 3 + 02 § 5 в этом же packet'е (а не следующем)
```

## 5. Worked example: MVP-0 domain task

```markdown
# Task packet: MVP0-T05-domain-types-and-xp

## Goal
Реализовать доменные типы Task/Profile/Progression и чистые функции расчёта
XP/уровня с полным unit-покрытием Vitest.

## Scope IN
- core/domain/task.ts (Task, TaskStatus, TaskPriority, TaskComplexity, TaskComplexitySource)
- core/domain/profile.ts (Profile)
- core/domain/progression.ts (Progression, XP_PER_LEVEL, computeLevel, computeProgress, computeProgress)
- core/domain/task-xp.ts (BASE_XP, PRIORITY_BONUS, computeBaseXp, computeFinalXp) — pure helper, остаётся внутри core/domain, не нарушает 02 § 5 layering
- tests/domain/task-xp.test.ts
- tests/domain/progression.test.ts

## Scope OUT
- SQLite / memory repositories (T06)
- use case wiring (T07)
- UI (этап 4)
- task multiplier, equipment multiplier (MVP-1)
- reminder поля (MVP-2)

## Acceptance criteria
- [ ] типы exactly соответствуют 02-architecture § 7.1, 7.2, 7.3
- [ ] XP_PER_LEVEL = 1000
- [ ] BASE_XP: tiny=50, small=100, medium=200, large=350
- [ ] PRIORITY_BONUS: low=0, normal=0, high=+50
- [ ] computeFinalXp в MVP-0: `finalXp = baseXp` (taskMultiplier=1, equipmentMultiplier=1)
- [ ] round() при множителях (для совместимости с MVP-1 формулой)
- [ ] computeLevel(xpTotal) = floor(xpTotal / XP_PER_LEVEL) + 1
- [ ] computeProgress возвращает { xpInCurrentLevel, progress, xpToNextLevel }
- [ ] Vitest покрывает: каждую complexity, каждый priority, граничные значения (xpTotal=0, =1000, =999), level-up через границу
- [ ] `bun test` зелёный, `tsc --noEmit` чистый
- [ ] нет импортов из vue/pinia/nuxt/@capacitor

## Dependencies
- MVP0-T01-scaffold-base

## Read first
- docs/02-architecture.md § 7 Доменная модель
- docs/02-architecture.md § 9 Правила XP и уровней
- docs/04-technical-decisions.md ADR-014 (линейные уровни)
- docs/04-technical-decisions.md ADR-009 (только xpMultiplier у предметов)

## Risk tier
ordinary

## File count max
8

## Notes
- MVP-0: taskMultiplier и equipmentXpMultiplier параметры функции, дефолт 1
- multipliers как параметры нужны чтобы MVP-1 не переписывал signature
- не добавлять reminder_at / reminder_enabled / reminder_notification_id (MVP-2)
- не добавлять InventoryItem / Mascot (MVP-1)
- domain слой запрещает импорты из инфраструктуры — см. ADR-007
```

## 6. Worked example: high-risk DB packet

```markdown
# Task packet: MVP0-T08-sqlite-migration-runner

## Goal
Реализовать migration runner поверх @capacitor-community/sqlite с
schema_migrations таблицей, transaction per migration, идемпотентным
применением и smoke-test'ом из пустой БД.

## Scope IN
- infrastructure/sqlite/database.ts (open connection, PRAGMA foreign_keys = ON)
- infrastructure/sqlite/migration-runner.ts (apply pending migrations)
- infrastructure/sqlite/migrations/001_initial.sql (schema_migrations + profile + progression + tasks из 02-architecture § 11)
- infrastructure/sqlite/migrations/index.ts (registry: version → SQL string)
- tests/infrastructure/migration-runner.test.ts (smoke from empty)

## Scope OUT
- SqliteTaskRepository / SqliteProfileRepository / SqliteProgressionRepository (следующий packet)
- MVP-1 миграции inventory/mascot
- MVP-2 миграции visual_state/settings/reminder_*

## Acceptance criteria
- [ ] PRAGMA foreign_keys = ON выполняется при каждом открытии connection
- [ ] schema_migrations создаётся idempotent (CREATE TABLE IF NOT EXISTS)
- [ ] миграции применяются по возрастанию version
- [ ] каждая миграция в отдельной transaction
- [ ] запись в schema_migrations INSERT'ится только после успешного SQL
- [ ] ошибка SQL → ROLLBACK, exception вверх, bootstrap останавливается
- [ ] повторный запуск runner'а из применённой БД = no-op
- [ ] таблицы из 001_initial: schema_migrations, profile, progression, tasks с ВСЕМИ CHECK constraints из 02-architecture § 11
- [ ] indexes idx_tasks_profile_id, idx_tasks_profile_status_due_at, idx_tasks_profile_created_at созданы
- [ ] smoke-test: empty DB → runner → все таблицы есть, FK работают (INSERT в tasks без profile → constraint error)
- [ ] `bun test` зелёный

## Dependencies
- MVP0-T01-scaffold-base
- MVP0-T05-domain-types-and-xp (для согласованности типов status/priority/complexity)

## Read first
- docs/02-architecture.md § 11 SQLite схема
- docs/02-architecture.md § 12 Migration runner contract
- docs/04-technical-decisions.md ADR-018 (миграции через runner)
- docs/04-technical-decisions.md ADR-003 (SQLite через capacitor-community)

## Risk tier
db_migration

## File count max
6

## Notes
- PRAGMA foreign_keys = ON обязательно В КАЖДОМ connection, не один раз
- CHECK constraints копировать дословно из 02-architecture § 11 (тестировать через INSERT-violation)
- примененные миграции редактировать ЗАПРЕЩЕНО — это правило для будущих PR, не для текущего
- если @capacitor-community/sqlite требует async open → весь runner async
- для unit-тестов использовать sqlite in-memory (`:memory:`) либо temp file
- web/browser dev runtime НЕ использует этот runner — там memory repositories (ADR-004)
```

## 7. Routing: какие packet'ы каким моделям

| risk_tier | Модель | Критик | Доп. шаги |
|-----------|--------|--------|-----------|
| `ordinary` | Sonnet / fresh CC | inline /task review | — |
| `strong_gate` | Opus + критик | Opus critic round | `/architect` skill для архитектурной сверки |
| `db_migration` | Opus + критик | Opus critic | обязательно прогон через `/architect` или Codex critic с проверкой CHECK constraints + smoke-test из пустой БД |
| `security` | Opus + критик | Opus critic | `/codex:rescue` review перед commit, отдельная проверка permissions/secrets |

Триггеры эскалации:

- diff factual >100 строк в security/db → `/codex:rescue` обязателен
- ≥3 fix-попытки одного критерия acceptance → `/codex:rescue` second-opinion
- агент трогает >`file_count_max` → стоп, юзер пересматривает scope

## 8. Anti-patterns в packet'е

| Anti-pattern | Что не так | Как фиксить |
|--------------|-----------|-------------|
| Vague goal: "улучшить task module" | агент угадает scope | измеримый глагол: "добавить idempotency guard в completeTaskUseCase" |
| `scope_in` без файлов | агент создаст файлы не там, нарушит layout | конкретные пути из 02-architecture § 5 |
| `acceptance` прозой без чеклиста | "done" размытое, верификация невозможна | `- [ ]` пункты, каждый проверяем командой/тестом |
| `dependencies` пропущены | агент сломает работу предшествующего packet'а | ссылка на ID либо явно "нет" |
| `read_first` пустое | агент пропустит invariant из ADR, нарушит правило | минимум 1 раздел 02-architecture + релевантные ADR |
| `risk_tier` не указан | routing неверный, dangerous диф без critic'а | всегда явно, дефолт `ordinary` только когда уверен |
| `file_count_max` отсутствует | агент превратит packet в мега-рефактор | sanity cap: domain ~8, infra ~6-10, UI ~12 |
| Смешение MVP в одном packet'е | reminder в MVP-0 packet, inventory в MVP-0 packet | один packet = один MVP, явный `scope_out` для соседних MVP |
| `notes` пустые при ловушках | агент наступит на грабли (например забудет `PRAGMA foreign_keys`) | перечислить edge cases, fallback'и, обязательные PRAGMA |
| Scope IN перечисляет "всё в src/core" | агент трогает несвязанный код | конкретные файлы/символы |

## 9. Цикл использования

1. Юзер берёт следующий packet из roadmap (этап → задачи).
2. Заполняет шаблон по разделу 3.
3. Прогоняет packet через `/architect` (для `strong_gate`/`db_migration`).
4. Открывает fresh CC chat → копирует заполненный packet.
5. Агент работает в рамках scope.
6. Юзер верифицирует acceptance, проверяет `git diff` (см. CLAUDE.md
   `Delegate verify after writing`).
7. Если acceptance не пройдены → patch round в том же чате либо новый packet
   `<ID>-fix`.

## 9.1. Универсальность шаблона

Worked examples MVP0-T01/T05/T08 покрывают **MVP-0** (scaffold / domain /
db_migration). Шаблон § 3 работает для **всех фаз** — MVP-1 (inventory/mascot),
MVP-2 (notifications/visual_state), Post-MVP (sync/server). Меняется только:

- `id` prefix → `MVP1-T<nn>-...`, `MVP2-T<nn>-...`, `POST-T<nn>-...`
- `scope_out` — фичи СОСЕДНИХ фаз явно (напр. MVP-1 packet exclude'ит MVP-2
  visual random)
- `risk_tier` — MVP-1 equip/drop = `strong_gate` (idempotency + 5-step
  валидация); MVP-2 notification reconciliation = `strong_gate` (side-effects
  через ports)
- `read_first` — добавлять [05-critic-pass.md](05-critic-pass.md) watchlist
  пункты, релевантные фазе

## 10. Связанные документы

- [01-product-vision.md](01-product-vision.md) — что строим
- [02-architecture.md](02-architecture.md) — как строим (источник правды
  для типов, слоёв, портов)
- [03-build-roadmap.md](03-build-roadmap.md) — порядок этапов
- [04-technical-decisions.md](04-technical-decisions.md) — ADR, на которые
  ссылается `read_first`
- [05-critic-pass.md](05-critic-pass.md) — watchlist, который packet'ы
  должны учитывать
- [08-glossary.md](08-glossary.md) — словарь терминов packet'ов
