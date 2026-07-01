# Packet P09-1: Frontend Contracts, Shared API Client and Visual Foundation

## Goal
Create shared frontend API client, DTO types, error mapper, page contract
conventions, and the visual foundation (tokens, VisualState→CSS-vars mapper,
brand asset registry, fallback theme) for the Task Companion brand identity.

## Read First
- `docs/10-rebuild-technical-spec.md` § 9.6
- `docs/10-rebuild-technical-spec.md` § 10.1-10.2
- `docs/10-rebuild-technical-spec.md` § 13
- `docs/visual-foundation.md` § 3-§10
- `docs/RULES.md`
- `docs/packets/README.md` § Архитектурный минимум для пакетов

## Scope In
- shared OpenAPI-based client or typed `ofetch` wrapper.
- auth header/refresh handling contract.
- API error mapper.
- DTO type location.
- Pinia store conventions.
- route middleware conventions for admin/mobile apps.
- shared visual token contract: canonical color tokens + semantic aliases +
  runtime `--accent` (≠ `--magic`) mapped from `VisualState.accent_color`.
- non-color token hierarchy: radius (modest, hierarchical), spacing,
  typography, surface-opacity, shadow/elevation, motion, safe-area.
- VisualState → CSS variables mapper, including backend-owned UI TEXT fields
  (`task_button_text`, `task_list_heading`, `level_up_text`, `empty_state_text`)
  as response-derived UI copy, not hard-coded component strings.
- brand asset registry for local assets: `chubzik-logo.png` (PNG, used as CSS
  mask) and `magic-spark`/`tiny-spark`/`magic-curl`/`magic-wisp`/`magic-orbit`/
  `magic-thread` (SVG, `currentColor`/mask-ready, `aria-hidden` when
  decorative). Local only, no CDN.
- invariant deterministic scatter helper for the app-wide background:
  fixed layout table keyed by `decorative_detail` (or stable hash). NO
  `Math.random()`, NO per-launch drift, NO render-time randomness.
- stable dark fallback theme that works without a backend `visual_state`
  response (canonical tokens + deterministic decorative layout).
- page contract template for auth, task list, profile, inventory, settings and
  admin pages: endpoints, data shape, states, actions.
- shared `Logo` component contract (PNG as CSS mask, token-colored, flexible
  size/color/glow styling, no business logic).
- shared `VisualBackground` component contract (one common background for all
  pages, low-opacity local SVG decor, invariant scatter, non-blocking,
  reduced-motion aware).
- explicit ban on Google Fonts CDN (`fonts.googleapis`/`fonts.gstatic`) and
  external icon sets.

## Scope Out
- No backend endpoint implementation.
- No complete mobile/admin screens.
- No local business logic for XP/rewards.
- No component-side `Math.random()` for visual placement or accent.
- No new backend `visual_state` fields — OD1 (lilac in accent catalog) and OD2
  (decorative scatter seed) are separate ТЗ/backend edits, not silent
  frontend additions.
- No full visual redesign of already-built pages beyond foundation contracts.

## Requirements
- Frontend never submits trusted server-owned fields: `user_id`, `final_xp`,
  `level`, `roll_value`.
- `user_id`, `final_xp`, `level`, and reward summary fields may exist in
  readonly response DTOs where backend returns data; they must not be accepted
  from normal client action payloads or computed in UI.
- Access token is memory-only.
- Refresh handling is centralized.
- Admin app uses the same memory-only access token rule.
- Admin refresh token strategy is `httpOnly Secure SameSite` cookie where
  possible; Bearer refresh flow is allowed only if secrets are never stored in
  `localStorage` or `sessionStorage`.
- UI errors use backend error format mapped to Russian messages.
- Page contracts list endpoints, data shape, states and actions.
- Stores call services and do not compute business mechanics.
- Pinia is a thin state/loading/error/actions layer.
- Do not add a class wrapper over Pinia as a business layer.
- Readonly helper/view-model formatters are allowed for display-only data.
- Components consume visual variables, not hard-coded arbitrary colors.
- CSS variables are the primary bridge between backend `visual_state` and UI.
- `--accent` is a runtime token mapped from `VisualState.accent_color`; it is
  NOT `--magic`. Backend accent catalog is `{#7dd3fc, #a7f3d0, #f9a8d4,
  #fde68a}` (no lilac); `--magic #B9A7FF` stays a fixed brand token.
- `xp`, `danger`, `mana` are fixed by rule; backend may roll `--accent` plus
  background/card/decor variants.
- VisualState→CSS-vars mapper covers the existing backend fields
  (`accent_color`, `background_variant`, `card_variant`, `profile_background`,
  `decorative_detail`) and the text fields (`task_button_text`,
  `task_list_heading`, `level_up_text`, `empty_state_text`).
- Settings `disable_visual_randomness` forces the stable fallback /
  least-dynamic variant; `reduced_motion` plus `@media (prefers-reduced-motion)`
  disables non-essential glow/transition.
- Stable dark fallback works without a backend `visual_state` response and uses
  fixed canonical tokens plus a deterministic decorative layout.
- Decorative SVGs are `aria-hidden` when decorative.
- Shared `Logo` and `VisualBackground` components are defined once here and
  consumed by name by P10/P11/P12.

## Acceptance
- admin and mobile apps import API client from one agreed location.
- API errors are mapped to Russian UI messages.
- unauthorized/expired session path is implemented in client contract.
- `rg -n "Math.random|final_xp|roll_value" apps shared` finds no client business
  logic or request payloads; matches are only readonly DTO/response rendering.
- generated request types do not require user-controlled `user_id` for protected
  actions.
- `rg -n "#[0-9A-Fa-f]{3,8}" apps/mobile apps/admin` is reviewed so raw colors
  are limited to theme/fallback/token files.
- visual-state mapper exists with a fixture/self-check mapping backend state →
  CSS variables + text fields + stable fallback.
- brand asset registry exists and references local `chubzik-logo.png` and the
  six magic SVG files (currentColor/mask-ready, aria-hidden when decorative).
- `rg -n "fonts.googleapis|fonts.gstatic" apps shared` returns no CDN font
  dependency.
- packets P10/P11/P12 reference P09-1's client/DTO/mapper/token/asset
  definitions by path (`rg -n "shared/api|shared/contracts|visual-foundation"
  docs/packets`).
- fallback theme renders without a backend `visual_state` response.

## Escalation
- Stop if OpenAPI schema is missing for required endpoints.
- Stop if auth storage strategy differs between apps without a ТЗ update.
- Stop if generated types conflict with backend response shape.
- Stop if OD1 (adding lilac `#B9A7FF` to the backend accent catalog) or OD2
  (adding a decorative scatter seed to `VisualState`) is required — both are
  separate ТЗ/backend edits; the frontend must not silently decide them.
