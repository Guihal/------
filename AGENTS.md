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

## 5. Визуальная система (P09-1 реализована)

Источник правды: [docs/visual-foundation.md](docs/visual-foundation.md).

Канонические CSS-токены определены в `apps/mobile/app/assets/css/tokens.scss`
(80 LOC). Сырой hex ТОЛЬКО там + в `shared/visual/visual-state.ts` fallback.
Компоненты потребляют CSS-переменные, не hex-значения.

Визуальные компоненты (defined once, consumed everywhere):
- `Logo.vue` — PNG mask, color через currentColor/token. Props: size, color,
  glow, decorative, label. `aria-hidden` по умолчанию.
- `VisualBackground.vue` — общий фон для всех страниц. Декоративные SVG
  через mask-image, low opacity, non-blocking. Принимает prop
  `decorativeDetail` (soft-sparks/thin-rings/small-dots).

Shared-модули в `shared/visual/`:
- `visual-state.ts` — `visualStateToCssVars(state, settings?)`:
  `Record<string,string>`. Покрывает цвета + текстовые поля
  (task_button_text, task_list_heading, level_up_text, empty_state_text).
  null OR `disable_visual_randomness` → стабильный fallback.
- `scatter.ts` — `scatterLayout(detail)`: детерминированная таблица позиций.
  Никакого `Math.random`.
- `assets.ts` — реестр локальных бренд-ассетов (chubzik-logo.png + 6 SVG).
  SVG = `currentColor`/mask-ready, `aria-hidden` когда декоративные.
- `index.ts` — re-export.

Бренд-ассеты: `apps/mobile/app/assets/brand/` (7 файлов, скопированы из
источника). CDN запрещён.

Токен-иерархия:
- `--magic #B9A7FF` — фиксированный бренд (декорация, НЕ runtime accent).
- `--accent` — runtime, маппится из `VisualState.accent_color`.
- Бэкенд-каталог accent: `{#7dd3fc, #a7f3d0, #f9a8d4, #fde68a}`.
- Lilac (`#B9A7FF`) НЕ в каталоге — OD1 (отдельное ТЗ-решение).
- Scatter seed — OD2 (отдельное ТЗ/бэкенд).

Self-check: `bun shared/visual/scatter.ts`, `bun shared/visual/visual-state.ts`.

## 6. Текущее состояние реализации

Закоммиченные пакеты: P00–P10 (backend) + P09 shared client + P09-1 visual
foundation + P10 mobile scaffold. Все в ветке `main`.

P10 mobile scaffold (04d0554) использует legacy CSS-токены из main.scss (до
tokens.scss). P09-1 (734a389) заменил `:root` в main.scss на
`@use "./tokens.scss"` и подключил VisualBackground + mapper в app.vue.
Legacy-алиасы (--accent-weak, --accent-grad, --glow-accent, --ring,
--shadow-card) сохранены — P10-компоненты (login/register/AppHeader/
BottomNav/FormField/AppButton) их потребляют.

Команды после реализации пакета:
- `cd apps/mobile && bun run typecheck` (exit 0; `[Vue] Failed to create
  plugin` — known nuxt artifact, не ломает).
- `cd apps/mobile && bun run build`.
- `rg -n "Math.random|fonts.googleapis" apps shared` → none.

## 7. Перед изменениями

1. Читать [docs/10-rebuild-technical-spec.md](docs/10-rebuild-technical-spec.md).
2. Читать [docs/RULES.md](docs/RULES.md).
3. Проверить, не противоречит ли задача обязательному стеку.
4. Если задача меняет архитектурное решение, сначала обновить ТЗ.
5. Не создавать новые документы вне `docs/` без явной просьбы.
6. Не восстанавливать удаленные старые docs.

## 8. Команды

Точные команды появятся после scaffold. До этого не угадывать package scripts.

Ожидаемые проверки после реализации:

- frontend typecheck/build/test для admin-panel;
- frontend typecheck/build/test для mobile app;
- backend test/typecheck или `go test ./...`;
- API smoke для auth/task/reward flow.
