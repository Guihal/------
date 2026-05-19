# Архитектура приложения

## 1. Архитектурная цель

Нужно построить мобильное offline-first приложение, где UI не зависит напрямую
от SQLite, Capacitor API и будущего сервера. Бизнес-логика живет отдельно от
компонентов, чтобы ее можно было тестировать и переносить.

Главное правило зависимостей:

```txt
UI -> Store -> Use Case -> Port/Repository Interface -> Infrastructure
```

Обратные зависимости запрещены.

Архитектура проектируется под весь продукт, но реализуется по этапам из
[00-scope-map.md](00-scope-map.md). MVP-0 не должен тащить в первый коммит
маскота, инвентарь, уведомления и visual random.

## 2. Стек

```txt
Nuxt 4
Vue 3
TypeScript
Pinia
Capacitor
SQLite
Vitest
```

Режим приложения для MVP:

- клиентское приложение;
- без SSR для мобильной сборки;
- Android как основной целевой runtime;
- браузерный режим используется для разработки UI и доменной логики.

## 3. Этапы архитектурной реализации

### MVP-0

Реализуются:

- `Task`;
- `Profile`;
- `Progression`;
- `TaskRepository`;
- `ProfileRepository`;
- `ProgressionRepository`;
- SQLite infrastructure;
- memory repositories для браузерной разработки;
- task use cases;
- progression use cases;
- app bootstrap.
- static dark baseline и базовые design tokens.

### MVP-1

Добавляются:

- `Mascot`;
- `InventoryItem`;
- `UserInventoryItem`;
- `EquippedItem`;
- `LevelReward`;
- `InventoryRepository`;
- `MascotRepository`;
- выдача и экипировка предметов.

### MVP-2

Добавляются:

- `NotificationPort`;
- `VisualStateRepository`;
- `SettingsRepository`;
- controlled visual random;
- visual variants и persisted theme state;
- local notifications;
- settings.

### Post-MVP

Добавляются только после завершения MVP:

- REST repositories;
- sync layer;
- auth/session;
- team/collaboration modules;
- advanced calendar/repeating tasks.

## 4. Слои

### 4.1 UI layer

Отвечает за отображение и пользовательские события.

Содержит:

- страницы;
- компоненты;
- формы;
- карточки;
- модальные окна;
- визуальные состояния.

UI не должен:

- вызывать SQLite;
- считать XP;
- определять повышение уровня;
- решать, выпал ли предмет;
- напрямую работать с Capacitor notifications;
- вызывать `Math.random()` для доменного или визуального поведения.

### 4.2 Store layer

Pinia хранит состояние экрана и вызывает use cases.

Stores являются application state/cache, а не местом бизнес-логики.

MVP-0 stores:

```txt
app.store.ts
task.store.ts
profile.store.ts
progression.store.ts
```

MVP-1 stores:

```txt
mascot.store.ts
inventory.store.ts
```

MVP-2 stores:

```txt
visual.store.ts
settings.store.ts
```

Store может иметь `loading`, `error`, `load`, `create`, `complete`, но не должен
содержать правила расчета XP, сортировки или наград.

### 4.3 Use case layer

Use cases выполняют конкретные пользовательские действия.

MVP-0:

```txt
bootstrap-app.use-case.ts
create-task.use-case.ts
update-task.use-case.ts
complete-task.use-case.ts
archive-task.use-case.ts
reschedule-task.use-case.ts
resolve-task-list.use-case.ts
suggest-task-complexity.use-case.ts
grant-task-xp.use-case.ts
apply-level-progress.use-case.ts
```

MVP-1:

```txt
grant-level-rewards.use-case.ts
roll-task-xp-multiplier.use-case.ts
roll-inventory-drop.use-case.ts
generate-item-stats.use-case.ts
equip-item.use-case.ts
unequip-item.use-case.ts
```

MVP-2:

```txt
apply-visual-refresh.use-case.ts
schedule-task-reminder.use-case.ts
cancel-task-reminder.use-case.ts
update-settings.use-case.ts
```

Use case получает зависимости через интерфейсы, а не импортирует
инфраструктурные классы напрямую.

### 4.4 Domain layer

Содержит чистые типы, enum-like константы и доменные функции.

MVP-0:

```txt
Task
TaskStatus
TaskPriority
TaskComplexity
TaskComplexitySource
Profile
Progression
```

MVP-1:

```txt
Mascot
InventoryItem
UserInventoryItem
EquippedItem
LevelReward
TaskRewardRoll
ItemStats
MascotSlot
```

MVP-2:

```txt
VisualState
Settings
ReminderRule
```

Domain layer не зависит от Vue, Pinia, Nuxt, Capacitor или SQLite.

### 4.5 Repository/Port layer

Описывает интерфейсы доступа к данным и внешним API.

