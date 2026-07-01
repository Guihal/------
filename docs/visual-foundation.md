# Visual Foundation Brief

Статус: staging-документ для визуальной основы Task Companion.

Этот файл сохраняет контекст из `/home/guihal/Стол/Правки/Что хочется.md`
и последующих уточнений пользователя. На его основании позже будут
переписаны `docs/10-rebuild-technical-spec.md` и пакеты P09-P12.

В этом шаге не переписываются ТЗ, packets, backend-инварианты XP/rewards/auth/RBAC
и уже сделанные коммиты P09/P10. P09-1 должен быть добавочным пакетом поверх
существующих P09/P10, без revert.

## 1. Контекст

Текущие документы хорошо запрещают архитектурные ошибки, но слабо задают
визуальный продукт. Поэтому frontend-агент формально проходит acceptance, но
собирает generic dark Nuxt/Tailwind form UI без айдентики.

Цель этого brief: превратить "сделать не generic" в проверяемый контракт:
tokens, local assets, visual-state mapper, fallback, page contracts и acceptance.

## 2. Формула продукта

Task Companion = личные задачи + мягкая геймификация + чубзик + тихая магия.

Стиль: cozy magic productivity, спокойный темный task-manager с магическим
спутником. Это не RPG, не "волшебная школа", не кислотный cyberpunk, не
generic SaaS/Tailwind и не task/checkmark iconography как основа бренда.

## 3. Hard Visual Principles

- Backend остается source of truth для `visual_state`, random variant, XP,
  rewards, roll, ownership и equip.
- Frontend не вызывает `Math.random()` для visual placement или accent.
- Visual random не меняет layout, положение навигации, главную action-кнопку,
  структуру карточек или семантику статусов.
- SVG/decor assets локальные, прозрачные, `currentColor` или CSS-mask friendly.
- CSS variables являются мостом между backend `visual_state` и UI.
- Decorative layer не снижает читаемость и не перехватывает input.
- Никаких Google Fonts CDN, external icon sets, `fonts.googleapis`/`fonts.gstatic`.
- Никаких access/refresh secrets в `localStorage`/`sessionStorage`.
- Никакого generic `TC` placeholder logo.

## 4. Canonical Color Tokens

Канонические fixed brand tokens:

```css
--bg: #0D0F17;
--surface: #181B25;
--surface-2: #222635;
--stroke: #30364A;
--text: #F4F0E8;
--muted: #9EA7B8;
--magic: #B9A7FF;
--mana: #8FD7C7;
--xp: #F6C76B;
--blue: #7EA7FF;
--danger: #FF6B7A;
```

Semantic aliases поверх них:

- `--brand-logo-color` -> `--text` или `--magic` по контексту;
- `--brand-decoration-primary` -> `--magic`;
- `--brand-decoration-secondary` -> `--mana`;
- `--brand-decoration-muted` -> `--muted`;
- `--magic-glow` -> `--magic`;
- `--xp-accent` -> `--xp`;
- `--background-orb-1` -> `--magic`;
- `--background-orb-2` -> `--blue`;
- `--decorative-opacity-low`, `--decorative-opacity-medium` как opacity tokens.

Runtime token:

- `--accent` не равен `--magic`; он мапится из backend
  `VisualState.accent_color`.
- Текущий backend catalog: `#7dd3fc`, `#a7f3d0`, `#f9a8d4`, `#fde68a`.
- В catalog сейчас нет lilac `#B9A7FF`; добавление lilac в backend catalog —
  отдельное решение и отдельная правка ТЗ/backend, не скрытая frontend-правка.

## 5. Token Hierarchy Beyond Color

- Radius tokens: умеренные и иерархичные, без giant pills везде.
- Spacing tokens: page padding, card padding, stack gaps, nav safe-area padding.
- Typography tokens: display accent для logo/greeting, readable body, без
  внешних fonts.
- Surface opacity tokens: translucent content surfaces при сохранении контраста.
- Shadow/elevation tokens: мягкая depth, без heavy neon noise.
- Motion tokens: reduced-motion path отключает несущественные glow/transition.

## 6. App-Wide Background Contract

- Фон один общий для всех страниц приложения, не per-card.
- Фон использует local magic assets: spark, curl, wisp, orbit, thread,
  tiny-spark как low-opacity decorative icons.
- Иконки выглядят random-distributed, но распределены равномерно и не копятся в
  одном месте.
- Так как client-side visual random запрещен, authority должен быть backend:
  visual variant плюс будущий scatter seed.
- Сейчас backend имеет `decorative_detail`, но не имеет scatter seed. Пока seed
  не появился, frontend fallback использует invariant deterministic layouts:
  fixed layout table keyed by `decorative_detail` или stable hash. Никаких
  time-based, launch-based или render-time `Math.random()`.
