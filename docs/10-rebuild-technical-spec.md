# Техническое задание: Task Companion Rebuild

Версия: `0.1 draft`  
Статус: рабочий черновик для правок  
Цель документа: зафиксировать новое ТЗ для переписывания проекта с нуля, без
обязательной совместимости с текущей реализацией.

## 1. Краткое описание

Нужно разработать приложение для управления личными задачами с элементами
геймификации: опыт, уровни, профиль, маскот, предметы и награды за выполнение
задач.

Приложение должно быть проще перегруженных таск-менеджеров: пользователь
регистрируется, быстро создает задачи, видит актуальный список дел, закрывает
задачи и получает понятную обратную связь в виде прогресса.

Текущий код проекта не считается архитектурной основой. Его можно использовать
только как источник идей по предметной области, но новая реализация должна быть
спроектирована заново.

## 2. Главная цель

Создать рабочее приложение, в котором пользователь может:

- зарегистрироваться и войти в аккаунт;
- вести личный список задач;
- задавать дедлайны, приоритет и сложность задач;
- выполнять и архивировать задачи;
- получать опыт за выполнение;
- повышать уровень профиля;
- получать предметы как награды;
- видеть профиль, прогресс, маскота и инвентарь.

## 3. Дипломная аргументация

Проект должен демонстрировать не только UI task-manager, но и инженерные
решения:

- server-source-of-truth для пользовательского прогресса;
- транзакционное выполнение задач;
- идемпотентные награды;
- audit случайных событий;
- role-based admin API;
- data-driven visual state;
- мобильный Nuxt/Capacitor frontend;
- простой backend runtime.

В пояснительной записке нужно обосновать:

- почему XP, rewards и random выполняются на backend;
- почему PostgreSQL и транзакции подходят для защиты от повторного начисления;
- почему visual state хранится как данные;
- почему Pinia stores не являются источником бизнес-истины;
- какие компромиссы MVP осознанно отложены.

## 4. Обязательные требования

1. Авторизация обязательна.
2. База данных должна содержать не меньше 10 таблиц.
3. Пользовательские данные должны быть привязаны к конкретному пользователю.
4. Обычный пользователь не должен видеть или менять данные других пользователей.
5. Задачи не удаляются физически из основного пользовательского сценария, а
   архивируются.
6. Просрочка задачи не является отдельным статусом в базе, а вычисляется по
   дедлайну.
7. Опыт не должен начисляться повторно за одну и ту же выполненную задачу.
8. Награды за уровень и случайные награды за задачу должны быть идемпотентными.
9. Интерфейс должен быть адаптирован под мобильный экран.
10. Проект должен иметь понятное разделение frontend, backend, domain logic и
    database layer.

## 5. Целевая аудитория

Основные пользователи:

- студенты;
- молодые специалисты;
- пользователи, которым нужен простой личный список дел;
- пользователи, которым сложно поддерживать сложные системы планирования;
- люди, которым нужна мягкая мотивация через прогресс и визуальную обратную
  связь.

Приложение не является медицинским инструментом и не должно использовать
формулировки про диагностику, лечение или медицинские рекомендации.

## 6. Основные роли

### 6.1 Гость

Может:

- открыть экран входа;
- перейти к регистрации;
- создать аккаунт;
- войти в существующий аккаунт.

Не может:

- создавать задачи;
- смотреть профиль;
- использовать инвентарь.

### 6.2 Пользователь

Может:

- управлять своими задачами;
- смотреть личный профиль;
- получать опыт и уровни;
- получать и экипировать предметы;
- менять базовые настройки приложения;
- выходить из аккаунта.

### 6.3 Администратор

Админская часть может быть упрощенной, но роль полезна для дипломного проекта.

Может:

- смотреть список пользователей;
- смотреть базовую статистику;
- управлять каталогом предметов;
- включать и отключать предметы;
- смотреть журнал важных действий.

## 7. Функциональные модули

## 7.1 Авторизация и аккаунт

Функции:

- регистрация по email и паролю;
- вход по email и паролю;
- выход из аккаунта;
- хранение сессии;
- обновление сессии через refresh token или аналогичный механизм;
- защита приватных маршрутов;
- разграничение ролей `user` и `admin`;
- хэширование паролей на backend.

Минимальные поля регистрации:

- email;
- пароль;
- отображаемое имя.

Требования:

- пароль не хранится в открытом виде;
- email уникален;
- пользовательские API должны проверять текущего пользователя;
- admin API должны проверять роль администратора.

## 7.2 Профиль пользователя

Функции:

- просмотр имени пользователя;
- просмотр уровня;
- просмотр общего количества опыта;
- просмотр прогресса до следующего уровня;
- просмотр базовой статистики: создано задач, выполнено задач, архивировано
  задач;
- изменение отображаемого имени.

## 7.3 Задачи

Функции:

- создать задачу;
- посмотреть список задач;
- посмотреть детали задачи;
- отредактировать задачу;
- выполнить задачу;
- архивировать задачу;
- фильтровать задачи по статусу;
- сортировать задачи по дедлайну, приоритету и дате создания.

Поля задачи:

- название;
- описание;
- статус;
- приоритет;
- сложность;
- категория;
- дедлайн;
- дата создания;
- дата обновления;
- дата выполнения;
- дата архивации.

Статусы:

- `active`;
- `completed`;
- `archived`.

Просрочка:

- просроченной считается активная задача, у которой `deadline < now`;
- в базе не нужен статус `overdue`;
- просроченные задачи должны визуально выделяться и подниматься выше обычных.

## 7.4 Категории задач

Функции:

- пользователь может выбрать категорию задачи;
- система имеет набор категорий по умолчанию;
- в будущем пользователь сможет создавать свои категории.

Примеры категорий:

- общее;
- учеба;
- работа;
- здоровье;
- личное.

## 7.5 Опыт и уровни

Функции:

- за выполнение задачи начисляется опыт;
- количество опыта зависит от сложности и приоритета задачи;
- общий опыт хранится в профиле прогресса;
- уровень вычисляется по общему опыту;
- после повышения уровня может выдаваться награда;
- все расчеты XP выполняются на backend, клиент не отправляет итоговый XP.

Базовая модель XP:

```txt
tiny   = 50 XP
small  = 100 XP
medium = 200 XP
large  = 350 XP
high priority bonus = +50 XP
```

Уровень:

```txt
XP_PER_LEVEL = 1000
level = floor(xp_total / XP_PER_LEVEL) + 1
xp_in_current_level = xp_total % XP_PER_LEVEL
xp_to_next_level = XP_PER_LEVEL - xp_in_current_level
```

Требования:

- повторное выполнение уже выполненной задачи не начисляет опыт второй раз;
- начисление опыта и изменение задачи должны выполняться согласованно;
- история начислений должна быть проверяемой;
- за просрочку нет штрафов и отрицательного XP;
- `xp_total` не уменьшается в базовой версии.

## 7.6 Маскот

Функции:

- у пользователя есть визуальный маскот;
- маскот отображается в профиле;
- на маскота можно надевать предметы;
- внешний вид маскота может быть простым на первой версии.

Минимально достаточно одного базового маскота для всех пользователей.

## 7.7 Инвентарь и предметы

Функции:

- есть каталог предметов;
- пользователь может получать предметы;
- предметы попадают в инвентарь пользователя;
- предметы имеют редкость;
- предметы могут давать бонус к XP;
- пользователь может экипировать предметы в слоты маскота.

Редкости:

- `common`;
- `rare`;
- `epic`;
- `legendary`.

Слоты:

- голова;
- лицо;
- тело;
- рука;
- фон.

