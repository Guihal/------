# AGENTS.md

Правила для AI-агентов в этом репо.

## 1. Источник правды

Рабочий документ один:

- [docs/10-rebuild-technical-spec.md](docs/10-rebuild-technical-spec.md)

Дополнительные инженерные правила:

- [docs/RULES.md](docs/RULES.md)

Старые MVP-0/offline-only документы удалены. Не восстанавливать их и не
использовать старую реализацию как архитектурную основу.

## 2. Направление проекта

Проект переписывается с нуля как task-manager с обязательной авторизацией,
backend source of truth, XP, уровнями, reward system, маскотом, инвентарем,
visual state, настройками и админ-панелью.

База данных должна иметь не меньше 10 таблиц.

## 3. Обязательный стек

Админ-панель:

- Nuxt 4;
- Pinia;
- Tailwind CSS;
- SCSS.

Мобильное приложение:

- Nuxt 4;
- Capacitor;
- Pinia;
- Tailwind CSS;
- SCSS.

Backend:

- максимально простой API;
- рекомендуемый вариант: Go single binary + PostgreSQL;
- допустимый fallback: Bun/Node + Hono + Drizzle + PostgreSQL, если это явно
  выбрано отдельной правкой ТЗ.

## 4. Hard Rules

- Авторизация обязательна.
- Backend владеет `user_id`, XP, уровнем, rewards, random roll и audit.
- Клиент не отправляет `final_xp`, `level`, `roll_value` или чужой `user_id`.
- Клиент не роллит награды и не считает итоговый XP.
- Visual random не делается в компонентах через `Math.random()`.
- `visual_state` хранится как данные и приходит в UI через API/store.
- Pinia store не содержит бизнес-логику XP/reward/drop/equip.
- SQL не пишется в Vue-компонентах.
- Tailwind + SCSS использовать в обоих frontend.
- Vue SFC `v-bind()` в стилях использовать можно и нужно, если это упрощает
  применение visual state.
- Старый local SQLite/offline-first подход не является текущим source of truth.
- Production-файлы держать до 150 строк, кроме явно разрешенных исключений из
  `docs/RULES.md`.
- Держать минимальную связанность слоев: UI не импортирует backend/database
  детали, backend не зависит от frontend, shared-код не содержит runtime
  бизнес-логики.

## 5. Перед изменениями

1. Читать [docs/10-rebuild-technical-spec.md](docs/10-rebuild-technical-spec.md).
2. Читать [docs/RULES.md](docs/RULES.md).
3. Проверить, не противоречит ли задача обязательному стеку.
4. Если задача меняет архитектурное решение, сначала обновить ТЗ.
5. Не создавать новые документы вне `docs/` без явной просьбы.
6. Не восстанавливать удаленные старые docs.

## 6. Команды

Точные команды появятся после scaffold. До этого не угадывать package scripts.

Ожидаемые проверки после реализации:

- frontend typecheck/build/test для admin-panel;
- frontend typecheck/build/test для mobile app;
- backend test/typecheck или `go test ./...`;
- API smoke для auth/task/reward flow.