MVP-0 ports:

```txt
TaskRepository
ProfileRepository
ProgressionRepository
ClockPort
IdGeneratorPort
UnitOfWorkPort
```

MVP-1 ports:

```txt
InventoryRepository
MascotRepository
RandomPort
```

MVP-2 ports:

```txt
SettingsRepository
VisualStateRepository
NotificationPort
```

`ClockPort`, `IdGeneratorPort` и `RandomPort` нужны, чтобы тестировать use cases
без реального времени, `crypto.randomUUID()` и `Math.random()`.

### 4.6 Infrastructure layer

Android runtime:

```txt
SqliteTaskRepository
SqliteProfileRepository
SqliteProgressionRepository
SqliteInventoryRepository
SqliteMascotRepository
SqliteSettingsRepository
SqliteVisualStateRepository
CapacitorNotificationPort
SystemClockPort
CryptoIdGeneratorPort
MathRandomPort
```

Browser dev runtime:

```txt
MemoryTaskRepository
MemoryProfileRepository
MemoryProgressionRepository
MemoryInventoryRepository
MemoryMascotRepository
MemorySettingsRepository
MemoryVisualStateRepository
NoopNotificationPort
SystemClockPort
CryptoIdGeneratorPort
MathRandomPort
```

Browser repositories нужны не как production-хранилище, а чтобы UI можно было
разрабатывать без Android runtime. Проверка персистентности MVP выполняется на
SQLite/Android.

Позже можно добавить:

```txt
RestTaskRepository
RestProfileRepository
RestInventoryRepository
```

UI и stores не должны знать, какая реализация используется.

## 5. Предлагаемая структура проекта

```txt
app.vue              # root — Nuxt 4 default (ssr: false для Capacitor)
app/
  pages/
    index.vue
    tasks/
      new.vue
      [id].vue
    profile.vue
    inventory.vue
    settings.vue
  components/
    tasks/
      TaskCard.vue
      TaskList.vue
      TaskForm.vue
      TaskGroup.vue
      TaskStatusBadge.vue
    mascot/
      MascotView.vue
      EquippedItemLayer.vue
    inventory/
      InventoryGrid.vue
      InventoryItemCard.vue
    layout/
      AppHeader.vue
      BottomNav.vue
  composables/
    useAppDependencies.ts
  stores/
    app.store.ts
    task.store.ts
    profile.store.ts
    progression.store.ts
    mascot.store.ts
    inventory.store.ts
    visual.store.ts
    settings.store.ts
core/
  domain/
    task.ts
    profile.ts
    progression.ts
    mascot.ts
    inventory.ts
    visual.ts
    settings.ts
  use-cases/
    app/
    tasks/
    progression/
    inventory/
    visual/
    notifications/
    settings/
  ports/
    task.repository.ts
    profile.repository.ts
    progression.repository.ts
    inventory.repository.ts
    mascot.repository.ts
    settings.repository.ts
    visual-state.repository.ts
    notification.port.ts
    clock.port.ts
    id-generator.port.ts
    random.port.ts
    unit-of-work.port.ts
infrastructure/
  sqlite/
    database.ts
    migrations/
      001_initial.sql
    repositories/
      sqlite-task.repository.ts
      sqlite-profile.repository.ts
      sqlite-progression.repository.ts
      sqlite-inventory.repository.ts
      sqlite-settings.repository.ts
      sqlite-visual-state.repository.ts
      sqlite-unit-of-work.port.ts
  memory/
    memory-task.repository.ts
    memory-profile.repository.ts
    memory-progression.repository.ts
    memory-inventory.repository.ts
    memory-mascot.repository.ts
    memory-settings.repository.ts
    memory-visual-state.repository.ts
    memory-unit-of-work.port.ts
  capacitor/
    capacitor-notification.port.ts
  noop/
    noop-notification.port.ts
  system/
    system-clock.port.ts
    crypto-id-generator.port.ts
    math-random.port.ts
plugins/
  dependencies.client.ts
```

Если Nuxt-конфигурация проекта потребует другой физической раскладки, правило
остается тем же: `core` не зависит от `app` и `infrastructure`.

## 6. Dependency container

Приложению нужен один слой сборки зависимостей.

```ts
export type AppDependencies = {
  taskRepository: TaskRepository
  profileRepository: ProfileRepository
  progressionRepository: ProgressionRepository
  inventoryRepository?: InventoryRepository
  mascotRepository?: MascotRepository
  settingsRepository?: SettingsRepository
  visualStateRepository?: VisualStateRepository
  notificationPort?: NotificationPort
  clock: ClockPort
  idGenerator: IdGeneratorPort
  unitOfWork: UnitOfWorkPort
  random?: RandomPort
}
```

Паттерн:

1. `plugins/dependencies.client.ts` создает реализации портов.
2. Плагин делает `nuxtApp.provide("appDeps", deps)`.
3. `app/composables/useAppDependencies.ts` возвращает типизированные deps.
4. Stores получают deps через composable.
5. Stores создают или вызывают use cases, передавая deps.

Запрещено импортировать `new SqliteTaskRepository()` внутри store или
компонента.

## 7. Доменная модель

### 7.1 Task

```ts
export type TaskStatus = "active" | "completed" | "archived"
export type TaskPriority = "low" | "normal" | "high"
export type TaskComplexity = "tiny" | "small" | "medium" | "large"
export type TaskComplexitySource = "suggested" | "manual"

export type Task = {
  id: string
  profileId: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  complexity: TaskComplexity
  complexitySource: TaskComplexitySource
  dueAt: string | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
  archivedAt: string | null
}
```

Просрочка не является отдельным статусом. Она вычисляется:

```txt
status = active AND dueAt < now
```

Так проще не плодить переходы состояний и не ломать выполнение просроченной
задачи.

### 7.2 Profile

```ts
export type Profile = {
  id: string
  displayName: string
  createdAt: string
  updatedAt: string
}
```

В MVP один локальный профиль.

### 7.3 Progression

```ts
export const XP_PER_LEVEL = 1000

export type Progression = {
  profileId: string
  level: number
  xpTotal: number
  updatedAt: string
}
```

`xpTotal` хранит весь накопленный XP. Уровни линейные: до каждого следующего
уровня нужно фиксированное количество XP.

Level-up:

```txt
level = floor(xpTotal / XP_PER_LEVEL) + 1
```

UI-прогресс:

```txt
xpInCurrentLevel = xpTotal % XP_PER_LEVEL
progress = xpInCurrentLevel / XP_PER_LEVEL
xpToNextLevel = XP_PER_LEVEL - xpInCurrentLevel
```

### 7.4 InventoryItem

MVP-1.

```ts
export type InventoryRarity = "common" | "rare" | "epic" | "legendary"
export type InventorySlot = string

export const DEFAULT_MASCOT_SLOTS = [
  "head",
  "face",
  "body",
  "hand",
  "background"
] as const

export type InventoryItem = {
  id: string
  title: string
  description: string | null
  rarity: InventoryRarity
  slot: InventorySlot
  imageKey: string
}
```

`InventoryItem` - базовый предмет/визуальная модель. Конкретный полученный
экземпляр предмета хранит свои сгенерированные характеристики в
`UserInventoryItem`.

В MVP-1 единственная характеристика предмета - XP-множитель. Бонусы к шансам
выпадения, штрафам и другим механикам остаются Post-MVP.

### 7.5 ItemStats

MVP-1.

```ts
export type ItemStats = {
  xpMultiplier: number
}
```

Диапазоны XP-множителя по редкости:

```txt
common    1.02 - 1.08
rare      1.08 - 1.16
epic      1.16 - 1.28
legendary 1.28 - 1.45
```

Значения стартовые и подлежат балансировке после первых тестов.

### 7.6 UserInventoryItem

MVP-1.

```ts
export type UserInventoryItem = {
  id: string
  profileId: string
  baseItemId: string
  rarity: InventoryRarity
  stats: ItemStats
  source: "level" | "task-drop"
  sourceTaskId: string | null
  sourceLevel: number | null
  acquiredAt: string
}
```

### 7.7 EquippedItem

MVP-1.

```ts
export type EquippedItem = {
  profileId: string
  slot: InventorySlot
  userInventoryItemId: string
  equippedAt: string
}
```

### 7.8 LevelReward

MVP-1.

```ts
export type LevelReward = {
  profileId: string
  level: number
  userInventoryItemId: string
  grantedAt: string
}
```

`LevelReward` делает выдачу предметов идемпотентной: награда за 5-й уровень не
может быть выдана повторно при повторном запуске use case.

### 7.9 TaskRewardRoll

MVP-1.

```ts
export type TaskRewardRoll = {
  taskId: string
  profileId: string
  baseXp: number
  taskMultiplier: number
  equipmentXpMultiplier: number
  finalXp: number
  dropMultiplier: number
  roll: number
  droppedRarity: InventoryRarity | null
  userInventoryItemId: string | null
  createdAt: string
}
```

`TaskRewardRoll` делает drop после выполнения задачи идемпотентным. Повторный
вызов `completeTask` не должен повторно роллить task multiplier или предмет.

### 7.10 Mascot

MVP-1.

```ts
export type Mascot = {
  id: string
  name: string
  imageKey: string
  slots: MascotSlot[]
}

export type MascotSlot = {
  key: InventorySlot
  title: string
  anchor: {
    left?: string
    top?: string
    right?: string
    bottom?: string
    zIndex?: number
  }
}
```