Слоты должны храниться как данные, а не быть зашитыми в компонент. Для каждого
слота нужен `anchor_json`, чтобы UI мог накладывать предмет поверх маскота без
переписывания layout.

На первой версии предметы дают только XP-множитель. Другие бонусы не нужны:
предметы не меняют шанс выпадения, сложность задач, дедлайны, серии или штрафы.

XP-множитель предмета генерируется при получении конкретного экземпляра предмета:

```txt
common    1.02 - 1.08
rare      1.08 - 1.16
epic      1.16 - 1.28
legendary 1.28 - 1.45
```

Надетые предметы влияют только на будущие задачи. Предмет, выпавший после
текущей задачи, не может увеличить XP этой же задачи.

## 7.8 Награды

Система наград является важной частью проекта и должна быть перенесена из
старых документов как продуктовая идея, но реализована заново.

Ключевое правило: клиент не роллит награды. Backend владеет XP, уровнем,
случайностью, выдачей предметов и audit-записями. Клиент только отправляет
действие пользователя и отображает результат.

Источники наград:

- награда за достижение уровня;
- случайная награда после выполнения задачи.

### 7.8.1 Task multiplier

При выполнении задачи backend роллит случайный множитель задачи:

```txt
1.00 = 70%
1.25 = 20%
1.50 = 8%
2.00 = 2%
```

Этот множитель делает выполнение задач менее сухим, но не ломает баланс.

### 7.8.2 Equipment XP multiplier

Множитель экипировки считается как произведение `xp_multiplier` всех надетых
предметов:

```txt
equipment_xp_multiplier = product(equipped_item.xp_multiplier)
equipment_xp_multiplier = clamp(equipment_xp_multiplier, 1.0, 2.0)
```

Итоговый XP:

```txt
base_xp = complexity_xp + priority_bonus
final_xp = round(base_xp * task_multiplier * equipment_xp_multiplier)
```

### 7.8.3 Level rewards

Предмет выдается на каждом уровне, кратном 5:

```txt
level % 5 === 0
```

Если пользователь перескочил сразу несколько уровней, backend должен проверить
каждый достигнутый уровень между старым и новым значением.

Алгоритм:

```txt
for each reached_level between old_level + 1 and new_level:
  if reached_level % 5 === 0:
    if no level_reward(user_id, reached_level):
      item = generate_user_inventory_item(source = "level")
      create level_reward(user_id, reached_level, item.id)
```

Идемпотентность обязательна: пара `user_id + level` уникальна.

### 7.8.4 Task drop

После выполнения задачи может выпасть предмет. Шанс зависит от `final_xp`, то
есть уже после task multiplier и множителей экипировки.

Стартовые константы баланса:

```txt
DROP_XP_UNIT = 300
DROP_DIFFICULTY = 1.25
DROP_MULTIPLIER_MIN = 0.5
DROP_MULTIPLIER_MAX = 2.5
```

Множитель выпадения:

```txt
drop_multiplier = clamp(final_xp / DROP_XP_UNIT, DROP_MULTIPLIER_MIN, DROP_MULTIPLIER_MAX)
```

Базовые cumulative thresholds:

```txt
common    = 0.22
rare      = 0.07
epic      = 0.02
legendary = 0.004
```

Caps:

```txt
common    = 0.45
rare      = 0.18
epic      = 0.06
legendary = 0.015
```

Effective threshold:

```txt
effective_threshold[rarity] =
  min(base_threshold[rarity] * drop_multiplier / DROP_DIFFICULTY, cap[rarity])
```

Выбор редкости идет от самой редкой к самой частой:

```txt
roll = random_float(0, 1)

for rarity in [legendary, epic, rare, common]:
  if roll <= effective_threshold[rarity]:
    dropped_rarity = rarity
    break

if no rarity matched:
  no item dropped
```

Если редкость выбрана, backend выбирает подходящий базовый предмет этой редкости,
создает конкретный `user_inventory_item`, роллит `xp_multiplier` по диапазону
редкости и возвращает payload для reward popup.

### 7.8.5 Reward audit

Результат roll сохраняется всегда, даже если предмет не выпал.

`task_reward_rolls` должен хранить:

- `task_id`;
- `user_id`;
- `base_xp`;
- `task_multiplier`;
- `equipment_xp_multiplier`;
- `final_xp`;
- `drop_multiplier`;
- `roll_value`;
- `dropped_rarity`;
- `user_inventory_item_id`;
- `created_at`.

Требования к наградам:

- награда за один и тот же уровень не должна выдаваться повторно;
- случайная награда за одну и ту же задачу не должна роллиться повторно;
- результат roll нужно сохранять в базе для аудита;
- если предмет не выпал, audit-запись все равно создается;
- если `dropped_rarity` не `null`, то `user_inventory_item_id` обязателен;
- если `dropped_rarity` равен `null`, то `user_inventory_item_id` тоже `null`;
- предмет в audit должен иметь ту же редкость, что и `dropped_rarity`;
- reward/drop/equip должны проверять ownership пользователя.

## 7.9 Напоминания

Функции можно оставить как расширение, но таблицы и модель можно заложить сразу.

Минимальный scope:

- пользователь может включить напоминание для задачи с дедлайном;
- напоминание имеет дату и время;
- выполненная или архивная задача не должна иметь активное напоминание.

## 7.10 Настройки

Функции:

- включение/отключение визуальных эффектов;
- включение/отключение напоминаний;
- настройка темы или акцентного цвета;
- настройка reduced motion.

## 7.11 Визуальная вариативность

Визуальная вариативность - отдельная система, а не случайные стили в компонентах.
Она нужна, чтобы приложение не ощущалось полностью одинаковым каждый день, но
не ломало привычный task flow.

Можно менять:

- оттенок фона;
- оттенок карточек;
- акцентный цвет;
- текст главной кнопки;
- заголовок списка задач;
- фон профиля;
- мелкие декоративные детали;
- текст спокойного level-up feedback;
- текст пустых состояний.

Нельзя менять:

- расположение главной кнопки;
- структуру карточки задачи;
- место списка задач;
- основной порядок действий;
- семантику цветов статусов;
- доступность и контрастность.

Правильный поток:

```txt
app/page event -> backend/use case -> visual_state -> frontend store -> component props/classes
```

События обновления visual state:

- `app-enter`;
- `page-enter`;
- `task-created`;
- `task-completed`;
- `level-up`;
- `manual-refresh`.

Требования:

- компоненты не вызывают `Math.random()`;
- прошлое значение хранится в `visual_state`;
- visual random можно отключить настройкой `disable_visual_randomness`;
- `reduced_motion` отключает лишние анимации;
- палитры должны проходить проверку контрастности;
- тексты должны быть на русском.

## 7.12 Админ-панель

Минимальные функции:

- вход администратора;
- список пользователей;
- список предметов;
- создание предмета;
- редактирование предмета;
- отключение предмета;
- просмотр простой статистики.

Админ-панель не должна быть главной частью проекта, но она хорошо объясняет
роль администратора и расширяет backend scope.

Ограничения admin RBAC:

- все admin mutations пишутся в `audit_logs`;
- admin не может случайно удалить или деактивировать последнего admin;
- создание новых admin-аккаунтов либо запрещено в MVP, либо выделено отдельным
  endpoint с audit;
- admin UI не должен давать ручное изменение `xp_total`, `level`, reward rolls
  и чужого inventory без отдельного явно описанного maintenance endpoint;
- audit logs не редактируются из UI.

## 8. Нефункциональные требования

## 8.1 Безопасность

