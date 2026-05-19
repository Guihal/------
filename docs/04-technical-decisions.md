# Технические решения

Этот файл фиксирует стартовые ADR для разработки. Решения можно менять, но
только явно, с правкой этого документа.

## ADR-001. Nuxt работает как клиентское приложение

Решение: для мобильного runtime приложение собирается как client-side app без
SSR.

Причины:

- приложение offline-first;
- данные живут локально в SQLite;
- SSR не нужен для мобильного MVP;
- Capacitor проще интегрировать с клиентским runtime.

Следствие:

- все обращения к Capacitor API выполняются только на клиенте;
- bootstrap приложения должен учитывать, что SQLite недоступен во время SSR;
- браузерный dev-mode используется для UI, но мобильные функции проверяются в
  Android runtime.

## ADR-002. Основная платформа MVP - Android

Решение: сначала делаем Android.

Причины:

- меньше целевых платформ;
- проще дипломная демонстрация;
- Capacitor хорошо подходит для Android shell;
- iOS требует отдельной инфраструктуры сборки и подписи.

Следствие:

- iOS не блокирует MVP;
- адаптивность под мобильный viewport обязательна;
- desktop/browser остается dev-target, а не основной продуктовый target.

## ADR-003. Локальное хранилище production runtime - SQLite

Решение: основное хранилище Android MVP - SQLite через Capacitor-плагин.

Предварительный кандидат: `@capacitor-community/sqlite`.

Причины:

- нужна персистентность без сервера;
- данные имеют связи: задачи, профиль, прогресс, инвентарь, экипировка;
- SQLite проще обосновать в дипломной архитектуре, чем localStorage;
- позже можно заменить repository implementation на REST/sync слой.

Следствие:

- все таблицы создаются миграциями;
- UI не знает про SQL;
- stores не выполняют SQL-запросы;
- проверка персистентности выполняется на Android runtime.

## ADR-004. Browser dev использует memory repositories

Решение: браузерный режим разработки не обязан использовать SQLite. Для UI и
быстрой разработки используются memory repositories.

Причины:

- Capacitor SQLite может требовать отдельной web-настройки;
- UI не должен блокироваться Android runtime;
- repository interfaces позволяют заменить хранилище без изменения stores;
- production-персистентность все равно проверяется на Android/SQLite.

Следствие:

- в browser dev данные могут сбрасываться при перезагрузке;
- это допустимо для UI-разработки;
- для MVP-0 нужны memory task/profile/progression repositories;
- для MVP-1 добавляются memory mascot/inventory repositories;
- для MVP-2 добавляются memory settings/visual-state repositories и
  `NoopNotificationPort`;
- если позже понадобится web-персистентность, она добавляется отдельным ADR.

## ADR-005. Уведомления через отдельный port

Решение: локальные уведомления вызываются только через `NotificationPort`.

Предварительный кандидат реализации: Capacitor Local Notifications.

Фаза: MVP-2.

Причины:

- use cases должны решать, когда уведомление нужно;
- инфраструктура должна только планировать или отменять уведомление;
- так проще заменить реализацию или отключить уведомления в тестах.

Следствие:

- компоненты не вызывают notification API;
- при выполнении/архивации задачи use case отменяет уведомление;
- при изменении дедлайна use case пересоздает уведомление;
- в browser dev используется `NoopNotificationPort`.

## ADR-006. UI без тяжелого UI-kit

Решение: в MVP не брать тяжелый UI-kit. Компоненты пишутся локально на Vue SFC,
CSS variables и scoped styles.

Причины:

- приложению нужен специфичный мобильный task flow;
- UI-kit может принести лишние паттерны и визуальный шум;
- темная тема и визуальная вариативность проще контролируются через CSS
  variables;
- дипломному проекту полезнее показать собственную UI-систему.

Следствие:

- создаются свои `TaskCard`, `TaskForm`, `AppHeader`, `BottomNav`,
  `MascotView`;
- цвета, радиусы, отступы и состояния фиксируются через design tokens;
- иконки можно подключить отдельной легкой библиотекой позже.

