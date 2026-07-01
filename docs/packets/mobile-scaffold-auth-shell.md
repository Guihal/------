# Packet P10: Mobile Scaffold, Auth Shell, Navigation

## Goal
Create the Nuxt 4 + Capacitor mobile shell with auth gate, branded auth
screens, header, bottom nav, and session UX, as the first carrier of the Task
Companion visual identity.

## Read First
- `docs/10-rebuild-technical-spec.md` § 9.2-9.3
- `docs/10-rebuild-technical-spec.md` § 9.7
- `docs/10-rebuild-technical-spec.md` § 14.1-14.2
- `docs/visual-foundation.md` § 3-§9
- `docs/RULES.md`
- `docs/packets/README.md` § Архитектурный минимум для пакетов

## Scope In
- Nuxt 4 + Vue 3 + TypeScript mobile app scaffold in `apps/mobile`.
- Capacitor config for Android.
- Pinia setup.
- Tailwind + SCSS consuming the P09-1 visual tokens.
- auth gate.
- branded login/register screens using the shared `Logo` component (PNG mask)
  and shared `VisualBackground` component (one common app background, local
  SVG masks, invariant scatter, low-opacity, non-blocking).
- translucent auth card containing the form, with scrim/blur backing so input
  readability survives over the decorative background.
- translucent header and bottom-nav surfaces (token-backed scrim) over the
  common background.
- bottom nav: `Задачи`, `Инвентарь`, `Профиль`, `Настройки`.
- compact main header contract.
- safe area handling.
- reduced-motion path: `@media (prefers-reduced-motion)` disables non-essential
  glow/transition effects.

## Scope Out
- No task CRUD UI.
- No reward popup.
- No inventory implementation.
- No admin UI.
- No `TC` placeholder logo.
- No generic SaaS gradient button that does not use approved visual tokens.

## Requirements
- UI is dark, Russian, mobile-first, and carries the Task Companion identity
  (chubzik logo mark, magic background, translucent surfaces), not a generic
  Nuxt/Tailwind form.
- Use local bundled font files or system stack; no Google Fonts CDN dependency.
- Header shows greeting, level and XP progress placeholder once data exists.
- Header and bottom nav are translucent surfaces with sufficient backing for
  contrast; they sit over the common `VisualBackground`.
- Bottom nav is fixed and respects safe area.
- Access token is kept in memory runtime.
- Refresh token is stored through Capacitor secure/platform storage where
  available; never plain `localStorage`.
- If secure storage fallback is unavailable, document the fallback and keep it
  scoped to development unless ТЗ is updated.
- Expired session refreshes once, then redirects to login.
- No local SQLite source of truth.
- Interactive controls have accessible Russian labels, visible focus, and at
  least 44px tap targets where practical.
- Auth inputs are visibly rendered on the dark background (real input field,
  visible border/fill, visible focus-ring); no transparent/borderless inputs.
- Auth stores stay thin: state/loading/error/actions around the shared API
  client.
- Session bootstrap must not make local storage the business authority.
- Components consume visual variables (tokens), not hard-coded arbitrary
  colors; `--accent` comes from `VisualState.accent_color` via the P09-1
  mapper, `--magic` is a fixed brand token.
- Decorative background never blocks form readability or input.
- No `Math.random()` in the mobile app for visual placement or accent.

## Acceptance
- `cd apps/mobile && npm/bun run typecheck` passes after scaffold scripts are
  fixed.
- `cd apps/mobile && npm/bun run build` passes.
- `cd apps/mobile && npx/bunx cap sync android` passes when dependencies are
  installed.
- login/register/auth gate screens render at 320px without horizontal scroll.
- keyboard focus is visible on auth fields, buttons, header actions, and bottom
  nav.
- login/register screens show the Task Companion brand identity (logo mask +
  magic background + translucent auth card), not a `TC` text placeholder.
- auth screens use local logo/SVG assets from the P09-1 brand asset registry.
- decorative background does not block form readability or inputs.
- header and bottom nav render as translucent surfaces with readable content.
- reduced-motion path exists and disables non-essential glow/transition.
- `rg -n "React|Vuex|SQLite|schema_migrations" apps/mobile` returns no current
  implementation dependency.
- `rg -n "fonts.googleapis|fonts.gstatic" apps/mobile` returns no CDN font
  dependency.
- `rg -n "Math.random" apps/mobile` returns no visual-random usage.
- `rg -n "\\bTC\\b" apps/mobile` is reviewed so no generic `TC` logo placeholder
  survives (matches in unrelated identifiers are allowed if explained).

## Escalation
- Stop if Capacitor setup requires changing mandatory Nuxt stack.
- Stop if token storage fallback is unclear.
- Stop if Android safe area conflicts with layout.
- Stop if brand assets from P09-1 are missing or cannot be rendered as a CSS
  mask.