- пароли хранятся только в виде хэша;
- сессии должны иметь срок действия;
- приватные API требуют авторизации;
- админские API требуют роли `admin`;
- пользовательские запросы фильтруются по `user_id`;
- backend не должен доверять `user_id`, пришедшему от клиента.
- refresh token хранится в БД только как hash;
- повторное использование отозванного refresh token считается security event;
- rate limit обязателен для `/auth/login`, `/auth/register`, `/auth/refresh`,
  admin mutations и upload;
- login/register не должны раскрывать лишние сведения о существовании email;
- structured audit не должен сохранять пароли, raw tokens и другие секреты.

## 8.2 Надежность данных

- база должна иметь внешние ключи;
- важные операции должны быть транзакционными;
- нельзя допускать повторное начисление XP;
- нельзя допускать повторную выдачу level reward;
- нельзя допускать повторный reward roll за задачу.
- concurrent complete одной задачи не должен создавать двойной XP/reward;
- операции complete/equip/archive должны быть идемпотентными или возвращать
  сохраненный результат без повторного side effect;
- mobile app может показывать последний успешно загруженный snapshot как
  read-only cache, но backend остается source of truth;
- при отсутствии соединения создание, выполнение, архивирование, экипировка и
  изменение настроек блокируются или показывают ошибку.

## 8.3 Интерфейс

- mobile-first;
- темная базовая тема;
- локальный плавный шрифт, без зависимости от Google Fonts CDN;
- весь пользовательский интерфейс на русском языке;
- главный экран должен сразу показывать задачи;
- создание задачи должно быть быстрым;
- обязательное поле задачи только `title`;
- пустые, загрузочные и ошибочные состояния обязательны;
- геймификация не должна мешать основному task flow;
- tap targets не меньше 44x44px;
- не должно быть горизонтального скролла на ширине 320px;
- нормальный диапазон мобильных экранов: 320-768px.

## 8.4 Производительность

- список задач должен нормально работать на сотнях задач пользователя;
- основные запросы должны иметь индексы;
- frontend не должен загружать чужие или лишние данные;
- большие админские списки должны иметь пагинацию.

## 8.5 Доступность

- все интерактивные иконки имеют accessible label на русском;
- reward feedback и ошибки действий объявляются через `aria-live` или status
  region;
- статусы задач и редкости предметов не различаются только цветом;
- focus state видим на admin-panel и mobile web runtime;
- все формы имеют label, ошибку и связь поля с ошибкой;
- `reduced_motion` отключает popup-анимации, parallax, shake, confetti и лишние
  transitions;
- контраст текста и важных controls не ниже WCAG AA;
- admin tables доступны с клавиатуры.

## 9. Обязательный технологический стек

### 9.1 Админ-панель

- Nuxt 4;
- Vue 3;
- TypeScript;
- Pinia;
- Tailwind CSS;
- SCSS;
- API client к backend;
- без React/Vite/Vuex.

### 9.2 Мобильное приложение

- Nuxt 4;
- Vue 3;
- TypeScript;
- Pinia;
- Capacitor;
- Tailwind CSS;
- SCSS;
- API client к backend;
- Android как основная mobile-платформа;
- без React/Vite/Vuex;
- без локального SQLite как source of truth.

### 9.3 Стили

Обязательно для admin-panel и mobile app:

- Tailwind CSS для utility layout и дизайн-системы;
- SCSS для сложных локальных стилей, миксинов и SFC styles;
- Vue SFC `v-bind()` в стилях можно использовать активно;
- visual state приходит из backend/store и применяется через CSS variables,
  классы или `v-bind()`;
- компоненты не выбирают случайные цвета сами.

### 9.4 Backend

Backend должен быть максимально простым.

Рекомендуемый вариант:

- Go single binary;
- PostgreSQL;
- обычный HTTP API;
- SQL migrations;
- typed SQL queries;
- JWT access token + refresh token rotation.

Почему Go-вариант предпочтителен:

- один бинарник проще показать и запускать;
- меньше framework-магии;
- backend явно владеет auth, XP, rewards, random roll и audit;
- проще обосновать транзакции и SQL constraints;
- меньше риск случайно смешать Nuxt server и основной API.

Допустимый fallback:

- Bun/Node;
- TypeScript;
- Hono;
- Drizzle;
- PostgreSQL.

Fallback выбирать только если скорость разработки на одном языке важнее
простоты backend runtime.

### 9.5 Testing

- unit-тесты доменной логики;
- API-тесты backend;
- e2e smoke-тесты ключевых сценариев;
- Playwright для UI smoke, если хватает времени.

Минимальная backend test matrix:

- auth register/login/refresh rotation/logout;
- refresh token reuse detection;
- ownership isolation for tasks/inventory/profile;
- task complete idempotency under repeated request;
- concurrent complete does not double-grant XP;
- level jump creates each missing level reward once;
- task no-drop still creates audit roll;
- equip validates ownership and slot;
- DB migrations apply from empty database;
- seed creates demo data;
- admin RBAC denies user role;
- upload rejects invalid type/size.

### 9.5.1 Dev and release workflow

После scaffold нужно зафиксировать:

- структуру репо: `backend`, `apps/admin`, `apps/mobile`,
  `shared/contracts`, если используется;
- `.env.example` для backend/admin/mobile;
- команду запуска PostgreSQL;
- команду миграций;
- команду seed demo data;
- backend test command;
- admin typecheck/build/test command;
- mobile typecheck/build/test command;
- Capacitor sync/build command для Android;
- smoke сценарий auth/task/reward.

Миграции применяются до запуска backend. Seed не должен запускаться
автоматически в production mode.

## 9.6 Рекомендованные библиотеки

### Frontend common

| Область | Библиотека | Где | Зачем |
|---|---|---|---|
| Nuxt integration | `nuxt`, `@pinia/nuxt` | admin, app | базовый frontend runtime + stores |
| Styles | `@nuxtjs/tailwindcss`, `sass` | admin, app | Tailwind + SCSS |
| API client | `ofetch` или `openapi-fetch` | admin, app | запросы к backend |
| Forms | `vee-validate` + `zod` | admin, app | формы, validation schema |
| Dates | `date-fns` | admin, app | форматирование дат |
| Icons | `lucide-vue-next` | admin, app | иконки действий/статусов |
| State cache | `pinia-plugin-persistedstate` | admin, app | аккуратный UI cache |
| Tests | `vitest`, `@vue/test-utils` | admin, app | unit/component tests |
| E2E | `playwright` | admin, app | smoke flow и screenshots |

Ограничение: persisted state не должен становиться источником правды для задач,
XP, наград или инвентаря. Секреты нельзя бездумно хранить в localStorage.

### Mobile app only

| Область | Библиотека | Зачем |
|---|---|---|
| Mobile shell | `@capacitor/core`, `@capacitor/android` | Android build |
| Local preferences | `@capacitor/preferences` | легкий cache настроек, не секреты |
| Notifications | `@capacitor/local-notifications` | локальные reminders |

### Admin only

| Область | Библиотека | Зачем |
|---|---|---|
| Charts | `vue-echarts` + `echarts` | графики статистики |
| Tables | нативные Vue-компоненты + Tailwind | списки users/items/logs |

Большой UI-kit не брать по умолчанию. Tailwind + локальные компоненты проще
контролировать визуально.

### Backend: рекомендуемый Go stack

| Область | Библиотека | Зачем |
|---|---|---|
| Router | `go-chi/chi` | простой routing и middleware |
| PostgreSQL | `pgx` | driver/pool |
| Typed SQL | `sqlc` | типизированные queries из SQL |
| Migrations | `goose` | SQL migrations |
| JWT | `golang-jwt/jwt/v5` | access tokens |
| Password hash | `golang.org/x/crypto/bcrypt` или argon2id | hash паролей |
| Sessions fallback | `alexedwards/scs` | cookie sessions, если понадобятся |
| Images | `disintegration/imaging` | простая обработка asset images |
| Tests | `testing`, `httptest`, `testcontainers-go` опционально | API/DB tests |