## ADR-007. Stores не содержат бизнес-логику

Решение: Pinia stores вызывают use cases и синхронизируют состояние UI.

Причины:

- бизнес-правила должны тестироваться без Vue;
- stores быстро превращаются в смешанный слой;
- use cases лучше подходят для дипломного описания архитектуры.

Следствие:

- расчет XP не находится в store;
- сортировка задач не находится в компоненте;
- выдача предмета не находится в profile screen;
- store может иметь loading/error state и методы вроде `load`, `create`,
  `complete`.

## ADR-008. Доменная логика тестируется первой

Решение: первые тесты пишутся для `core`.

Тестовый инструмент: Vitest.

Тестировать в MVP-0:

- `suggestTaskComplexity`;
- `resolveTaskList`;
- `calculateTaskXp`;
- `applyLevelProgress`;
- `createTask`;
- `completeTask`;
- `archiveTask`.

Тестировать в MVP-1:

- `grantLevelRewards`;
- `rollTaskXpMultiplier`;
- `calculateEquipmentXpMultiplier`;
- `rollInventoryDrop`;
- `generateItemStats`;
- защиту от повторной награды за уровень;
- защиту от повторного drop-roll для задачи.

Причины:

- эти правила задают поведение приложения;
- их проще сломать при развитии;
- тесты не зависят от мобильного runtime.

## ADR-009. Предметы в MVP-1 имеют только XP-множитель

Решение: предметы в MVP-1 могут давать бонус к XP, но не дают других бонусов.

Причины:

- XP-множитель напрямую связан с основным task flow;
- пользователь получает понятную награду за выполнение задач;
- другие бонусы требуют отдельной балансировки;
- пользователь пришел управлять задачами, а не оптимизировать билд;
- линейный уровень остается предсказуемым, даже если XP за задачу меняется.

Следствие:

- `UserInventoryItem` хранит сгенерированный `xpMultiplier`;
- XP-множитель применяется только от надетых предметов;
- бонусы к шансам выпадения, штрафам, сериям и другим механикам остаются
  Post-MVP;
- для баланса вводится cap на общий equipment XP multiplier.

## ADR-010. Просрочка не является статусом

Решение: просрочка вычисляется из `status = active` и `dueAt < now`.

Причины:

- задача может быть просрочена и все еще активна;
- не нужен отдельный переход `active -> overdue -> completed`;
- проще сортировка и отображение;
- меньше риска сломать уведомления и выполнение.

Следствие:

- в БД нет статуса `overdue`;
- UI показывает просрочку как derived state;
- use case выполнения не отличается для обычной и просроченной задачи.

## ADR-011. Архивация вместо удаления в основном flow

Решение: пользовательское удаление в MVP реализуется как архивирование.

Причины:

- безопаснее для пользователя;
- проще восстановить поведение в будущем;
- не ломает статистику и историю прогресса;
- физическое удаление можно добавить в настройках/debug/Post-MVP.

Следствие:

- `tasks.status = archived`;
- `archivedAt` заполняется;
- архивные задачи не видны на главной;
- hard delete не нужен для MVP UI.

## ADR-012. Visual random хранится в состоянии

Решение: случайные визуальные значения выбираются use case-ом и сохраняются в
`visual_state`.

Фаза: MVP-2.

Причины:

- random при каждом render ломает стабильность;
- нужно избегать повторов;
- пользователь может отключить визуальную вариативность;
- компоненты должны получать готовые значения.

Следствие:

- в компонентах нет `Math.random()`;
- visual store отдает текущую тему, текст кнопки и заголовок;
- смена происходит только на событиях `app-enter`, `page-enter`,
  `task-created`, `level-up`, `manual`.

## ADR-013. Ассеты маскота

Решение MVP-1: маскот и предметы как растровые изображения с прозрачностью
(`webp` или `png`) плюс координаты anchor points.

Причины:

- проще сделать рабочую версию;
- хорошо подходит для layered rendering;
- не нужно строить сложную систему SVG-кастомизации;
- можно заменить ассеты без изменения доменной логики.

Следствие:

- `MascotView` рендерит базовое изображение и слои предметов;
- предметы привязываются к слотам;
- координаты слоев хранятся в конфиге ассетов, не в компонентах.

## ADR-014. Уровни линейные с фиксированным XP на уровень

Решение: хранить `xpTotal`, а уровень вычислять через фиксированный
`XP_PER_LEVEL`.

Причины:

- общий XP удобно показывать пользователю;
- нет неоднозначности между total XP и XP внутри уровня;
- можно пересчитать уровень детерминированно;
- прогресс предсказуемый и не становится экспоненциальной лестницей.

Следствие:

- `xpTotal` никогда не уменьшается в MVP;
- `level` обновляется use case-ом `applyLevelProgress`;
- `level = floor(xpTotal / XP_PER_LEVEL) + 1`;
- `xpInCurrentLevel = xpTotal % XP_PER_LEVEL`.

## ADR-015. Награды за уровни идемпотентны

Решение: выдача предмета за уровень фиксируется в таблице `level_rewards`, а
drop после задачи фиксируется в `task_reward_rolls`.

Причины:

- use case может быть вызван повторно;
- приложение может перезапуститься между начислением XP и UI feedback;
- нельзя выдавать дубликаты за один и тот же уровень;
- нельзя reroll-ить награду за одну и ту же выполненную задачу.

Следствие:

- награда за уровень имеет ключ `(profile_id, level)`;
- перед выдачей предмета use case проверяет наличие записи;
- task drop имеет ключ `task_id`;
- повторный вызов не создает второй предмет и не меняет roll.

## ADR-016. Scope делится на MVP-0/MVP-1/MVP-2/Post-MVP

Решение: все функции закрепляются за этапами из `00-scope-map.md`.

Причины:

- исходная идея шире реального первого релиза;
- разработка должна сначала доказать task flow;
- маскот, инвентарь, уведомления и visual random полезны, но не должны
  блокировать ядро.

Следствие:

- MVP-0 = задачи + SQLite + XP/level;
- MVP-1 = маскот + инвентарь + XP-множители + награды;
- MVP-2 = уведомления + visual random + настройки;
- Post-MVP = сервер, синхронизация, календарь, привычки, Pomodoro и расширения.

## ADR-017. Многошаговые use cases выполняются транзакционно

Решение: use cases, которые меняют несколько частей состояния, используют
`UnitOfWorkPort` с transaction-bound context.

Причины:

- выполнение задачи меняет task status, XP и уровень;
- в MVP-1 тот же flow может выдать предмет;
- частичное сохранение создаст неконсистентное состояние;
- memory и SQLite реализации должны иметь одинаковый контракт.

Следствие:

- `UnitOfWorkPort.run` принимает callback `(ctx) => Promise<T>`;
- `ctx` содержит repositories, привязанные к текущей transaction;
- `completeTask` выполняет БД-изменения через repositories из `ctx`;
- `grantLevelRewards` выполняется в той же transaction и через тот же `ctx`;
- nested transactions запрещены: внутренние use cases принимают существующий
  `ctx`;
- внешние side effects, например cancel notification, идут после commit;
- если notification side effect падает, БД не откатывается задним числом.

## ADR-018. Миграции выполняются через migration runner

Решение: SQLite-схема изменяется только миграциями, применяемыми единым runner.

Причины:

- повторный запуск приложения не должен ломать БД;
- частично примененная миграция опаснее отсутствующей фичи;
- дипломная архитектура должна явно описывать версионирование схемы.

Следствие:

- при открытии connection выполняется `PRAGMA foreign_keys = ON`;
- runner создает `schema_migrations`, если таблицы нет;
- миграции применяются по возрастанию `version`;
- каждая миграция выполняется в отдельной transaction;
- запись в `schema_migrations` вставляется только после успешного SQL;
- при ошибке выполняется rollback и bootstrap останавливается;
- примененные миграции нельзя редактировать задним числом.

## ADR-019. MVP-0 имеет static dark baseline, MVP-2 имеет visual random

