# Packet P06: Rewards Engine

## Goal
Implement the atomic complete-task transaction with server-owned XP, level rewards, drops, visual events, and reward audit.

## Read First
- `docs/10-rebuild-technical-spec.md` § 7.8
- `docs/10-rebuild-technical-spec.md` § 11.3
- `docs/10-rebuild-technical-spec.md` § 12.4
- `docs/10-rebuild-technical-spec.md` § 13.1
- `docs/RULES.md`
- `docs/packets/README.md` § Архитектурный минимум для пакетов

## Scope In
- `POST /tasks/:id/complete`.
- task status update to `completed`.
- `task_xp_grants` creation.
- task multiplier roll.
- equipment XP multiplier application.
- level rewards on levels divisible by 5.
- task drop chance from final XP.
- `task_reward_rolls` audit for drop and no-drop.
- `audit_logs` events for task completion, reward roll, and level reward.
- transaction integration across task, XP grant, progression, rewards, drop audit, and visual state.
- deterministic tests with injectable RNG.

## Scope Out
- No frontend popup.
- No admin item CRUD.
- No visual item rendering.
- No client random.

## Requirements
- Task multiplier distribution:
  - `1.00 = 70%`
  - `1.25 = 20%`
  - `1.50 = 8%`
  - `2.00 = 2%`
- Equipment multiplier = product of equipped item multipliers clamped to `1.0..2.0`.
- Equipment multiplier reads `equipped_items` from P02 schema; P07 later adds inventory/equip APIs.
- Drop constants:
  - `DROP_XP_UNIT = 300`
  - `DROP_DIFFICULTY = 1.25`
  - `DROP_MULTIPLIER_MIN = 0.5`
  - `DROP_MULTIPLIER_MAX = 2.5`
- Base drop thresholds: common `0.22`, rare `0.07`, epic `0.02`, legendary `0.004`.
- Drop chance caps: common `0.45`, rare `0.18`, epic `0.06`, legendary `0.015`.
- Item `xp_multiplier` ranges: common `1.02..1.08`, rare `1.08..1.16`, epic `1.16..1.28`, legendary `1.28..1.45`.
- Level reward is created once per `user_id + level`.
- Level jump checks every reached level from old level + 1 through new level.
- Task drop roll is created once per task.
- No-drop still creates `task_reward_rolls` and structured `audit_logs` event.
- Client never sees `roll_value`.
- Completion transaction locks task row and prevents concurrent double grant.
- Completion payload returns authoritative XP/progression/reward/drop summary and refreshed `visual_state`.
- `task-completed` and `level-up` visual events are created server-side.
- Completion payload includes `is_fresh_completion_event: boolean` or equivalent marker.
- Repeated complete returns persisted completion payload without fresh roll and with fresh-event marker false.
- `completeTask` is a backend usecase/service transaction.
- Frontend has no XP, reward or random authority in this packet.

## Acceptance
- `cd backend && go test ./...` passes reward tests.
- `POST /tasks/:id/complete` is documented in OpenAPI.
- repeated complete does not reroll.
- concurrent complete does not double-grant XP/reward.
- no-drop creates `task_reward_rolls`.
- audit log contains task completion, reward roll, and level reward events where applicable.
- level jump creates each missing level reward once.
- drop rarity and granted item rarity match.
- completion response includes refreshed visual state when visual palette/text changed.
- OpenAPI completion response excludes `roll_value`.

## Escalation
- Stop if RNG cannot be deterministic in tests.
- Stop if item catalog has no item for a dropped rarity.
- Stop if complete transaction cannot be made atomic.