### Backend: допустимый TypeScript fallback

| Область | Библиотека | Зачем |
|---|---|---|
| HTTP | `Hono` | простой API |
| DB/ORM | `Drizzle` + `drizzle-kit` | typed schema/query/migrations |
| Auth | `Better Auth` или ручная JWT/session схема | быстрый старт auth |
| Images | `sharp` | resize/webp |
| Tests | `vitest` | API/domain tests |

### Не брать без отдельного решения

- GraphQL;
- Prisma для Go-варианта;
- Vuex;
- Moment.js;
- большие UI kits для mobile;
- Clerk/Auth0 и похожие auth SaaS, если нужно показать свою БД/auth;
- client-side reward random библиотеки;
- local SQLite как основной источник данных после обязательной авторизации.

## 9.7 Auth contract

Рекомендуемый auth flow:

- email/password registration;
- password hash на backend;
- short-lived access JWT;
- refresh token в БД;
- refresh token rotation;
- таблица sessions/refresh tokens;
- logout отзывает refresh token;
- `users.role` для `user/admin`;
- mobile app и admin-panel используют один backend auth contract.

Cookie sessions допустимы для admin-panel, но не должны усложнять mobile flow.
Если появляется два разных auth режима, это нужно явно зафиксировать в ТЗ.

Access token хранится только в памяти frontend runtime.

Refresh token:

- для mobile app хранится в защищенном storage Capacitor/платформы, если
  доступен; fallback должен быть явно описан;
- для admin-panel предпочтительно `httpOnly Secure SameSite` cookie или явно
  описанный Bearer-flow без localStorage для секретов;
- в БД хранится только hash refresh token.

Refresh flow:

1. backend проверяет hash refresh token;
2. проверяет `revoked_at` и `expires_at`;
3. отзывает старый token;
4. создает новый refresh token;
5. возвращает новую пару token/session.

Reuse detection:

- повторное использование уже отозванного refresh token считается security
  event;
- текущая session family отзывается;
- событие пишется в `audit_logs`;
- клиент получает `401` и переводит пользователя на вход.

Mobile session UX:

- при старте приложения выполняется bootstrap текущей сессии;
- если access token истек, frontend один раз пробует refresh;
- если refresh успешен, пользователь остается на текущем экране;
- во время refresh приватные запросы не должны массово падать в UI как server
  error;
- logout удаляет локальное состояние сессии и переводит на экран входа;
- повторный logout или уже отозванная сессия не должны ломать UI.

## 10. Архитектурный принцип

Рекомендуемая схема зависимостей:

```txt
UI
  -> Store
    -> Use Case / Service
      -> Repository Interface
        -> Repository Implementation
          -> Database / HTTP
```

Запреты:

- не писать SQL в компонентах;
- не считать XP в UI;
- не хранить бизнес-логику в Pinia store;
- не использовать `Math.random()` в UI для наград;
- не использовать `Math.random()` в UI для visual state;
- не доверять frontend при начислении опыта или выдаче предметов;
- не хранить authoritative domain data локально на клиенте, если выбран
  server-source-of-truth подход;
- не позволять клиенту передавать `final_xp`, `level`, `roll_value` или
  `user_id` для защищенных операций.

## 10.1 Frontend architecture

В Nuxt apps использовать:

- `middleware/auth` для приватных маршрутов;
- `middleware/admin` для admin-panel;
- `apiClient` на `ofetch` или `openapi-fetch`;
- DTO/domain types отдельно от Vue-компонентов;
- Pinia stores только для состояния, cache и вызова services;
- composables/services для API orchestration;
- единый mapper API errors -> UI messages;
- generated OpenAPI types или общий `shared/contracts` package после выбора
  структуры repo.

Компоненты не импортируют SQL, backend random constants, reward math или XP
formulas.

## 10.2 Frontend page contracts

Каждая страница должна иметь:

- список backend endpoint-ов, которые вызываются при входе;
- required data shape для render;
- loading/empty/error states;
- список actions и соответствующих API calls;
- правила обновления Pinia stores после успешного action;
- запрет на локальный пересчет XP, reward, level и visual random.

Bootstrap mobile app загружает:

- `/auth/me`;
- `/profile`;
- `/profile/progression`;
- `/settings`;
- `/visual-state`;
- активные задачи.

Главная страница не должна ждать inventory/admin data. Inventory page загружает
inventory и active mascot/equipment. Admin pages используют отдельные admin
stores и не переиспользуют user ownership assumptions.

## 11. База данных

Требование: не меньше 10 таблиц. Ниже предложена схема из 20 таблиц. Ее можно
сократить, но итоговая версия не должна иметь меньше 10 таблиц.

## 11.1 Таблицы

### 1. `users`

Аккаунты пользователей.

Поля:

- `id`;
- `email`;
- `password_hash`;
- `role`;
- `created_at`;
- `updated_at`.

### 2. `sessions`

Активные пользовательские сессии или refresh tokens.

Поля:

- `id`;
- `user_id`;
- `refresh_token_hash`;
- `expires_at`;
- `created_at`;
- `revoked_at`.

### 3. `profiles`

Публичная и пользовательская информация профиля.

Поля:

- `id`;
- `user_id`;
- `display_name`;
- `avatar_url`;
- `created_at`;
- `updated_at`.

### 4. `progressions`

Прогресс пользователя.

Поля:

- `id`;
- `user_id`;
- `xp_total`;
- `level`;
- `updated_at`.

### 5. `task_categories`

Категории задач.

Поля:

- `id`;
- `user_id`;
- `title`;
- `color`;
- `is_system`;
- `created_at`;
- `updated_at`.

### 6. `tasks`

Основная таблица задач.

Поля:

- `id`;
- `user_id`;
- `category_id`;
- `title`;
- `description`;
- `status`;
- `priority`;
- `complexity`;
- `deadline_at`;
- `completed_at`;
- `archived_at`;
- `created_at`;
- `updated_at`.

### 7. `task_xp_grants`

История начисления опыта за задачи.

Поля:

- `id`;
- `user_id`;
- `task_id`;
- `base_xp`;
- `task_multiplier`;
- `equipment_xp_multiplier`;
- `final_xp`;
- `created_at`.

Ограничение:

- уникальность `task_id`, чтобы XP не начислялся дважды.

### 8. `mascots`

Каталог маскотов.

Поля:

- `id`;
- `name`;
- `asset_url`;
- `is_default`;
- `active`;
- `created_at`;
- `updated_at`.

### 9. `user_mascots`

Связь пользователя с выбранным маскотом.

Поля:

- `id`;
- `user_id`;
- `mascot_id`;
- `is_active`;
- `created_at`;
- `updated_at`.

### 10. `mascot_slots`

Слоты экипировки маскота.

Поля:

- `id`;
- `mascot_id`;
- `slot_key`;
- `title`;
- `anchor_json`;
- `created_at`;
- `updated_at`.

### 11. `inventory_items`

Каталог предметов.

Поля:

- `id`;
- `name`;
- `description`;
- `rarity`;
- `slot_key`;
- `asset_url`;
- `base_xp_multiplier`;
- `active`;
- `created_at`;
- `updated_at`.

### 12. `user_inventory_items`

Предметы, полученные конкретным пользователем.

Поля:

- `id`;
- `user_id`;
- `inventory_item_id`;
- `source`;
- `source_task_id`;
- `source_level`;
- `xp_multiplier`;
- `acquired_at`.

