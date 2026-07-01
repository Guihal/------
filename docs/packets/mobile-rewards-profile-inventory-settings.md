# Packet P12: Mobile Rewards, Profile, Inventory, Settings

## Goal
Implement reward feedback, profile with mascot preview, inventory with rarity
presentation, equip/unequip, settings, and visual-state UI, carrying the
stronger magic layer (mascot central, rarity tokens/frame/glow, reward popup
from backend payload only).

## Read First
- `docs/10-rebuild-technical-spec.md` § 7.6-7.11
- `docs/10-rebuild-technical-spec.md` § 13.1
- `docs/10-rebuild-technical-spec.md` § 14.2-14.5
- `docs/visual-foundation.md` § 3, § 6, § 8, § 10, § 13
- `docs/RULES.md`
- `docs/packets/README.md` § Архитектурный минимум для пакетов

## Scope In
- reward popup/compact feedback.
- profile screen with mascot as the central visual element.
- mascot preview.
- inventory screen with rarity/slot filters.
- equip/unequip UI.
- settings screen.
- notification settings UI for `notifications_enabled` and default reminder
  offset when P15 is active.
- visual-state application through CSS variables/Tailwind/SCSS via the P09-1
  mapper.
- reduced motion behavior.
- stronger decorative magic on profile, inventory, and P12's OWN empty states
  (profile-empty, inventory-empty) — NOT the task-list empty state (that is
  P11).
- rarity tokens + optional magic frame/glow on inventory item cards.

## Scope Out
- No client reward random.
- No item catalog admin.
- No native push delivery.
- No complex mascot editor.
- No task-list empty state (that is P11).
- No component-side `Math.random()` for visual placement or accent.
- No change to layout from visual random.

## Requirements
- Reward popup displays backend payload only; magic-vibes (glow/animation) fire
  ONLY for a fresh backend completion event, never for cached or replayed
  payloads.
- No-drop uses compact feedback, not a heavy popup.
- Level reward and task drop can both be shown in one flow.
- Inventory card shows rarity, slot, XP multiplier and source.
- Item cards show text rarity labels (mandatory); colored glow/frame is
  optional and secondary, never the only rarity signal.
- Slot replacement is explicit in UI.
- Visual random changes tokens/texts only, never layout.
- Visual fallback uses safe dark palette without random.
- Reward feedback and action errors are announced through `aria-live` or a
  status region.
- Equip/unequip/settings mutations are blocked offline with explicit Russian
  error; cached readonly state may still be shown.
- Rarity and status are not color-only; use text/icon labels too.
- Stores stay thin; reward/profile/inventory helpers only format readonly
  backend data.
- Do not add a class wrapper over Pinia as business logic.
- Profile screen uses the mascot as the central visual element and applies the
  backend `profile_background` variant from `VisualState`.
- Inventory items use rarity tokens and an optional magic frame/glow whose
  strength is greater than on the task list but still non-blocking.
- Decorative SVG can be stronger on profile/inventory/empty states than on the
  task list, but must not reduce readability.
- Consume the shared `VisualBackground` and `Logo` components from P09-1; do
  not roll a separate background/logo for these screens.
- Consume backend-owned UI text from `VisualState`: `level_up_text` for the
  level-up moment and `empty_state_text` for P12's own empty states.
- No `Math.random()` in the mobile app for visual placement or accent.

## Acceptance
- completing task with reward payload shows `+N XP`, multiplier and item when
  present.
- no-drop payload does not open heavy item popup.
- profile shows level, XP progress, stats and mascot as the central visual.
- inventory can equip/unequip via API.
- settings toggle visual randomness and reduced motion.
- settings expose notification toggles/default reminder offset after P15 backend
  is ready.
- offline equip/settings attempts do not enqueue fake mutations.
- item cards show text rarity labels, not glow only.
- reward popup fires magic-vibes only on a fresh backend completion event.
- profile applies the backend `profile_background` variant.
- `rg -n "Math.random|roll_value|final_xp" apps/mobile` finds no UI business
  logic.

## Escalation
- Stop if backend returns `roll_value` to client.
- Stop if visual-state payload has arbitrary unsafe colors.
- Stop if asset URLs are missing for required item display.
- Stop if `level_up_text`/`empty_state_text`/`profile_background` are not
  present in the `VisualState` contract.