- Decorative background находится за content и никогда не влияет на layout.

## 7. Surfaces And Readability

- Header, bottom nav, auth form, cards и page containers — слегка
  translucent surfaces поверх общего фона.
- Form lives inside a translucent card.
- Если decor мешает иерархии, surface получает scrim/blur/backdrop или
  decorative-free content band.
- Скругления умеренные; иерархия: page shell > section/card > input/button.
- Header может быть translucent, но должен иметь достаточный backing для
  контраста.

## 8. Mascot And Logo

- Чубзик — основной знак/маскот, но не спамится в каждой мелочи.
- Auth/register могут использовать чубзика/лого как главный brand mark.
- Profile может использовать mascot preview.
- Task list держит mascot/decor subtle, чтобы задачи оставались главным
  сценарием.
- Logo source: `logo.png`, custom made by the user's girlfriend and
  Photoshop-adjusted. SVG-версии нет.
- Logo component использует PNG как CSS mask; цвет контролируется token'ом.
  Маска означает одноцветный silhouette, внутренняя цветовая детализация не
  сохраняется.
- Logo component может иметь flexible styling: size, color, glow; без business
  logic.

## 9. Brand Asset Registry

Локальные ассеты для регистрации/копирования позже:

- `chubzik-logo.png` из `/home/guihal/Стол/Правки/Изображения/logo.png`;
- `magic-spark.svg`;
- `tiny-spark.svg`;
- `magic-curl.svg`;
- `magic-wisp.svg`;
- `magic-orbit.svg`;
- `magic-thread.svg`.

SVG requirements: `currentColor`/mask-ready, transparent background,
`aria-hidden` when decorative, local only, no CDN/runtime third-party icon
loading.

## 10. VisualState To CSS Variables Mapper

Existing backend fields:

- `accent_color` -> runtime `--accent`;
- `background_variant` -> background token set;
- `card_variant` -> surface/card token set;
- `profile_background` -> profile-only background variant;
- `decorative_detail` -> decorative asset/layout set;
- `task_button_text`, `task_list_heading`, `level_up_text`, `empty_state_text`
  -> UI text fields, not hard-coded component copy.

Settings:

- `disable_visual_randomness` forces stable fallback / least-dynamic variant.
- `reduced_motion` plus `prefers-reduced-motion` disables non-essential glow
  and transition effects.

Fallback:

- Stable dark fallback works without backend `visual_state` response.
- Fallback uses fixed canonical tokens plus deterministic decorative layout.

## 11. Frontend Boundary

Frontend may apply visual state and render readonly response data.

Frontend must not:

- compute XP, rewards, rolls, level, equip or ownership;
- submit server-owned `user_id`, `final_xp`, `level`, `roll_value`;
- choose reward or visual random through component `Math.random()`;
- change layout from visual random;
- store secrets in `localStorage`/`sessionStorage`;
- use generic `TC` logo placeholder.

## 12. Backend / Open Decisions

- OD1: backend accent catalog currently lacks lilac `#B9A7FF`; decide later
  whether to add it.
- OD2: backend `VisualState` currently lacks decorative scatter seed/positions;
  decide later whether to add a seed or keep frontend deterministic fallback only.

Both are future ТЗ/backend decisions, not silent frontend implementation details.

## 13. Packet Rewrite Preview

Это preview, не выполняется в текущем шаге.

- **P09-1:** additive visual foundation after committed P09/P10; no revert. Add
  visual token contract, asset registry, VisualState mapper, fallback theme,
  page contract template and no-random helpers.
- **P10:** auth/register shell becomes first identity carrier: logo mask, magic
  background, translucent auth card, visible inputs, reduced motion, no `TC`.
- **P11:** task flow stays functional and calm; magic only background, empty
  states and success feedback; statuses text/icon-labeled, not color-only.
- **P12:** profile/inventory/rewards carry stronger magic layer: mascot central,
  rarity tokens/frame/glow, reward popup only for fresh backend event, no-drop
  quiet, rarity text labels.
- **P13/P14:** can reuse the foundation; admin may be visually stricter/quieter.

## 14. Acceptance Preview For Later Work

- `rg -n "Math.random" apps shared` has no visual random usage.
- Raw hex colors in apps are limited to theme/fallback/token files.
- Local logo/SVG assets exist and are registered.
- VisualState mapper has fixture/self-check for backend state -> CSS vars plus
  fallback.
- Login/register at 320px has no horizontal scroll.
- Reduced motion path exists.
- Decorative background does not block readability or inputs.
- `rg -n "fonts.googleapis|fonts.gstatic" apps` returns no CDN font dependency.