### 13. `equipped_items`

Экипированные предметы пользователя.

Поля:

- `id`;
- `user_id`;
- `user_inventory_item_id`;
- `slot_key`;
- `equipped_at`.

Ограничение:

- один активный предмет на один слот пользователя.

### 14. `level_rewards`

Факт выдачи награды за уровень.

Поля:

- `id`;
- `user_id`;
- `level`;
- `user_inventory_item_id`;
- `created_at`.

Ограничение:

- уникальность пары `user_id + level`.

### 15. `task_reward_rolls`

Аудит случайной награды после выполнения задачи.

Поля:

- `id`;
- `user_id`;
- `task_id`;
- `base_xp`;
- `task_multiplier`;
- `equipment_xp_multiplier`;
- `final_xp`;
- `drop_multiplier`;
- `roll_value`;
- `dropped_rarity`;
- `user_inventory_item_id`;
- `created_at`.

Ограничение:

- уникальность `task_id`;
- `roll_value >= 0 AND roll_value < 1`;
- `dropped_rarity` и `user_inventory_item_id` либо оба заполнены, либо оба
  пустые.

### 16. `notification_settings`

Настройки уведомлений пользователя.

Поля:

- `id`;
- `user_id`;
- `enabled`;
- `default_minutes_before_deadline`;
- `created_at`;
- `updated_at`.

### 17. `task_reminders`

Напоминания по задачам.

Поля:

- `id`;
- `user_id`;
- `task_id`;
- `remind_at`;
- `status`;
- `created_at`;
- `updated_at`.

### 18. `audit_logs`

Журнал важных backend-событий.

Поля:

- `id`;
- `user_id`;
- `action`;
- `details_json`;
- `ip_address`;
- `created_at`.

### 19. `visual_state`

Сохраненное состояние контролируемой визуальной вариативности.

Поля:

- `id`;
- `user_id`;
- `scope`;
- `key`;
- `value`;
- `updated_at`.

Примеры ключей:

- `accent_color`;
- `background_variant`;
- `task_button_text`;
- `task_list_heading`;
- `profile_background`.

### 20. `settings`

Пользовательские настройки.

Поля:

- `id`;
- `user_id`;
- `key`;
- `value`;
- `updated_at`.

Обязательные ключи:

- `reduced_motion`;
- `disable_visual_randomness`;
- `notifications_enabled`;
- `default_reminder_minutes_before_deadline`.

## 11.2 Минимальные связи

- `profiles.user_id -> users.id`;
- `sessions.user_id -> users.id`;
- `progressions.user_id -> users.id`;
- `tasks.user_id -> users.id`;
- `tasks.category_id -> task_categories.id`;
- `task_xp_grants.task_id -> tasks.id`;
- `user_inventory_items.user_id -> users.id`;
- `user_inventory_items.inventory_item_id -> inventory_items.id`;
- `equipped_items.user_inventory_item_id -> user_inventory_items.id`;
- `level_rewards.user_inventory_item_id -> user_inventory_items.id`;
- `task_reward_rolls.task_id -> tasks.id`;
- `task_reminders.task_id -> tasks.id`;
- `visual_state.user_id -> users.id`;
- `settings.user_id -> users.id`.

## 11.3 Constraints and indexes

Все таблицы должны иметь явные `NOT NULL` для обязательных полей, внешние ключи
и индексы под основные запросы.

Обязательные `CHECK` / `UNIQUE` constraints:

- `users.email` unique, normalized lower-case;
- `users.role IN ('user', 'admin')`;
- `tasks.status IN ('active', 'completed', 'archived')`;
- `tasks.priority IN ('low', 'normal', 'high')`;
- `tasks.complexity IN ('tiny', 'small', 'medium', 'large')`;
- `progressions.xp_total >= 0`;
- `progressions.level >= 1`;
- `inventory_items.rarity IN ('common', 'rare', 'epic', 'legendary')`;
- `user_inventory_items.xp_multiplier` в разрешенном диапазоне редкости;
- `task_reward_rolls.roll_value >= 0 AND roll_value < 1`;
- `task_reward_rolls.task_id UNIQUE`;
- `task_xp_grants.task_id UNIQUE`;
- `level_rewards(user_id, level) UNIQUE`;
- `equipped_items(user_id, slot_key) UNIQUE`.

Где FK не может выразить совпадение владельца, backend use case обязан проверить
ownership в транзакции.

## 11.4 Migrations and seed

SQL migrations обязательны и применяются командой backend.

Seed data обязательны для demo/dev:

- один admin user;
- базовые task categories;
- default mascot;
- mascot slots с `anchor_json`;
- набор inventory items по всем rarity;
- default settings keys;
- базовые visual palettes.

Seed не должен перетирать пользовательские данные и не запускается автоматически
в production mode.

## 12. Основные пользовательские сценарии

## 12.1 Регистрация

1. Пользователь открывает приложение.
2. Нажимает регистрацию.
3. Вводит email, пароль и имя.
4. Backend создает пользователя, профиль и начальный progression.
5. Пользователь попадает на главный экран.

## 12.2 Вход

1. Пользователь вводит email и пароль.
2. Backend проверяет пароль.
3. Backend выдает сессию.
4. Frontend сохраняет состояние входа.
5. Пользователь попадает на главный экран.

## 12.3 Создание задачи

1. Пользователь нажимает основную кнопку создания.
2. Вводит название.
3. При желании выбирает категорию, дедлайн, приоритет и сложность.
4. Сохраняет задачу.
5. Задача появляется в списке активных.

## 12.4 Выполнение задачи

1. Пользователь отмечает задачу выполненной.
2. Backend проверяет владельца задачи.
3. Backend меняет статус задачи на `completed`.
4. Backend рассчитывает `base_xp`.
5. Backend роллит `task_multiplier`.
6. Backend считает `equipment_xp_multiplier`.
7. Backend начисляет `final_xp`, если XP за эту задачу еще не начислялся.
8. Backend обновляет progression.
9. Backend проверяет level rewards.
10. Backend выполняет reward roll за задачу.
11. Backend сохраняет full audit, даже если предмет не выпал.
12. Frontend показывает обновленный прогресс и reward popup, если backend
    вернул предмет.

`POST /tasks/:id/complete` является идемпотентным.

Если задача уже `completed` и для нее есть `task_xp_grants` /
`task_reward_rolls`, backend возвращает сохраненный результат без нового XP,
level reward или random roll.

Completion выполняется одной транзакцией:

1. lock task row;
2. проверить ownership;
3. если уже completed, вернуть persisted completion payload;
4. обновить задачу;
5. создать `task_xp_grants`;
6. обновить `progressions`;
7. создать недостающие `level_rewards`;
8. создать ровно один `task_reward_rolls`;
9. создать audit logs.

## 12.5 Архивация задачи

1. Пользователь нажимает архивировать.
2. Backend проверяет владельца задачи.
3. Задача получает статус `archived`.
4. Задача исчезает из основного списка.

## 12.6 Экипировка предмета

1. Пользователь открывает инвентарь.
2. Выбирает предмет.
3. Backend проверяет, что предмет принадлежит пользователю.
4. Backend проверяет совместимость слота.
5. Backend снимает предыдущий предмет из этого слота, если он есть.
6. Backend экипирует выбранный предмет.

## 12.7 Visual refresh

1. Пользователь открывает приложение или выполняет значимое действие.
2. Frontend отправляет событие visual refresh или получает visual state при
   bootstrap.
3. Backend проверяет настройки пользователя.
4. Если `disable_visual_randomness = true`, backend возвращает последнее
   сохраненное состояние без reroll.