Решение: базовые design tokens и статичная темная тема входят в MVP-0, а
вариативность темы и persisted visual state входят в MVP-2.

Причины:

- MVP-0 все равно нуждается в нормальном UI baseline;
- visual random не должен блокировать task flow;
- смешивание этих задач раздувает первый релиз.

Следствие:

- MVP-0: цвета, отступы, радиусы, типографика, статичная темная палитра;
- MVP-2: visual variants, random refresh events, `visual_state`, настройки
  отключения.

## ADR-020. Notification side effects имеют reconciliation

Решение: локальные уведомления планируются/отменяются после commit, а возможные
расхождения чинятся reconciliation на bootstrap.

Причины:

- notification API является внешним side effect;
- БД нельзя откатывать задним числом после failed cancel/schedule;
- без reconciliation completed/archived task может оставить pending reminder.

Следствие:

- `NotificationPort` умеет вернуть pending task reminders;
- на bootstrap MVP-2 приложение отменяет reminders для completed/archived задач;
- приложение отменяет reminders для задач с выключенным reminder;
- приложение пересоздает reminders, если состояние БД и pending notifications
  расходятся.

## ADR-021. Drop chance зависит от итогового XP задачи

Решение: шанс выпадения предмета после задачи считается от `finalXp`, уже после
task multiplier и XP-множителей надетых предметов.

Причины:

- большая задача должна иметь более ощутимый шанс награды;
- случайный task multiplier дает приятное непредсказуемое подкрепление;
- экипировка с XP-множителем должна ощущаться полезной;
- caps не дают предметам выпадать слишком часто.

Следствие:

- `baseXp = complexityXp + priorityBonus`;
- `finalXp = round(baseXp * taskMultiplier * equipmentXpMultiplier)`;
- `dropMultiplier = clamp(finalXp / DROP_XP_UNIT, min, max)`;
- редкость выбирается по effective thresholds от `legendary` к `common`;
- если предмет выпал, его `xpMultiplier` роллится по диапазону редкости;
- результат roll сохраняется в `task_reward_rolls`, даже если предмет не выпал.

## ADR-022. Менеджер пакетов — bun

Дата: 2026-05-19. Статус: принято.

