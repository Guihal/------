# Packet P12: Mobile Rewards, Profile, Inventory, Settings

## Goal
Implement reward feedback, profile, mascot preview, inventory, equip, settings, and visual-state UI.

## Read First
- `docs/10-rebuild-technical-spec.md` § 7.6-7.11
- `docs/10-rebuild-technical-spec.md` § 13.1
- `docs/10-rebuild-technical-spec.md` § 14.2-14.5
- `docs/RULES.md`
- `docs/packets/README.md` § Архитектурный минимум для пакетов

## Scope In
- reward popup/compact feedback.
- profile screen.
- mascot preview.
- inventory screen with rarity/slot filters.
- equip/unequip UI.
- settings screen.
- notification settings UI for `notifications_enabled` and default reminder offset when P15 is active.
- visual-state application through CSS variables/Tailwind/SCSS.
- reduced motion behavior.

## Scope Out
- No client reward random.
- No item catalog admin.
- No native push delivery.
- No complex mascot editor.

## Requirements
- Reward popup displays backend payload only.
- No-drop uses compact feedback, not heavy popup.
- Level reward and task drop can both be shown in one flow.
- Inventory card shows rarity, slot, XP multiplier and source.
- Slot replacement is explicit in UI.
- Visual random changes tokens/texts only, never layout.
- Visual fallback uses safe dark palette without random.
- Reward feedback and action errors are announced through `aria-live` or status region.
- Equip/unequip/settings mutations are blocked offline with explicit Russian error; cached readonly state may still be shown.
- Rarity and status are not color-only; use text/icon labels too.
- Stores stay thin; reward/profile/inventory helpers only format readonly
  backend data.
- Do not add a class wrapper over Pinia as business logic.

## Acceptance
- completing task with reward payload shows `+N XP`, multiplier and item when present.
- no-drop payload does not open heavy item popup.
- profile shows level, XP progress, stats and mascot.
- inventory can equip/unequip via API.
- settings toggle visual randomness and reduced motion.
- settings expose notification toggles/default reminder offset after P15 backend is ready.
- offline equip/settings attempts do not enqueue fake mutations.
- `rg -n "Math.random|roll_value|final_xp" apps/mobile` finds no UI business logic.

## Escalation
- Stop if backend returns `roll_value` to client.
- Stop if visual-state payload has arbitrary unsafe colors.
- Stop if asset URLs are missing for required item display.