5. Если visual random разрешен, backend выбирает допустимые варианты цвета,
   текста и фона.
6. Backend сохраняет `visual_state`.
7. Frontend применяет классы и тексты без локальной случайности.

## 13. API в общих чертах

Backend обязан иметь OpenAPI 3.1 спецификацию для всех публичных и admin
endpoints.

Спецификация фиксирует:

- request/response schemas;
- auth scheme;
- status codes;
- единый error format;
- pagination/filter/sort параметры;
- validation errors;
- idempotent response для complete/archive/equip;
- admin endpoints и required role.

Единый error format:

```txt
{
  code: string,
  message: string,
  field_errors?: Record<string, string>,
  request_id?: string
}
```

Все datetime поля возвращаются в ISO 8601 UTC. Все enum поля возвращаются
строками из зафиксированных enum lists. List endpoints принимают `limit`,
`cursor` или `page`, `sort`, `filter`.

Auth:

- `POST /auth/register`;
- `POST /auth/login`;
- `POST /auth/logout`;
- `POST /auth/refresh`;
- `GET /auth/me`.

Tasks:

- `GET /tasks`;
- `POST /tasks`;
- `GET /tasks/:id`;
- `PATCH /tasks/:id`;
- `POST /tasks/:id/complete`;
- `POST /tasks/:id/archive`.

Profile:

- `GET /profile`;
- `PATCH /profile`;
- `GET /profile/progression`;

Inventory:

- `GET /inventory`;
- `POST /inventory/:userInventoryItemId/equip`;
- `POST /inventory/:userInventoryItemId/unequip`;

Visual/settings:

- `GET /settings`;
- `PATCH /settings`;
- `GET /visual-state`;
- `POST /visual-state/refresh`;

Admin:

- `GET /admin/users`;
- `GET /admin/items`;
- `POST /admin/items`;
- `PATCH /admin/items/:id`;
- `POST /admin/items/:id/disable`;
- `POST /admin/items/:id/assets`;
- `GET /admin/stats`;
- `GET /admin/logs`.

### 13.1 Completion payload

`POST /tasks/:id/complete` возвращает authoritative result:

- `task`;
- `xp_grant`: `base_xp`, `task_multiplier`, `equipment_xp_multiplier`,
  `final_xp`;
- `progression_before`;
- `progression_after`;
- `level_ups[]`;
- `level_rewards[]`;
- `task_drop`: `dropped`, `item`, `rarity`;
- `visual_state`, если completion обновил visual state.

Клиент не получает `roll_value`.

### 13.2 Asset upload

Asset upload принимает только allowlist типов:

- `png`;
- `jpg/jpeg`;
- `webp`.

Требования:

- максимальный размер файла: 2 MB;
- backend генерирует безопасное имя файла и не использует имя клиента как path;
- изображения нормализуются, resize/webp выполняется при необходимости;
- `asset_url` хранится в БД;
- замена asset не должна ломать уже выданные предметы;
- ошибки upload возвращаются в едином API error format.

### 13.3 Observability and audit

Backend ведет structured logs с `request_id`.

Audit logs обязательны для:

- login failure threshold;
- refresh token reuse;
- logout;
- task completion;
- reward roll;
- level reward;
- equip/unequip;
- admin item mutation;
- asset upload;
- admin login;
- admin role failure.

## 14. Постраничное описание UI/UX

UI должен быть mobile-first, темный, русский, с приоритетом task flow.
Геймификация видна как поддерживающий слой: прогресс, маскот, награды и
инвентарь не должны перекрывать быстрый просмотр и выполнение задач.

## 14.1 Mobile app: header и navigation

### Верхняя панель главного экрана

Header главной страницы должен быть компактным.

Состав:

- слева: короткое приветствие или имя пользователя, например `Привет, Анна`;
- рядом или ниже: текущий уровень и XP progress, например
  `Ур. 4 · 620/1000 XP`;
- справа: компактная иконка профиля или маскота;
- справа дополнительная иконка настроек допустима, но не должна вытеснять
  профиль.

Запрещено:

- длинный hero-блок;
- рекламные тексты;
- крупная декоративная шапка, которая вытесняет задачи;
- header, занимающий большую часть первого экрана.

На главной без скролла должны быть видны:

- header с уровнем и XP;
- заголовок списка из `visual_state.task_list_heading`;
- быстрый CTA создания задачи с текстом из `visual_state.task_button_text`;
- первые активные задачи;
- состояние просрочки, если есть просроченные задачи.

### Bottom navigation

Нижняя навигация мобильного приложения:

- `Задачи`;
- `Инвентарь`;
- `Профиль`;
- `Настройки`.

Правила:

- активная вкладка выделяется accent color из `visual_state`;
- bottom nav фиксирован снизу;
- tap target каждого пункта не меньше 44x44px;
- кнопка создания задачи не перекрывает последний элемент списка;
- на ширине 320px подписи можно сокращать, но смысл должен оставаться понятным.

Не добавлять в bottom nav:

- `Награды`;
- `Магазин`;
- `Календарь`;
- `Админка`;
- `Audit`.

Reward показывается как popup или compact feedback после действия, а не как
отдельный основной раздел.

### Mobile runtime constraints

Mobile app должна учитывать Android safe areas:

- fixed bottom nav использует padding-bottom с safe-area inset;
- контент не скрывается под bottom nav;
- формы не ломаются при открытой клавиатуре;
- status bar/navigation bar не создают белых зон;
- reward popup помещается на маленькой высоте экрана и имеет scroll при
  необходимости;
- основной task list остается доступен на 320px width и small-height devices.

## 14.2 Mobile app: страницы

### Auth gate

Стартовая системная страница проверяет текущую сессию.

Состояния:

- initial loading после открытия приложения;
- valid session -> переход на `Задачи`;
- no session -> переход на `Вход`;
- expired session -> текст `Сессия истекла. Войдите снова.`.

### Вход

Состав:

- поле email;
- поле пароль;
- кнопка `Войти`;
- ссылка `Создать аккаунт`.

Состояния:

- loading на кнопке: `Входим...`;
- ошибка: `Не удалось войти. Проверьте email и пароль.`;
- disabled submit во время запроса.

### Регистрация

Состав:

- поле email;
- поле пароль;
- поле отображаемое имя;
- кнопка `Создать аккаунт`;
- ссылка `Уже есть аккаунт? Войти`;
- подсказка, что имя можно изменить позже.

Состояния:

- ошибка занятого email;
- ошибка слабого/некорректного пароля;
- disabled submit во время запроса.

### First-run / onboarding

После регистрации пользователь должен попасть в короткий first-run flow или
мягкое пустое состояние.

Нужно объяснить:

- приложение является task-manager с прогрессом;
- XP и награды начисляются только после выполнения задач;
- награды и visual state считаются backend;
- первую задачу можно создать только по названию.

Onboarding не должен быть длиннее 2-3 экранов и не должен блокировать основной
сценарий. Пользователь может пропустить его и сразу перейти к задачам.

### Главная / Задачи

Состав:

- header с именем, уровнем и XP progress;
- заголовок списка из `visual_state`;
- CTA создания задачи из `visual_state`;
- список активных задач;
- фильтры `Активные`, `Выполненные`, `Архив`;
- сортировка по дедлайну, приоритету и дате создания.

Карточка задачи:

- title;
- категория;
- дедлайн;
- приоритет;
- сложность;
- статус просрочки;
- действие `Выполнить`;
- переход в детали;
- архивирование через меню или детали.

Правила:

- просроченные активные задачи показываются выше обычных;
- completed задачи не должны визуально спорить с active задачами;
- архивные задачи не показываются в активном списке;
- физического удаления в основном пользовательском flow нет.