MVP допускает одного дефолтного маскота, но его слоты должны быть описаны
данными, а не зашиты в компонентах. Это позволит менять набор слотов и anchor
points без переписывания `MascotView`. Стартовый набор слотов задается через
`DEFAULT_MASCOT_SLOTS`, но БД и доменная модель допускают добавление новых
строковых slot keys.

### 7.11 VisualState

MVP-2.

```ts
export type VisualState = {
  key: string
  value: string
  updatedAt: string
}
```

Используется для сохранения выбранной темы, текста кнопки, заголовка и других
контролируемых случайных значений.

### 7.12 TaskReminder

MVP-2.

```ts
export type TaskReminder = {
  taskId: string
  reminderAt: string | null
  reminderEnabled: boolean
  reminderNotificationId: number | null
}
```

Reminder-поля не нужны для MVP-0 task flow и добавляются только вместе с
локальными уведомлениями.

## 8. Правила задач

### Создание

Правила:

- `title` обязателен;
- `profileId` берется из локального профиля;
- `description` необязателен;
- `priority` по умолчанию `normal`;
- `complexity` считается автоматически как suggested value;
- `complexitySource` по умолчанию `suggested`;
- если пользователь меняет сложность, `complexitySource = manual`;
- `status` всегда начинается с `active`;
- если задан `dueAt`, в MVP-0 это только дедлайн без локального уведомления;
- reminder-поведение появляется в MVP-2.

### Автоматическое предположение сложности

MVP-эвристика должна быть детерминированной. Правила проверяются сверху вниз,
первое совпавшее правило возвращает сложность:

```txt
1. large  - priority = high AND description exists AND dueAt exists
2. medium - priority = high
3. medium - title length > 60 OR description length > 160
4. small  - title length > 20 OR description exists
5. tiny   - fallback
```

Это не интеллектуальная оценка усилий, а стартовое предположение для снижения
ручного ввода. Пользователь может поправить его вручную.

### Сортировка и группировка задач

Главная не показывает один бесконечный список без структуры. Порядок групп:

1. просроченные активные задачи;
2. задачи с ближайшим дедлайном;
3. задачи без дедлайна;
4. выполненные задачи в свернутом блоке или ниже.

Внутри одинаковых групп:

```txt
high priority first
earlier dueAt first
newer createdAt first
```

Ручной drag-and-drop остается Post-MVP.

### Выполнение

При выполнении:

1. задача получает `status = completed`;
2. заполняется `completedAt`;
3. рассчитывается базовый XP задачи;
4. в MVP-1 роллится task multiplier;
5. в MVP-1 применяется XP-множитель надетых предметов;
6. в одной транзакции начисляется итоговый XP и обновляется уровень;
7. в MVP-1 в той же транзакции проверяются level rewards и task drop;
8. после commit в MVP-2 отменяется локальное уведомление.

### Архивация

Архивация используется вместо жесткого удаления в пользовательском flow.

Физическое удаление можно оставить для debug/настроек/Post-MVP очистки данных.

### Экипировка предмета

MVP-1.

Правила:

- экипировать можно только предмет из `user_inventory_items` текущего профиля;
- slot предмета должен существовать в `mascot_slots` активного маскота;
- slot предмета должен совпадать со slot экипировки;
- в одном slot может быть только один надетый предмет;
- при экипировке нового предмета в занятый slot старый предмет автоматически
  заменяется;
- XP-множитель применяется только от предметов, присутствующих в
  `equipped_items`.

Use case `equipItem` обязан до записи:

1. загрузить `UserInventoryItem` по `profileId` и `userInventoryItemId`;
2. загрузить связанный `InventoryItem`, чтобы получить slot базового предмета;
3. загрузить активного маскота через `MascotRepository.getActiveMascot`;
4. загрузить слоты маскота через `MascotRepository.findSlots`;
5. проверить, что requested slot существует у активного маскота;
6. проверить, что requested slot совпадает со slot базового предмета;
7. только после этого вызвать `InventoryRepository.equip`.

## 9. Правила XP и уровней

Базовый XP:

```txt
tiny   = 50
small  = 100
medium = 200
large  = 350
```

Модификатор приоритета:

```txt
low    = 0
normal = 0
high   = +50
```

Task multiplier роллится при выполнении задачи в MVP-1:

```txt
1.00 = 70%
1.25 = 20%
1.50 = 8%
2.00 = 2%
```

Equipment XP multiplier считается как произведение XP-множителей надетых
предметов:

```txt
equipmentXpMultiplier = product(equippedItem.stats.xpMultiplier)
```

Предмет, выпавший после выполнения текущей задачи, не влияет на XP этой же
задачи. Он может примениться только к будущим задачам после экипировки.