Контекст: open decision [02 § 19](02-architecture.md#19-открытые-решения) +
[AGENTS § 10](../AGENTS.md#10-decisions-log-policy) — PM перед T01 scaffold.

Решение: `bun ≥ 1.1.x`. Lockfile `bun.lock`.

Причины: глобальные правила `~/.claude/CLAUDE.md` юзают `bunx tsc` / `bun test`;
быстрее npm/pnpm; test runner встроен; совместим с Nuxt 4 + Capacitor.

Следствие: CI `bun install --frozen-lockfile`; команды `bun test`,
`bunx tsc --noEmit`, `bunx nuxt dev`, `bunx cap sync android`; fallback npm если
bun отсутствует → patch этот ADR.

## ADR-023. Android SDK target — minSdk 22, targetSdk 34

Дата: 2026-05-19. Статус: принято.

Контекст: open decision [02 § 19 п.2](02-architecture.md#19-открытые-решения).

Решение: `minSdkVersion = 22` (Android 5.1), `targetSdkVersion = 34` (Android 14),
`compileSdkVersion = 34`. Зафиксировать в `android/app/build.gradle` на T02.

Причины: Capacitor 6 docs require minSdk 22; targetSdk 34 = Google Play
requirement 2026+; покрывает 95%+ устройств.

Следствие: T02 acceptance включает проверку `android/app/build.gradle`; bump +
patch ADR если @capacitor-community/sqlite требует higher.

## ADR-024. Result-style либа — ручной discriminated union

Дата: 2026-05-19. Статус: принято.

Контекст: open decision [AGENTS § 10 п.6](../AGENTS.md#10-decisions-log-policy).

Решение: ручной `type Result<T, E = DomainError> = { ok: true; value: T } | { ok: false; error: E }`
в `core/domain/result.ts`. Не использовать `neverthrow`.

Причины: zero dependency; discriminated union narrowing работает с TS strict;
легко мигрировать на `neverthrow` если понадобятся combinator'ы; для дипломного
scope нет нужды в chain ops (map/flatMap).

Следствие: T03 создаёт `core/domain/result.ts`; use case signatures используют
`Result<T, DomainError>`; throw только для programmer errors (invariant violation).

## ADR-025. Tests расположение — co-located use case + tests/domain/

Дата: 2026-05-19. Статус: принято.

Контекст: open decision [AGENTS § 6](../AGENTS.md#6-test-strategy).

Решение:
- Use case тесты — co-located: `core/use-cases/tasks/complete-task.use-case.test.ts`.
- Domain тесты — `tests/domain/` зеркалом (`tests/domain/xp.test.ts`).
- Infrastructure тесты — `tests/infrastructure/` (migration runner smoke).
- Test fakes — `tests/fakes/` (FakeClockPort, SeededRandomPort).

Причины: co-located use case + test = удобство навигации; `tests/domain/`
отдельно = инварианты собраны списком; vitest auto-discovery работает с обоими.

Следствие: T05/T06/T07/T11 acceptance этому follow; `vitest.config.ts` includes
`['**/*.test.ts', 'tests/**/*.test.ts']`.

## ADR-026. Folder layout — плоская раскладка (без src/)

Дата: 2026-05-19. Статус: принято.

Контекст: open decision [AGENTS § 3](../AGENTS.md#3-folder-layout) +
[02 § 5](02-architecture.md#5-предлагаемая-структура-проекта).

Решение: плоская от корня — `app/`, `core/`, `infrastructure/`, `plugins/`,
`tests/`, `docs/`. БЕЗ `src/` префикса.

Причины: 02 § 5 canon — плоская; Nuxt 4 поддерживает оба варианта; плоская =
короче импорты, меньше cognitive overhead.

Следствие: T01 packet acceptance — папки в корне без `src/`; packet examples в
07 используют `core/...`; AGENTS § 3 + 02 § 5 — canon. Если Nuxt scaffold
потребует `srcDir: 'src'` — future ADR.

## ADR-027. Capacitor SQLite plugin — @capacitor-community/sqlite

Дата: 2026-05-19. Статус: принято (с verification на T02).

Контекст: open decision [ADR-003](#adr-003-локальное-хранилище-production-runtime---sqlite) +
[05-critic-pass § Watchlist п.1](05-critic-pass.md#watchlist).

Решение: `@capacitor-community/sqlite` (latest compatible с Capacitor 6+).
**T02 packet ОБЯЗАН выполнить install + minimal CRUD smoke** до T08 (migration
runner). Plugin несовместим → abort wave + patch ADR.

Причины: единственный mainstream Capacitor plugin для нативного SQLite Android;
поддерживает PRAGMA foreign_keys, transactions, prepared statements; API совместим
Capacitor 6+. Web SQLite (browser dev) НЕ юзает — fallback на memory (ADR-004).

Следствие: T02 acceptance включает `bunx cap sync android` ok + smoke `INSERT +
SELECT` round-trip; T08 blocked на T02 verify; smoke fail → ADR-027 patch с
альтернативой.

## ADR-028. Web SQLite — отложено, browser dev на memory-only

Дата: 2026-05-19. Статус: принято (default из ADR-004).

Контекст: open decision [02 § 19 п.4](02-architecture.md#19-открытые-решения).

Решение: для browser dev — ТОЛЬКО memory repositories ([ADR-004](#adr-004-browser-dev-использует-memory-repositories)).
Web SQLite (wa-sqlite / sql.js / OPFS) — Post-MVP-0.

Причины: memory repos достаточны для UI разработки в `bunx nuxt dev`; web SQLite
требует WASM bundle + persistent storage (IndexedDB / OPFS) — лишний tooling
для дипломного scope; Android Capacitor SQLite остаётся production-runtime.

Следствие: T10 packet — только Memory* repos для browser; bootstrap T12 detect
runtime (Capacitor → SQLite, иначе → memory); юзер при `bunx nuxt dev` теряет
данные на reload (намеренно для UI dev).
