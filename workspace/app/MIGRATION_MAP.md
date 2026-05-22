# Migration Map: React → Nuxt 3 + Capacitor 7

## What was migrated

The old mobile app was a Capacitor 6 scaffold at `android/` (root) with no frontend source — just a native Android shell pointing to a remote web app. The new app is a self-contained Nuxt 3.14 + Capacitor 7 scaffold at `workspace/app/`.

## File mappings

| Old location | New location | Notes |
|--------------|--------------|-------|
| `android/` (root) | `workspace/app/android/` | Capacitor 7 Android project, regenerated with `npx cap add android` |
| — | `workspace/app/app/` | Nuxt source dir (pages, layouts, stores, composables) |
| — | `workspace/app/app/pages/index.vue` | Landing page |
| — | `workspace/app/app/pages/login.vue` | Login page |
| — | `workspace/app/app/pages/tasks.vue` | Task list + CRUD |
| — | `workspace/app/app/layouts/default.vue` | App shell with header + logout |
| — | `workspace/app/app/stores/auth.ts` | Pinia auth store using `access_token` |
| — | `workspace/app/app/composables/useApi.ts` | API client injecting `Authorization: Bearer` |
| — | `workspace/app/app/middleware/auth.ts` | Route guard redirecting to `/login` |
| — | `workspace/app/app/plugins/init.ts` | Hydrates auth store from `localStorage` |
| — | `workspace/app/nuxt.config.ts` | Nuxt config with `@pinia/nuxt`, Tailwind |
| — | `workspace/app/capacitor.config.ts` | Capacitor 7 config, `webDir: 'dist'` |
| — | `workspace/app/package.json` | Nuxt 3.14, Capacitor 7, Pinia, Tailwind |

## Capacitor integration

- `nuxt.config.ts` builds to `.output/public` (default)
- `capacitor.config.ts` sets `webDir: 'dist'` — run `nuxt generate` then `npx cap sync` to copy web assets into `android/app/src/main/assets/public`
- Android package ID kept as `com.taskcompanion.app` (matching old app)

## Server contract compatibility

The API client (`useApi`) and auth store use the server's existing format:
- Login response: `{ access_token, refresh_token, token_type, expires_in, user }`
- Task list response: `{ tasks }`
- Task create response: `{ task }`
- Auth header: `Authorization: Bearer <access_token>`