В MVP-0 множителей еще нет:

```txt
taskMultiplier = 1
equipmentXpMultiplier = 1
finalXp = baseXp
```

Чтобы множители не разгоняли баланс бесконечно, итоговый множитель экипировки
ограничивается:

```txt
equipmentXpMultiplier = clamp(equipmentXpMultiplier, 1.0, 2.0)
```

Итоговый XP за задачу:

```txt
baseXp = complexityXp + priorityBonus
finalXp = round(baseXp * taskMultiplier * equipmentXpMultiplier)
```

Пример:

```txt
baseXp = 200
taskMultiplier = 1.5
equipmentXpMultiplier = 1.1
finalXp = round(200 * 1.5 * 1.1) = 330
```

Уровни линейные:

```txt
XP_PER_LEVEL = 1000
level = floor(xpTotal / XP_PER_LEVEL) + 1
```

За просроченную задачу XP не режется в MVP. Цель - не наказывать пользователя за
возвращение в приложение.

Важно: выполнение одной и той же задачи не должно начислять XP повторно. Если
задача уже `completed`, повторный вызов `completeTask` должен быть идемпотентным
или возвращать доменную ошибку.

## 10. Правила наград и выпадения MVP-1

### Level rewards

Предмет выдается на каждом уровне, кратном 5:

```txt
level % 5 === 0
```

Но выдача проверяется через `level_rewards`.

Алгоритм:

```txt
for each reachedLevel between oldLevel+1 and newLevel:
  if reachedLevel % 5 === 0:
    if no levelReward(profileId, reachedLevel):
      item = generateInventoryItem(source = "level")
      grant item
      create levelReward(profileId, reachedLevel, item.userInventoryItemId)
```

Так пользователь не получит повторную награду за один и тот же уровень.

### Task drop

После выполнения задачи в MVP-1 может выпасть предмет. Drop считается после
расчета `finalXp`, потому что задача с большим XP должна иметь более высокий
шанс награды.

Константы для стартового баланса:

```txt
DROP_XP_UNIT = 300
DROP_DIFFICULTY = 1.25
DROP_MULTIPLIER_MIN = 0.5
DROP_MULTIPLIER_MAX = 2.5
```

Множитель выпадения от XP:

```txt
dropMultiplier = clamp(finalXp / DROP_XP_UNIT, DROP_MULTIPLIER_MIN, DROP_MULTIPLIER_MAX)
```

Базовые cumulative drop thresholds редкости:

```txt
common    = 0.22
rare      = 0.07
epic      = 0.02
legendary = 0.004
```

Эффективные thresholds:

```txt
effectiveThreshold[rarity] =
  min(baseThreshold[rarity] * dropMultiplier / DROP_DIFFICULTY, cap[rarity])
```

Caps:

```txt
common    = 0.45
rare      = 0.18
epic      = 0.06
legendary = 0.015
```

Выбор редкости:

```txt
roll = randomFloat(0, 1)

for rarity in [legendary, epic, rare, common]:
  if roll <= effectiveThreshold[rarity]:
    droppedRarity = rarity
    break

if no rarity matched:
  no item dropped
```

Так выбирается самая редкая подходящая редкость. Для обычных задач шанс
достаточно заметный, чтобы поддерживать интерес, но caps не дают предметам
сыпаться слишком часто.

После выбора редкости:

```txt
baseItem = pickRandomBaseItem(slot-compatible, droppedRarity)
stats = rollItemStats(droppedRarity)
grant generated user inventory item
create full taskRewardRoll audit record
```

Полная запись должна содержать все поля аудита:

```txt
create taskRewardRoll({
  taskId,
  profileId,
  baseXp,
  taskMultiplier,
  equipmentXpMultiplier,
  finalXp,
  dropMultiplier,
  roll,
  droppedRarity,
  userInventoryItemId,
  createdAt
})
```

Если предмет не выпал, `taskRewardRoll` все равно сохраняется с
`droppedRarity = null`. Это запрещает повторный roll для той же задачи.

## 11. SQLite схема

MVP-0 таблицы:

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE profile (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE progression (
  profile_id TEXT PRIMARY KEY,
  level INTEGER NOT NULL CHECK (level >= 1),
  xp_total INTEGER NOT NULL CHECK (xp_total >= 0),
  updated_at TEXT NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE CASCADE
);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'archived')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high')),
  complexity TEXT NOT NULL CHECK (complexity IN ('tiny', 'small', 'medium', 'large')),
  complexity_source TEXT NOT NULL CHECK (complexity_source IN ('suggested', 'manual')),
  due_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  archived_at TEXT,
  FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_tasks_profile_id ON tasks(profile_id, id);