### Создание / редактирование задачи

Обязательное поле:

- `Название`.

Необязательные поля:

- описание;
- категория;
- дедлайн;
- приоритет;
- сложность;
- напоминание.

Действия:

- `Сохранить`;
- `Отмена`.

Правила:

- пользователь может ввести только название и сохранить;
- title focused automatically при открытии формы;
- default priority = `normal`;
- default complexity = `medium`;
- категория по умолчанию = `общее`;
- дедлайн необязателен;
- после сохранения пользователь возвращается к списку задач;
- новая задача появляется без полной перезагрузки страницы, но подтверждается
  ответом backend;
- validation microcopy: `Название задачи обязательно`;
- форма не должна выглядеть как длинная анкета.

### Детали задачи

Состав:

- полная информация о задаче;
- статус;
- дедлайн;
- категория;
- приоритет;
- сложность;
- timestamps.

Действия:

- `Выполнить`;
- `Редактировать`;
- `Архивировать`.

Если задача completed:

- показать начисленный XP;
- дату выполнения;
- полученную награду или факт no-drop без `roll_value`;
- не показывать основную кнопку выполнения.

Если задача archived:

- показать дату архивации;
- не показывать основную кнопку выполнения.

### Reward popup / feedback

Появляется только после ответа backend на `complete task`.

Показывает:

- `+N XP`;
- новый уровень, если был level-up;
- task multiplier в человекочитаемом виде;
- если предмет выпал: название, редкость, слот, XP-множитель;
- кнопки `В инвентарь` и `Закрыть`.

Если предмет не выпал:

- не показывать тяжелый popup;
- достаточно compact feedback, например `+120 XP · награда не выпала`.

UI должен различать:

- обычное выполнение: `+N XP`;
- выполнение с task multiplier: `+N XP · множитель x1.25`;
- level-up: `Новый уровень: X`;
- level reward: отдельный блок `Награда за уровень`;
- task drop: отдельный блок `Награда за задачу`;
- no-drop: compact feedback без тяжелого popup;
- simultaneous level reward + task drop: оба предмета показываются в одном
  feedback flow.

Запрещено:

- показывать пользователю `roll_value`;
- придумывать награду на клиенте, если backend не вернул item.

Повторный tap по `Выполнить` во время запроса блокируется. Если задача уже
completed, backend возвращает идемпотентный результат без нового roll, а UI не
показывает новую награду как fresh event.

### Профиль

Состав:

- имя пользователя;
- уровень;
- общий XP;
- progress до следующего уровня;
- статистика: создано, выполнено, архивировано;
- маскот с экипированными предметами;
- действие изменения отображаемого имени.

Правило: выход из аккаунта лучше держать в настройках, не как главный action
профиля.

### Инвентарь

Состав:

- список предметов пользователя;
- фильтр по слотам;
- фильтр по редкости;
- preview маскота с текущими слотами.

Карточка предмета:

- название;
- редкость;
- слот;
- XP-множитель;
- источник `за уровень` или `за задачу`;
- состояние `надет` / `не надет`;
- действия `Надеть`, `Снять`.

Если слот занят, UI должен ясно показать, что новый предмет заменит текущий.

### Настройки

Состав:

- `Отключить визуальную вариативность`;
- `Уменьшить анимации`;
- `Напоминания`;
- `За сколько минут напоминать`;
- `Выйти`.

Нужно явно показать, что visual random влияет только на цвета, фон и тексты, но
не на порядок действий.

### Архив

Архив можно реализовать как фильтр на главной, но он должен быть явно доступен.

Правила:

- archived задачи доступны для просмотра;
- физического удаления в основном пользовательском сценарии нет;
- архив пустой -> `Архив пока пуст.`.

## 14.3 Admin panel: страницы

### Admin login

Состав:

- email;
- пароль;
- кнопка входа.

Ошибка прав:

- `У этой учетной записи нет доступа к админ-панели`.

### Dashboard / Statistics

Состав:

- пользователи;
- задачи;
- completed tasks;
- выданные предметы;
- reward rolls;
- простые графики, если хватает времени.

Правило: админка должна быть рабочей и читаемой, не декоративным dashboard.

### Users

Состав:

- таблица пользователей;
- колонки email, имя, роль, уровень, XP, дата регистрации;
- поиск по email/имени;
- пагинация;
- краткая карточка пользователя.

Запрещено:

- вручную менять чужой XP;
- обходить backend ownership/security.

### Items

Состав:

- таблица каталога предметов;
- колонки название, редкость, слот, enabled/disabled, дата создания;
- действия создать, редактировать, отключить;
- форма предмета: название, описание, редкость, слот, asset, enabled.

При отключении предмета нужно предупреждение: уже выданные предметы не должны
ломать инвентарь пользователя.

### Audit logs

Состав:

- таблица важных backend-событий;
- фильтры пользователь, action, дата;
- `details_json` в раскрываемом блоке.

Запрещено редактировать audit logs из UI.

## 14.4 States / empty / error / loading

Общие состояния:

- initial loading после открытия приложения;
- expired session: `Сессия истекла. Войдите снова.`;
- network error: `Нет соединения с сервером. Попробуйте позже.`;
- forbidden: `Нет доступа к этому разделу.`;
- server error: `Что-то пошло не так. Повторите попытку.`;
- loading skeleton для списка задач и инвентаря;
- disabled state для кнопок при отправке формы.

Пустые состояния:

- нет активных задач: `Пока нет задач. Добавьте первую.`;
- нет completed задач: `Здесь появятся выполненные задачи.`;
- архив пуст: `Архив пока пуст.`;
- инвентарь пуст: `Предметы появятся после наград.`;
- audit logs пусты: `Событий пока нет.`;
- admin users пусто: `Пользователи не найдены.`;
- admin items пусто: `Предметы не найдены.`.

Ошибки действий:

- complete task failed;
- archive failed;
- equip failed из-за ownership/slot conflict;
- visual state failed -> UI использует последнее сохраненное состояние, без
  локального random fallback;
- reward popup не должен придумывать награду, если backend не вернул item.

Degraded network UX:

- backend остается source of truth;
- mobile app может показывать последний успешно загруженный snapshot задач,
  профиля, visual state и инвентаря как read-only cache;
- cache не считается authoritative;
- при отсутствии соединения frontend не начисляет XP локально;
- frontend не роллит награды;
- frontend не меняет authoritative visual state;
- пользователь должен видеть, что данные могут быть неактуальны.

Unsaved changes и double-submit:

- submit button disabled во время запроса;
- повторный submit не создает дубль;
- при уходе с заполненной формы показывается подтверждение или сохраняется
  draft только как non-authoritative UI state;
- ошибки сохранения не очищают введенные поля;
- успешное действие показывает короткий toast/feedback.

## 14.5 Microcopy и визуальный тон

Тон: спокойный, короткий, поддерживающий, без медицинских обещаний и давления.

Примеры microcopy:

- CTA создания: `Добавить задачу`, `Записать задачу`, `Новая задача`;
- заголовки списка из visual state: `Что сделать сейчас`, `План на сегодня`,
  `Активные задачи`;
- complete feedback: `Задача выполнена`;
- XP feedback: `+120 XP`;
- level-up: `Новый уровень: 5`;
- no-drop: `Предмет не выпал в этот раз`;
- item drop: `Получен предмет`;
- equip success: `Предмет надет`;
- archive success: `Задача перенесена в архив`;
- overdue label: `Просрочено`;
- deadline today: `Сегодня`;
- deadline tomorrow: `Завтра`.

Визуальный тон:

