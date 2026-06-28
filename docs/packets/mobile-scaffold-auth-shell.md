# Packet P10: Mobile Scaffold, Auth Shell, Navigation

## Goal
Create the Nuxt 4 + Capacitor mobile shell with auth gate, header, bottom nav, and session UX.

## Read First
- `docs/10-rebuild-technical-spec.md` § 9.2-9.3
- `docs/10-rebuild-technical-spec.md` § 9.7
- `docs/10-rebuild-technical-spec.md` § 14.1-14.2
- `docs/RULES.md`
- `docs/packets/README.md` § Архитектурный минимум для пакетов

## Scope In
- Nuxt 4 + Vue 3 + TypeScript mobile app scaffold in `apps/mobile`.
- Capacitor config for Android.
- Pinia setup.
- Tailwind + SCSS.
- auth gate.
- login/register screens.
- bottom nav: `Задачи`, `Инвентарь`, `Профиль`, `Настройки`.
- compact main header contract.
- safe area handling.

## Scope Out
- No task CRUD UI.
- No reward popup.
- No inventory implementation.
- No admin UI.

## Requirements
- UI is dark, Russian, mobile-first.
- Use local bundled font files or system stack; no Google Fonts CDN dependency.
- Header shows greeting, level and XP progress placeholder once data exists.
- Bottom nav fixed and respects safe area.
- Access token kept in memory runtime.
- Refresh token is stored through Capacitor secure/platform storage where available; never plain localStorage.
- If secure storage fallback is unavailable, document the fallback and keep it scoped to development unless ТЗ is updated.
- Expired session refreshes once, then redirects to login.
- No local SQLite source of truth.
- Interactive controls have accessible Russian labels, visible focus, and at least 44px tap targets where practical.
- Auth stores stay thin: state/loading/error/actions around the shared API client.
- Session bootstrap must not make local storage the business authority.

## Acceptance
- `cd apps/mobile && npm/bun run typecheck` passes after scaffold scripts are fixed.
- `cd apps/mobile && npm/bun run build` passes.
- `cd apps/mobile && npx/bunx cap sync android` passes when dependencies are installed.
- login/register/auth gate screens render at 320px without horizontal scroll.
- keyboard focus is visible on auth fields, buttons, header actions, and bottom nav.
- `rg -n "React|Vuex|SQLite|schema_migrations" apps/mobile` returns no current implementation dependency.
- `rg -n "fonts.googleapis|fonts.gstatic" apps/mobile` returns no CDN font dependency.

## Escalation
- Stop if Capacitor setup requires changing mandatory Nuxt stack.
- Stop if token storage fallback is unclear.
- Stop if Android safe area conflicts with layout.
