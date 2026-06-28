# Packet P07: Inventory, Mascot, Equip

## Goal
Implement inventory, mascot, equipment slots, equip, and unequip APIs.

## Read First
- `docs/10-rebuild-technical-spec.md` § 7.6-7.7
- `docs/10-rebuild-technical-spec.md` § 12.6
- `docs/10-rebuild-technical-spec.md` § 14.2 Инвентарь
- `docs/RULES.md`
- `docs/packets/README.md` § Архитектурный минимум для пакетов

## Scope In
- `GET /inventory`
- `POST /inventory/:userInventoryItemId/equip`
- `POST /inventory/:userInventoryItemId/unequip`
- active mascot data.
- equipped items.
- ownership and slot compatibility checks.

## Scope Out
- No item catalog admin UI.
- No reward generation logic.
- No frontend inventory screen.
- No complex mascot editor.

## Requirements
- User can equip only owned item.
- Base item slot must match requested mascot slot.
- One item per user slot.
- Equipping new item replaces previous item in slot.
- Equip/unequip writes audit event.
- Existing granted items must remain valid if catalog item is disabled later.
- Active mascot response includes `mascot_slots.anchor_json` for frontend placement.
- Equip and unequip are backend service/usecase operations because ownership and
  slot invariants are checked there.

## Acceptance
- `cd backend && go test ./...` passes inventory/equip tests.
- user cannot equip another user's item.
- wrong slot equip is rejected.
- occupied slot replacement works.
- unequip removes only current user's equipped item.
- active mascot/slot API returns slot key, item compatibility data, and `anchor_json`.
- OpenAPI documents inventory item and equip response schemas.

## Escalation
- Stop if mascot slots are hard-coded in frontend-only shape.
- Stop if ownership cannot be proven in DB/use case.
- Stop if disabled catalog items would break existing inventory.