CREATE INDEX idx_tasks_profile_status_due_at ON tasks(profile_id, status, due_at);
CREATE INDEX idx_tasks_profile_created_at ON tasks(profile_id, created_at);
```

MVP-1 таблицы:

```sql
CREATE TABLE mascot (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image_key TEXT NOT NULL
);

CREATE TABLE profile_mascot (
  profile_id TEXT PRIMARY KEY,
  mascot_id TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE CASCADE,
  FOREIGN KEY (mascot_id) REFERENCES mascot(id) ON DELETE CASCADE
);

CREATE TABLE mascot_slots (
  mascot_id TEXT NOT NULL,
  slot TEXT NOT NULL,
  title TEXT NOT NULL,
  anchor_json TEXT NOT NULL,
  PRIMARY KEY (mascot_id, slot),
  FOREIGN KEY (mascot_id) REFERENCES mascot(id) ON DELETE CASCADE
);

CREATE TABLE inventory_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  slot TEXT NOT NULL,
  image_key TEXT NOT NULL
);

CREATE TABLE user_inventory_items (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  base_item_id TEXT NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  xp_multiplier REAL NOT NULL CHECK (xp_multiplier >= 1.0 AND xp_multiplier <= 1.45),
  source TEXT NOT NULL CHECK (source IN ('level', 'task-drop')),
  source_task_id TEXT,
  source_level INTEGER,
  acquired_at TEXT NOT NULL,
  CHECK (source_level IS NULL OR source_level >= 1),
  CHECK (
    (source = 'level' AND source_level IS NOT NULL AND source_task_id IS NULL)
    OR
    (source = 'task-drop' AND source_task_id IS NOT NULL AND source_level IS NULL)
  ),
  FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE CASCADE,
  FOREIGN KEY (base_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
  FOREIGN KEY (source_task_id) REFERENCES tasks(id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX idx_user_inventory_profile_id ON user_inventory_items(profile_id, id);

CREATE TABLE equipped_items (
  profile_id TEXT NOT NULL,
  slot TEXT NOT NULL,
  user_inventory_item_id TEXT NOT NULL,
  equipped_at TEXT NOT NULL,
  PRIMARY KEY (profile_id, slot),
  FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE CASCADE,
  FOREIGN KEY (profile_id, user_inventory_item_id) REFERENCES user_inventory_items(profile_id, id) ON DELETE CASCADE
);

CREATE TABLE level_rewards (
  profile_id TEXT NOT NULL,
  level INTEGER NOT NULL CHECK (level >= 1),
  user_inventory_item_id TEXT NOT NULL,
  granted_at TEXT NOT NULL,
  PRIMARY KEY (profile_id, level),
  FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE CASCADE,
  FOREIGN KEY (profile_id, user_inventory_item_id) REFERENCES user_inventory_items(profile_id, id) ON DELETE CASCADE
);

CREATE TABLE task_reward_rolls (
  task_id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  base_xp INTEGER NOT NULL CHECK (base_xp >= 0),
  task_multiplier REAL NOT NULL CHECK (task_multiplier >= 1.0),
  equipment_xp_multiplier REAL NOT NULL CHECK (equipment_xp_multiplier >= 1.0),
  final_xp INTEGER NOT NULL CHECK (final_xp >= 0),
  drop_multiplier REAL NOT NULL CHECK (drop_multiplier >= 0),
  roll REAL NOT NULL CHECK (roll >= 0 AND roll < 1),
  dropped_rarity TEXT CHECK (dropped_rarity IN ('common', 'rare', 'epic', 'legendary')),
  user_inventory_item_id TEXT,
  created_at TEXT NOT NULL,
  CHECK (
    (dropped_rarity IS NULL AND user_inventory_item_id IS NULL)
    OR
    (dropped_rarity IS NOT NULL AND user_inventory_item_id IS NOT NULL)
  ),
  FOREIGN KEY (profile_id, task_id) REFERENCES tasks(profile_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE CASCADE,
  FOREIGN KEY (user_inventory_item_id) REFERENCES user_inventory_items(id) ON DELETE RESTRICT
);
```

Same-profile ownership rules:

- `equip` должен проверять, что `userInventoryItemId` принадлежит `profileId`;
- `createLevelReward` защищен composite FK `(profile_id, user_inventory_item_id)`;
- `createTaskRewardRoll` должен проверять, что `taskId` принадлежит `profileId`;
- если `userInventoryItemId` в `task_reward_rolls` не `null`, repository должен
  проверить, что предмет принадлежит тому же `profileId`;
- если `userInventoryItemId` в `task_reward_rolls` не `null`, repository должен
  загрузить предмет и проверить, что `item.rarity === droppedRarity`;
- если `source_task_id` в `user_inventory_items` не `null`, repository должен
  проверить, что задача принадлежит тому же `profileId`.

Для optional-ссылок на предмет/задачу часть same-profile проверок оставлена в
repository layer: nullable optional-ссылка плохо сочетается с composite FK и
обязательным `profile_id`.
Физическое удаление задач или предметов, участвующих в reward audit, запрещено:
для таких связей используется `ON DELETE RESTRICT`, а пользовательский flow
остается через архивирование.

MVP-2 таблицы:

```sql
ALTER TABLE tasks ADD COLUMN reminder_at TEXT;
ALTER TABLE tasks ADD COLUMN reminder_enabled INTEGER NOT NULL DEFAULT 0 CHECK (reminder_enabled IN (0, 1));
ALTER TABLE tasks ADD COLUMN reminder_notification_id INTEGER;

CREATE TABLE visual_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## 12. Migration runner contract

Миграции выполняются только через единый migration runner.

Правила:

1. При каждом открытии SQLite connection выполнить `PRAGMA foreign_keys = ON`.
2. Создать `schema_migrations`, если таблицы еще нет.
3. Прочитать примененные версии.
4. Взять локальные миграции, отсортированные по `version`.
5. Для каждой непримененной миграции открыть transaction.
6. Выполнить все SQL statements миграции.
7. Вставить запись в `schema_migrations` только после успешного выполнения SQL.
8. Сделать commit.
9. При ошибке сделать rollback и остановить bootstrap.

Ограничения:

- примененные миграции нельзя редактировать задним числом;
- версии миграций уникальны и монотонно растут;
- пропущенные версии допустимы технически, но нежелательны;
- миграция считается примененной только при наличии записи в
  `schema_migrations`;
- smoke-test миграций из пустой БД обязателен для MVP-0.

## 13. Repository contracts

### UnitOfWorkPort

```ts
export type UnitOfWorkContext = {
  taskRepository: TaskRepository
  profileRepository: ProfileRepository
  progressionRepository: ProgressionRepository
  inventoryRepository?: InventoryRepository
  mascotRepository?: MascotRepository
  settingsRepository?: SettingsRepository
  visualStateRepository?: VisualStateRepository
}

export type UnitOfWorkPort = {
  run<T>(operation: (ctx: UnitOfWorkContext) => Promise<T>): Promise<T>
}
```

В SQLite-реализации `run` открывает transaction и передает в callback
transaction-bound repositories. Все записи внутри callback должны выполняться
через repositories из `ctx`, а не через обычные repositories из
`AppDependencies`.

Memory-реализация может просто выполнить callback с memory repositories, но
интерфейс остается тем же.

Use cases с несколькими изменениями состояния должны выполняться через
`UnitOfWorkPort`:

- `completeTask`;
- `grantTaskXp`;
- `applyLevelProgress`;
- `grantLevelRewards`;
- `rollInventoryDrop`;
- `equipItem`, если меняется несколько записей.

Nested transactions запрещены. Если use case вызывается внутри другого
transactional use case, он должен принимать существующий `UnitOfWorkContext`, а
не запускать новый `unitOfWork.run`.

Внешние side effects, например отмена локального уведомления, выполняются после
успешного commit. Если side effect падает, БД не откатывается задним числом.

### TaskRepository

```ts
export type FindVisibleTasksParams = {
  profileId: string
  completedLimit: number
}

export type TaskRepository = {
  findById(id: string): Promise<Task | null>
  findVisible(params: FindVisibleTasksParams): Promise<Task[]>
  create(task: Task): Promise<Task>
  update(task: Task): Promise<Task>
  archive(id: string, archivedAt: string): Promise<void>
}
```

`findVisible()` возвращает `active` и последние `completed`, но не возвращает
архив.

### ProfileRepository

```ts
export type ProfileRepository = {
  getDefault(): Promise<Profile | null>
  create(profile: Profile): Promise<Profile>
  save(profile: Profile): Promise<void>
}
```

`bootstrap-app` вызывает `getDefault()`. Если профиль отсутствует, use case
создает локальный профиль через `create(profile)`.

### ProgressionRepository

```ts
export type ProgressionRepository = {
  get(profileId: string): Promise<Progression>
  save(progression: Progression): Promise<void>
}
```

### InventoryRepository

MVP-1.

```ts
export type InventoryRepository = {
  findCatalog(): Promise<InventoryItem[]>
  findOwned(profileId: string): Promise<UserInventoryItem[]>
  findOwnedItem(profileId: string, userInventoryItemId: string): Promise<UserInventoryItem | null>
  findBaseItem(baseItemId: string): Promise<InventoryItem | null>
  grant(item: UserInventoryItem): Promise<UserInventoryItem>
  findEquipped(profileId: string): Promise<EquippedItem[]>
  equip(profileId: string, slot: InventorySlot, userInventoryItemId: string, equippedAt: string): Promise<void>
  unequip(profileId: string, slot: InventorySlot): Promise<void>
  findLevelReward(profileId: string, level: number): Promise<LevelReward | null>
  createLevelReward(reward: LevelReward): Promise<void>
  findTaskRewardRoll(taskId: string): Promise<TaskRewardRoll | null>
  createTaskRewardRoll(roll: TaskRewardRoll): Promise<void>
}
```

### MascotRepository

MVP-1.

```ts
export type MascotRepository = {
  getActiveMascot(profileId: string): Promise<Mascot>
  saveMascot(mascot: Mascot): Promise<void>
  findSlots(mascotId: string): Promise<MascotSlot[]>
  saveSlots(mascotId: string, slots: MascotSlot[]): Promise<void>
}
```

## 14. Локальные уведомления

MVP-2.

`NotificationPort`:

```ts
export type PendingTaskReminder = {
  taskId: string
  notificationId: number
}

export type NotificationPort = {
  requestPermissions(): Promise<boolean>
  scheduleTaskReminder(input: {
    taskId: string
    notificationId: number
    title: string
    reminderAt: string
  }): Promise<void>
  cancelTaskReminder(notificationId: number): Promise<void>
  listPendingTaskReminders(): Promise<PendingTaskReminder[]>
}
```

Use case решает, нужно ли уведомление. Infrastructure только выполняет.

Recovery rule для MVP-2:

1. На bootstrap получить pending reminders из `NotificationPort`.
2. Сверить их с задачами в БД.
3. Отменить уведомления для задач со статусом `completed` или `archived`.
4. Отменить уведомления для задач, у которых `reminder_enabled = 0`.
5. Пересоздать уведомления, если `reminder_at` в БД отличается от pending
   notification.

Это закрывает сценарий, где БД уже закоммичена, а cancel/schedule side effect
упал после commit.

## 15. Визуальная рандомизация

MVP-2.

Рандом не должен жить в компонентах.

Правильный поток:

```txt
page/app event -> visual use case -> visual store -> component props/classes
```

Правила:

- значение выбирается при событии, а не при каждом render;
- прошлое значение хранится в `visual_state`;
- layout не меняется;
- контрастность проверяется на уровне палитр;
- пользовательские настройки `reducedMotion` и `disableVisualRandomness`
  хранятся в settings.

## 16. Bootstrap flow

MVP-0 при запуске:

1. определить runtime: Android/Browser;
2. собрать dependency container;
3. если Android - открыть SQLite;
4. применить миграции;
5. создать профиль, если его нет;
6. создать progression, если нет;
7. загрузить профиль/progression/tasks;
8. показать главный экран.

MVP-1 добавляет:

1. создать/загрузить маскота;
2. заполнить каталог предметов, если пустой;
3. загрузить inventory/equipped/level rewards.

MVP-2 добавляет:

1. загрузить settings;
2. загрузить visual state;
3. выполнить notification reconciliation;
4. применить visual refresh для `app-enter`, если он не отключен.

Пока bootstrap не завершен, UI показывает компактное состояние загрузки.

## 17. Тестируемость

В первую очередь тестируются чистые use cases:

- расчет suggested complexity;
- ordered decision tree для suggested complexity;
- сортировка и группировка задач;
- расчет XP;
- линейный level progression с фиксированным `XP_PER_LEVEL`;
- идемпотентность complete task;
- transactional complete task через `UnitOfWorkContext`;
- создание задачи с/без дедлайна;
- архивация задачи;
- выдача награды за уровень без дублей;
- task multiplier roll;
- equipment XP multiplier;
- task drop roll без повторного reroll;
- генерация XP-множителя предмета по редкости;
- migration runner из пустой БД;
- controlled visual random без повторов.

UI-тесты нужны позже, после стабилизации основного flow.

## 18. Архитектурные запреты

Запрещено:

- импортировать SQLite в Vue-компоненты;
- писать `Math.random()` в компонентах;
- считать XP в store;
- хранить бизнес-правила в CSS/шаблонах;
- делать серверные зависимости обязательными для MVP;
- добавлять новую фичу без доменного правила;
- усложнять MVP-0 ради будущей синхронизации;
- реализовывать MVP-1/MVP-2 раньше рабочего task flow.
- использовать обычные repositories внутри `unitOfWork.run` вместо repositories
  из `UnitOfWorkContext`.

## 19. Открытые решения

Эти вопросы нужно закрыть перед кодом или в самом начале:

1. Финально подтвердить SQLite-плагин Capacitor.
2. Выбрать минимальную Android SDK/version.
3. Подтвердить формат ассетов маскота и предметов.
4. Решить, нужен ли web SQLite позже или memory repositories достаточно для
   browser dev.

Остальная архитектура уже может строиться вокруг решений выше.
