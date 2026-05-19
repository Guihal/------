# Глоссарий

Единый источник правды для терминов проекта. При расхождении
формулировок в чатах — этот файл побеждает. Для подробной логики смотреть
[02-architecture.md](02-architecture.md) — здесь только определения и
ref-ссылки.

## Продукт

- **Task Companion** — рабочее название приложения; не финальный бренд. См.
  [01-product-vision.md § 1](01-product-vision.md#1-Рабочее-определение).
- **MVP-0** — фаза релиза: рабочее ядро задач, SQLite, XP, уровни. См.
  [01 § 8](01-product-vision.md#8-MVP-0).
- **MVP-1** — фаза: маскот, инвентарь, XP-множители, награды. См.
  [01 § 9](01-product-vision.md#9-MVP-1).
- **MVP-2** — фаза: локальные уведомления, visual random, настройки. См.
  [01 § 10](01-product-vision.md#10-MVP-2).
- **Post-MVP** — всё после MVP-2: сервер, sync, команды, календарь,
  привычки, Pomodoro. См. [01 § 11](01-product-vision.md#11-Не-входит-в-MVP).
- **Просрочено** — UI-термин для задач с `dueAt < now AND status = active`.
  Не использовать "провалено" — продукт без наказаний. См.
  [01 § 12.4](01-product-vision.md#124-Просрочка-задачи).
- **Архивация (archive)** — soft-removal задачи через `status = archived` +
  `archivedAt`. Основной пользовательский flow удаления. См.
  [ADR-011](04-technical-decisions.md#ADR-011-Архивация-вместо-удаления-в-основном-flow).
- **Hard delete** — физическое удаление строки из SQLite. Не используется в
  пользовательском UI MVP, оставлено для debug/Post-MVP.

## Домен задач

- **Task** — задача пользователя. Поля: `id, profileId, title, description,
  status, priority, complexity, complexitySource, dueAt, createdAt,
  updatedAt, completedAt, archivedAt`. См.
  [02 § 7.1](02-architecture.md#71-Task).
- **TaskStatus** — `"active" | "completed" | "archived"`. Просрочки нет в
  enum'е (derived state).
- **TaskPriority** — `"low" | "normal" | "high"`. (Глоссарий уточнение:
  `urgent` НЕ существует в MVP, только эти три.)
- **TaskComplexity** — `"tiny" | "small" | "medium" | "large"`.
- **TaskComplexitySource** — `"suggested" | "manual"`. `suggested` —
  поставлено автоматически по эвристике; `manual` — пользователь поправил.
- **dueAt** — ISO datetime дедлайна, nullable.
- **Overdue** — derived state, НЕ статус. `status = active AND dueAt < now`.
  См. [ADR-010](04-technical-decisions.md#ADR-010-Просрочка-не-является-статусом).
- **Suggested complexity** — детерминированный ordered decision tree,
  возвращает complexity по priority/description/title длине. См.
  [02 § 8 Автоматическое предположение сложности](02-architecture.md#автоматическое-предположение-сложности).
- **resolveTaskList** — use case группировки + сортировки задач для главного
  экрана: просроченные → ближайшие → без дедлайна → выполненные.

## Геймификация

- **XP** — experience points, начисляются за выполнение задачи.
- **baseXp** — XP по complexity + priority bonus.
  `tiny=50, small=100, medium=200, large=350` плюс
  `high → +50`. См. [02 § 9](02-architecture.md#9-Правила-XP-и-уровней).
- **taskMultiplier** — random ролл при выполнении задачи (MVP-1):
  `1.00/70%, 1.25/20%, 1.50/8%, 2.00/2%`. В MVP-0 = 1.
- **equipmentXpMultiplier** — произведение `xpMultiplier` всех надетых
  предметов; clamp `[1.0, 2.0]`. В MVP-0 = 1.
- **finalXp** — `round(baseXp * taskMultiplier * equipmentXpMultiplier)`.
  В MVP-0 `finalXp = baseXp`.
- **XP_PER_LEVEL** — константа 1000. Линейный прогресс. См.
  [ADR-014](04-technical-decisions.md#ADR-014-Уровни-линейные-с-фиксированным-XP-на-уровень).
- **Level** — `floor(xpTotal / XP_PER_LEVEL) + 1`.
- **xpInCurrentLevel** — `xpTotal % XP_PER_LEVEL`.
- **xpToNextLevel** — `XP_PER_LEVEL - xpInCurrentLevel`.
- **Level reward** — предмет, выдаваемый на уровнях кратных 5 (MVP-1).
  Идемпотентность через таблицу `level_rewards`. См.
  [ADR-015](04-technical-decisions.md#ADR-015-Награды-за-уровни-идемпотентны).
- **Task drop** — random выдача предмета после complete (MVP-1); шанс
  зависит от `finalXp`. См. [ADR-021](04-technical-decisions.md#ADR-021-Drop-chance-зависит-от-итогового-XP-задачи).
- **dropMultiplier** — `clamp(finalXp / DROP_XP_UNIT, 0.5, 2.5)`.
  `DROP_XP_UNIT = 300`.
- **DROP_DIFFICULTY** — 1.25, делитель для effective threshold.
- **effectiveThreshold[rarity]** — `min(base[r] * dropMultiplier /
  DROP_DIFFICULTY, cap[r])`. См.
  [02 § 10 Task drop](02-architecture.md#task-drop).
- **TaskRewardRoll** — audit-запись результата drop'а, ключ `task_id`.
  Запрещает повторный roll для той же задачи (идемпотентность).

## Инвентарь и маскот

> ⚠ **MVP-1/MVP-2** — пропустить если делаешь MVP-0. MVP-0 поддерживает только
> базовый XP/level flow без предметов и маскота.


- **InventoryRarity** — `"common" | "rare" | "epic" | "legendary"`.
- **InventoryItem** — базовый предмет (template) из каталога: `id, title,
  description, rarity, slot, imageKey`. См.
  [02 § 7.4](02-architecture.md#74-InventoryItem).
- **InventorySlot** — `string`. Стартовый набор —
  `DEFAULT_MASCOT_SLOTS = ["head", "face", "body", "hand", "background"]`.
- **ItemStats** — `{ xpMultiplier: number }`. В MVP-1 это единственная
  характеристика. См. [ADR-009](04-technical-decisions.md#ADR-009-Предметы-в-MVP-1-имеют-только-XP-множитель).
- **xpMultiplier (item)** — ролленый при выдаче бонус, CHECK `1.0..1.45`.
  Диапазоны по редкости: common 1.02-1.08, rare 1.08-1.16,
  epic 1.16-1.28, legendary 1.28-1.45.
- **UserInventoryItem** — конкретный экземпляр в инвентаре пользователя с
  ролленым `stats.xpMultiplier`, `source ("level"|"task-drop")`,
  `sourceTaskId | sourceLevel`. См.
  [02 § 7.6](02-architecture.md#76-UserInventoryItem).
- **EquippedItem** — связь `(profileId, slot) → userInventoryItemId`. Один
  предмет на slot. См. [02 § 7.7](02-architecture.md#77-EquippedItem).
- **LevelReward** — запись `(profileId, level) → userInventoryItemId`,
  гарантирует idempotent выдачу награды за уровень.
- **Mascot** — персонаж в профиле: `id, name, imageKey, slots`. Слоты
  описаны данными, не зашиты в компонент. См.
  [02 § 7.10](02-architecture.md#710-Mascot).
- **MascotSlot** — `{ key, title, anchor }` где anchor —
  `{ left?, top?, right?, bottom?, zIndex? }`. Используется
  `MascotView` для позиционирования предмета.
- **Slot compatibility** — проверка `equipItem`: `userInventoryItem.slot`
  должен совпадать со `mascotSlot.key` активного маскота. См.
  [02 § 8 Экипировка предмета](02-architecture.md#экипировка-предмета).
- **`equipItem` 5-step pre-write** — обязательная процедура ДО любого
  repository write (критика #28): (1) load owned `UserInventoryItem`, (2) load
  base `InventoryItem`, (3) load active `Mascot`, (4) load mascot slots,
  (5) валидировать slot compatibility + same-profile ownership. Прямой
  `repository.equip()` без сверки → cross-profile / wrong-slot bug.
  См. [AGENTS § 9 #27](../AGENTS.md#9-anti-patterns-hard).
- **`createTaskRewardRoll` rarity-match invariant** — use case обязан загрузить
  `UserInventoryItem` и проверить `item.rarity === droppedRarity` ДО записи
  audit. Иначе audit ссылается на предмет другой редкости (критика #32).
  См. [AGENTS § 9 #26](../AGENTS.md#9-anti-patterns-hard).

## Архитектура

- **Hexagonal** — ядро (`core/domain` + `core/use-cases`) изолировано от
  инфраструктуры через `core/ports`. Зависимости только
  `UI → Store → Use Case → Port → Infrastructure`. Обратные запрещены.
  См. [02 § 1](02-architecture.md#1-Архитектурная-цель).
- **Port** — TS interface для внешней зависимости (репозитория, API,
  системного сервиса). Живёт в `core/ports/`.
- **Adapter** — реализация порта в `infrastructure/`. Бывают: `sqlite/*`,
  `memory/*`, `capacitor/*`, `noop/*`, `system/*`.
- **Repository** — порт для CRUD над агрегатом. Напр. `TaskRepository`,
  `ProfileRepository`, `InventoryRepository`. См.
  [02 § 13](02-architecture.md#13-Repository-contracts).
- **UnitOfWorkPort** — транзакционный контекст. `run<T>(operation: (ctx:
  UnitOfWorkContext) => Promise<T>): Promise<T>`. Внутри callback'а только
  repositories из `ctx`. Nested transactions запрещены. См.
  [ADR-017](04-technical-decisions.md#ADR-017-Многошаговые-use-cases-выполняются-транзакционно).
- **UnitOfWorkContext** — объект с transaction-bound repositories,
  передаваемый в callback `unitOfWork.run`.
- **ClockPort** — `nowIso(): string` (ISO-8601). Инжектится в use case чтобы
  тесты были детерминированы вместо `Date.now()` / `new Date()`. Канон —
  [AGENTS § 5](../AGENTS.md#5-typescript-strict-mode).
- **RandomPort** — порт замены `Math.random()` в доменной логике (taskMultiplier,
  drop roll, MVP-1). Сигнатура методов **не зафиксирована** — определяется ADR
  на scaffold MVP-1 этапа; до этого callers сами решают форму (single-call
  `nextValue()` vs семейство `nextFloat/nextInt` — оставлено открытым). Test
  fake — `SeededRandomPort` ([AGENTS § 6 Tier 2](../AGENTS.md#6-test-strategy)).
- **IdGeneratorPort** — `newId(): string`. Замена `crypto.randomUUID()`.
- **NotificationPort** — MVP-2 порт для локальных уведомлений
  (`requestPermissions`, `scheduleTaskReminder`, `cancelTaskReminder`,
  `listPendingTaskReminders`).
- **Memory repository** — in-memory реализация repository для browser dev
  runtime. Сбрасывается при reload. См.
  [ADR-004](04-technical-decisions.md#ADR-004-Browser-dev-использует-memory-repositories).
- **AppDependencies** — типизированный bag всех портов, собираемый в
  `plugins/dependencies.client.ts` и раздаваемый через
  `useAppDependencies` composable. См.
  [02 § 6](02-architecture.md#6-Dependency-container).
- **Use case** — единица доменного действия (`createTask`, `completeTask`,
  `grantTaskXp`). Получает порты через параметры, не импортирует
  инфраструктуру.
- **Store** — Pinia store, application state/cache + методы-обёртки над use
  case'ами. Бизнес-логику не содержит. См.
  [ADR-007](04-technical-decisions.md#ADR-007-Stores-не-содержат-бизнес-логику).
- **Bootstrap flow** — последовательность инициализации приложения: detect
  runtime → собрать container → открыть SQLite → миграции → создать
  профиль/progression → загрузить данные. См.
  [02 § 16](02-architecture.md#16-Bootstrap-flow).
- **Migration runner** — единый компонент, применяющий SQL миграции из
  registry по возрастанию version, transaction-per-migration, idempotent.
  См. [02 § 12](02-architecture.md#12-Migration-runner-contract) и
  [ADR-018](04-technical-decisions.md#ADR-018-Миграции-выполняются-через-migration-runner).
- **Same-profile ownership** — инвариант: все ссылки внутри inventory/
  reward/drop таблиц должны принадлежать одному profile_id. Реализуется
  composite FK + repository checks. См.
  [02 § 11 Same-profile ownership rules](02-architecture.md#11-SQLite-схема).
- **Notification reconciliation** — MVP-2 процедура на bootstrap: сверить
  pending notifications с БД, отменить лишние, пересоздать расходящиеся.
  См. [ADR-020](04-technical-decisions.md#ADR-020-Notification-side-effects-имеют-reconciliation).
- **Composite FK** — внешний ключ из ≥2 колонок (обычно `(profile_id, X)`),
  гарантирующий same-profile ownership связанных строк. См.
  [02 § 11 Same-profile ownership rules](02-architecture.md#11-SQLite-схема).
- **Ordered decision tree** — детерминированный механизм правил без random:
  список условий проверяется по порядку, побеждает первое match'нувшее.
  Используется в `suggestTaskComplexity` (priority → keyword → длина title).
  См. [02 § 8](02-architecture.md#автоматическое-предположение-сложности).
- **Dependency container** — собранный `AppDependencies` в
  `plugins/dependencies.client.ts`. Контейнер раздаётся через
  `useAppDependencies` composable, передаётся аргументом в use case.
  Не глобальный singleton — Nuxt plugin scope. См.
  [02 § 6](02-architecture.md#6-Dependency-container).
- **Tier 1-4 tests** — категоризация тестов из AGENTS § 6: T1 domain unit
  (Vitest, чистые функции), T2 use case integration (Vitest + memory repos
  + FakeClockPort/SeededRandomPort), T3 infrastructure (SQLite — Android
  device/emulator), T4 UI (ручное QA + опциональные snapshot'ы). См.
  [AGENTS § 6](../AGENTS.md#6-test-strategy).
- **Runtime detection** — определение среды (Android Capacitor vs browser dev)
  в bootstrap для выбора SQLite vs memory repositories. См.
  [02 § 16 Bootstrap flow](02-architecture.md#16-Bootstrap-flow).
- **Level-up** — событие пересечения границы XP_PER_LEVEL после `applyLevelProgress`.
  В MVP-0 → спокойный UI feedback; в MVP-1 → проверка `grantLevelRewards`
  (kratных 5).

## Платформа

- **Capacitor** — мост Web → native. Web-приложение упаковывается в Android
  shell. См. [ADR-002](04-technical-decisions.md#ADR-002-Основная-платформа-MVP-Android).
- **@capacitor-community/sqlite** — кандидат SQLite-плагина для Android
  runtime. См. [ADR-003](04-technical-decisions.md#ADR-003-Локальное-хранилище-production-runtime-SQLite).
  Watchlist: подтвердить установкой + минимальным CRUD на scaffold этапе.
- **client-only mode** — Nuxt без SSR (`ssr: false`). Все Capacitor API
  только на клиенте. См. [ADR-001](04-technical-decisions.md#ADR-001-Nuxt-работает-как-клиентское-приложение).
- **Android-first** — целевая платформа MVP. iOS не блокирует.
- **Browser dev runtime** — режим разработки UI/доменной логики в
  браузере с memory repositories + NoopNotificationPort. Не production.

## Визуал (MVP-2)

> ⚠ **MVP-2** — пропустить если делаешь MVP-0/MVP-1. MVP-0 использует static
> dark baseline без random.


- **Static dark baseline** — MVP-0: статичная тёмная тема + design
  tokens, БЕЗ random. См. [ADR-019](04-technical-decisions.md#ADR-019-MVP-0-имеет-static-dark-baseline-MVP-2-имеет-visual-random).
- **Visual random** — MVP-2 контролируемая вариативность темы, текста,
  заголовка. Только на событиях `app-enter | page-enter | task-created |
  level-up | manual`. См. [ADR-012](04-technical-decisions.md#ADR-012-Visual-random-хранится-в-состоянии).
- **VisualState** — persisted snapshot выбранных random значений
  `(key, value, updatedAt)` в таблице `visual_state`.
- **reducedMotion** — пользовательская настройка отключения анимаций.
- **disableVisualRandomness** — настройка отключения visual random.
- **Refresh event** — momentum-точка, в которой visual use case
  переролливает значения.

## Процесс

- **ADR** — Architecture Decision Record, см.
  [04-technical-decisions.md](04-technical-decisions.md).
- **Critic pass** — итерация субагентского ревью документа/кода. См.
  [05-critic-pass.md](05-critic-pass.md).
- **Definition of Done** — критерии готовности фазы. См.
  [03 § 7](03-build-roadmap.md#7-Definition-of-Done).
- **Task packet** — self-contained контракт задачи для fresh CC chat'а.
  См. [07-task-packet-template.md](07-task-packet-template.md).
- **Risk tier** — категория packet'а: `ordinary | strong_gate | security |
  db_migration`. Определяет routing на модель + критика.
- **RLM cycle** — Reflection-Loop-Mutation: агент + критик в нескольких
  итерациях. См. AGENTS.md и CLAUDE.md `/task`.
- **Watchlist** — список non-blocking рисков из critic pass, требующих
  внимания на следующих этапах. См.
  [05 § Watchlist](05-critic-pass.md#Watchlist).

## Расхождения / уточнения

- Промежуточные документы могли упоминать `urgent` priority — это **не**
  поддерживается. Канон: `low | normal | high`.
- "Срочные/просроченные" в UI — derived визуальные группы, не статус.
- "Удаление задачи" в UI — на самом деле архивирование.
- В MVP-0 любое упоминание taskMultiplier/equipmentMultiplier означает
  значение 1; реальный ролл — MVP-1.
