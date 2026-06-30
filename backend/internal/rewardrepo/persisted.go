package rewardrepo

import (
	"context"
	"database/sql"
	"errors"

	"taskcompanion/backend/internal/reward"
)

// PersistedCompletion rebuilds a completion result from durable rows without
// writing. Used for the idempotent repeat path (IsFresh=false). LevelRewards
// is empty: those items are owned by level, not task, and were already
// delivered. ProgressionBefore == ProgressionAfter: the "before" snapshot is
// not persisted; we only know the current authoritative state.
func (r *Repository) PersistedCompletion(ctx context.Context, userID, taskID string) (reward.Result, error) {
	var base, final int
	var taskMult, equip float64
	err := r.db.QueryRowContext(ctx,
		`SELECT base_xp, task_multiplier, equipment_xp_multiplier, final_xp
		 FROM task_xp_grants WHERE task_id = $1 AND user_id = $2`, taskID, userID).
		Scan(&base, &taskMult, &equip, &final)
	if errors.Is(err, sql.ErrNoRows) {
		return reward.Result{}, reward.ErrNotFound
	}
	if err != nil {
		return reward.Result{}, err
	}

	var drop reward.DropResult
	var rarity sql.NullString
	// ponytail: dropped item identity is not reconstructed here; the fresh path
	// owns Item. Rarity is enough for clients to render the persisted outcome.
	if err := r.db.QueryRowContext(ctx,
		`SELECT dropped_rarity FROM task_reward_rolls WHERE task_id = $1 AND user_id = $2`,
		taskID, userID).Scan(&rarity); err == nil && rarity.Valid && rarity.String != "" {
		drop = reward.DropResult{Dropped: true, Rarity: rarity.String}
	}

	var xpTotal int
	if err := r.db.QueryRowContext(ctx,
		`SELECT xp_total FROM progressions WHERE user_id = $1`, userID).Scan(&xpTotal); err != nil {
		return reward.Result{}, err
	}
	snap := reward.ProgressionSnapshotFor(xpTotal)

	return reward.Result{
		IsFresh:           false,
		LeveledUp:         false,
		XPGrant: reward.XPGrant{
			BaseXP: base, TaskMultiplier: taskMult,
			EquipmentMultiplier: equip, FinalXP: final,
		},
		ProgressionBefore: snap,
		ProgressionAfter:  snap,
		LevelRewards:      nil,
		Drop:              drop,
	}, nil
}
