# Admin panel — WCAG AA smoke checklist (P14)

Manual code review of `apps/admin/app/pages/*.vue` and
`apps/admin/app/components/{admin,ui}/*.vue` against RULES.md §5 and
10-rebuild-technical-spec.md §14.4. No browser run — static review only.

| Check | Result | Evidence |
|---|---|---|
| Reward/error feedback uses `aria-live` | PASS | `AdminTable.vue`, `pages/index.vue` errors use `role="alert" aria-live="assertive"`; pagination page count uses `aria-live="polite"` (`PaginationControls.vue`) |
| Loading/empty states announced | PASS | `role="status"` on loading/empty text in `AdminTable.vue`, `pages/index.vue`, `pages/items/[id]/edit.vue` |
| Status/rarity not color-only | PASS | `useAdminLabels.ts` renders text labels (`включен`/`отключен`, `обычный`/`редкий`/...) alongside any styling; no color-only indicators found |
| Session-expired banner announced | PASS | `pages/login.vue` uses `role="alert"` for the expired-session message |
| Form field errors linked to inputs | PASS | `FormField.vue`/`ItemForm.vue` set `aria-invalid` + `aria-describedby` pointing at `FieldError.vue` (`role="alert"`) |
| 44×44 minimum tap targets | PASS | Global `.tap { min-height: 44px }` (`assets/css/main.scss`) applied to all buttons, links, inputs, selects across pages/components |
| Focus visible | PASS | Global `:focus-visible { box-shadow: var(--ring) }` in `main.scss`; explicit focus styles on `FormField`/`SearchInput` inputs |
| Modal dialog a11y | PASS | `ConfirmDialog.vue`: `role="alertdialog"`, `aria-modal="true"`, `aria-label`, focus trap (Tab/Shift+Tab cycling), Escape closes, focus restored to trigger on close |
| Table semantics | PASS | `AdminTable.vue` uses `<caption class="sr-only">`, `scope="col"` headers in all three table pages (users/items/logs) |
| Labels on all inputs | PASS | Every `<input>/<select>/<textarea>` has an associated `<label for>` (`FormField`, `SearchInput`, `ItemsFilters`, `LogsFilters`, `ItemForm`) |
| Nav active state not color-only | PASS | `NuxtLink`/`vue-router` sets `aria-current="page"` on the active route automatically; `default.vue` color change is supplementary |
| Images have alt text | PASS | Item asset preview in `ItemForm.vue` has descriptive `:alt` |
| RU error microcopy matches spec §14.4 | PASS | `errors.ts` codeMessages, `auth.ts` `ROLE_DENIED`, store fallbacks all RU |
| Disabled state during submit | PASS | `AppButton` sets `:disabled="disabled || loading"` + `aria-busy`; forms disable submit while `saving`/`uploading` |

## Result

No violations found requiring a code fix. The admin panel already implements
the aria-live/status/non-color/tap-target/focus rules from RULES.md §5 and
spec §14.4 consistently across all pages and shared components.