- dark baseline без белых провалов;
- accent color приходит из backend visual state;
- visual random может менять фон, акцент, заголовок списка и текст CTA;
- layout, порядок действий, высоты nav/header и структура карточек не меняются;
- редкости предметов должны иметь стабильную семантику цвета и не конфликтовать
  с цветами статусов задач.

Visual state UX stability:

- visual state не должен визуально дергаться при каждой навигации;
- bootstrap получает текущий visual state до рендера основных экранов или
  использует последнее сохраненное значение;
- `page-enter` не должен менять layout и не должен вызывать заметный flash;
- `manual-refresh` явно инициируется пользователем;
- если backend вернул некорректный или недоступный visual state, frontend
  использует безопасную dark fallback palette без локальной случайности;
- contrast fallback должен быть стабильным и русскоязычным.

### Visual design system

Зафиксировать tokens:

- `background`, `surface`, `surface-muted`;
- `text-primary`, `text-secondary`, `text-muted`;
- `accent`;
- `danger`, `warning`, `success`, `info`;
- `rarity-common`, `rarity-rare`, `rarity-epic`, `rarity-legendary`;
- `status-active`, `status-completed`, `status-archived`, `status-overdue`;
- spacing scale;
- radius scale;
- font sizes для mobile;
- z-index для popup, bottom nav, toast.

Visual state может менять только разрешенные token values из backend whitelist.
Компоненты используют CSS variables/Tailwind theme/SCSS variables, а не
произвольные цвета.

## 14.6 UI/UX non-goals

Не добавлять:

- тяжелый UI-kit;
- магазин предметов;
- социальные функции;
- календарь как отдельный модуль MVP;
- отдельную вкладку `Награды`;
- client-side random для наград, visual state или текстов;
- расчет XP/level в Pinia или компонентах;
- изменение layout через visual random;
- SQL/API business logic во Vue-компонентах;
- медицинские формулировки вроде `лечит прокрастинацию`;
- белую светлую тему как обязательную для MVP;
- сложный конструктор маскота;
- удаление задач из основного пользовательского сценария;
- показ `roll_value` пользователю в reward popup.

## 15. MVP для первой сдачи

Минимальная рабочая версия:

- регистрация;
- вход;
- выход;
- защищенный главный экран;
- создание задачи;
- список задач;
- выполнение задачи;
- архивация задачи;
- XP и уровень;
- профиль;
- каталог предметов;
- получение хотя бы одного предмета за уровень;
- server-side task multiplier и reward audit;
- server-side task drop с сохранением no-drop результата;
- инвентарь;
- reward popup после выполнения задачи, если backend вернул предмет;
- базовая visual state система: акцентный цвет, текст кнопки, заголовок списка;
- настройки `reduced_motion` и `disable_visual_randomness`;
- минимум 10 таблиц в БД;
- базовые тесты backend и доменной логики.

## 15.1 MVP priorities

P0:

- auth;
- tasks;
- complete/archive;
- XP;
- progression;
- reward audit;
- task drop;
- inventory;
- equip;
- visual state;
- settings;
- admin login/items/users/logs;
- migrations;
- seed;
- smoke tests.

P1:

- mascot preview polish;
- item asset upload;
- reminders model/UI;
- admin stats charts;
- Playwright screenshots.

P2:

- native notifications;
- large visual variant set;
- advanced admin analytics;
- custom categories;
- Android release signing.

P0 нельзя вытеснять P1/P2 задачами.

## 15.2 Demo seed data

Для защиты нужны demo/dev seed data:

- admin user;
- обычный user;
- базовые категории задач;
- default mascot;
- mascot slots с `anchor_json`;
- каталог предметов по всем редкостям и слотам;
- default settings;
- несколько visual palettes;
- опционально несколько demo tasks для быстрого показа.

## 16. Что можно отложить

Можно не делать в первой версии:

- синхронизацию между устройствами в реальном времени;
- командные задачи;
- комментарии;
- вложения файлов;
- календарь как отдельный модуль;
- Pomodoro;
- привычки;
- магазин предметов;
- донаты;
- социальные функции;
- ИИ-помощника;
- сложную кастомизацию маскота;
- push-уведомления как нативную доставку;
- большое количество визуальных вариантов.

## 17. Критерии приемки

Проект можно считать готовым для базовой демонстрации, если:

- пользователь может зарегистрироваться и войти;
- после входа пользователь видит только свои данные;
- пользователь может создать, выполнить и архивировать задачу;
- за выполненную задачу начисляется XP;
- уровень пользователя обновляется;
- повторное выполнение задачи не дублирует XP;
- есть профиль с прогрессом;
- есть инвентарь и хотя бы базовая выдача предмета;
- task drop не роллится повторно для одной задачи;
- no-drop результат тоже сохраняется в `task_reward_rolls`;
- клиент не содержит reward random и не отправляет `final_xp`;
- visual state хранится в базе и не выбирается случайно в компоненте;
- база данных содержит не меньше 10 таблиц;
- основные таблицы связаны внешними ключами;
- backend API защищает приватные маршруты;
- интерфейс нормально выглядит на мобильном viewport.

## 17.1 Демонстрационный сценарий

Для защиты должен проходить основной demo path:

1. регистрация нового пользователя;
2. создание первой задачи только по названию;
3. выполнение задачи;
4. показ XP, task multiplier и reward/no-drop результата;
5. просмотр профиля и прогресса;
6. открытие инвентаря;
7. экипировка предмета, если он доступен;
8. проверка, что другой пользователь не видит эти данные;
9. вход в админ-панель;
10. просмотр users/items/audit.

## 17.2 Дополнительные acceptance checks

- OpenAPI 3.1 spec существует и покрывает public/admin endpoints;
- миграции применяются с пустой БД;
- seed создает demo data без перетирания пользовательских данных;
- refresh token rotation работает;
- reuse отозванного refresh token пишет audit event;
- concurrent complete не создает двойной XP/reward;
- no-drop результат сохраняется в `task_reward_rolls`;
- admin RBAC не пускает обычного пользователя;
- upload отклоняет неверный тип и размер файла;
- mobile UI корректен на 320px и не перекрывается bottom nav;
- visual state fallback не использует локальный random.

## 18. Что обязательно сохранить из старых документов

Старую реализацию можно удалить, но эти продуктовые идеи нужно сохранить:

- XP считается от сложности и приоритета;
- уровень линейный через `XP_PER_LEVEL = 1000`;
- task multiplier: `1.00/70%`, `1.25/20%`, `1.50/8%`, `2.00/2%`;
- equipment multiplier считается от надетых предметов и ограничен `1.0..2.0`;
- предметы имеют редкость `common/rare/epic/legendary`;
- конкретный полученный предмет имеет ролленый `xp_multiplier`;
- level reward выдается на каждом 5-м уровне и не дублируется;
- task drop зависит от `final_xp`, а не от сырой сложности;
- `task_reward_rolls` хранит audit и запрещает reroll;
- маскот имеет data-driven slots и `anchor_json`;
- equip требует ownership check и slot compatibility до записи;
- visual random меняет только цвета/тексты/фон, но не layout;
- visual random хранится в `visual_state`;
- пользователь может отключить visual random и motion;
- интерфейс русский, mobile-first, темный, без белых провалов.

## 19. Вопросы для следующих правок

Эти пункты нужно уточнить позже:

- точное название приложения;
- нужен ли полноценный Capacitor Android build в первой сдаче;
- насколько глубокой должна быть админ-панель;
- какие предметы и маскот нужны визуально;
- нужна ли локальная offline-работа после обязательной авторизации;
- какой минимальный набор тестов требуется для защиты.
