package rewardrepo

import (
	"context"
	"database/sql"
	"errors"

	"taskcompanion/backend/internal/reward"
)

// CompleteTx runs the atomic complete-task transaction.
// Order: lock task → idempotency guard → grant → update progression →
// level rewards → drop + roll row → mark completed → audit → commit.
// Concurrency: SELECT ... FOR UPDATE on task + progression; UNIQUE(task_id)
// on task_xp_grants is the DB backstop if two txns race past the service check.
func (r *Repository) CompleteTx(ctx context.Context, userID, taskID string, plan reward.Plan) (reward.Result, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return reward.Result{}, err
	}
	defer tx.Rollback() // no-op after Commit

	var status string
	err = tx.QueryRowContext(ctx,
		`SELECT status FROM tasks WHERE id = $1 AND user_id = $2 FOR UPDATE`, taskID, userID).
		Scan(&status)
	if errors.Is(err, sql.ErrNoRows) {
		return reward.Result{}, reward.ErrNotFound
	}
	if err != nil {
		return reward.Result{}, err
	}
	// Another tx completed this task between the service pre-check and our lock.
	// Serve the persisted payload (IsFresh=false), no reroll, no new writes.
	// Roll back first so the task row lock is released before the read path runs
	// on a separate connection.
	if status == "completed" {
		_ = tx.Rollback()
		return r.PersistedCompletion(ctx, userID, taskID)
	}

	var oldXPTotal, oldLevel int
	if err := tx.QueryRowContext(ctx,
		`SELECT xp_total, level FROM progressions WHERE user_id = $1 FOR UPDATE`, userID).
		Scan(&oldXPTotal, &oldLevel); err != nil {
		return reward.Result{}, err
	}
	before := reward.ProgressionSnapshotFor(oldXPTotal)

	grantRes, err := tx.ExecContext(ctx,
		`INSERT INTO task_xp_grants (user_id, task_id, base_xp, task_multiplier, equipment_xp_multiplier, final_xp)
		 VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (task_id) DO NOTHING`,
		userID, taskID, plan.BaseXP, plan.TaskMultiplier, plan.EquipmentMultiplier, plan.FinalXP)
	if err != nil {
		return reward.Result{}, err
	}
	if affected, _ := grantRes.RowsAffected(); affected == 0 {
		// Lost the race: a grant for this task already exists. Release the task
		// + progression locks before serving the persisted read on r.db.
		_ = tx.Rollback()
		return r.PersistedCompletion(ctx, userID, taskID)
	}

	newXPTotal := oldXPTotal + plan.FinalXP
	newLevel := reward.LevelForXP(newXPTotal)
	if _, err := tx.ExecContext(ctx,
		`UPDATE progressions SET xp_total = $2, level = $3, updated_at = now() WHERE user_id = $1`,
		userID, newXPTotal, newLevel); err != nil {
		return reward.Result{}, err
	}
	after := reward.ProgressionSnapshotFor(newXPTotal)

	levelRewards, err := insertLevelRewards(ctx, tx, userID, taskID, oldLevel, newLevel)
	if err != nil {
		return reward.Result{}, err
	}

	dropView, err := insertDrop(ctx, tx, userID, taskID, plan.DropRarity)
	if err != nil {
		return reward.Result{}, err
	}
	var dropItemID any
	if dropView != nil {
		dropItemID = dropView.ID
	}
	if _, err := tx.ExecContext(ctx,
		`INSERT INTO task_reward_rolls
		   (user_id, task_id, base_xp, task_multiplier, equipment_xp_multiplier, final_xp,
		    drop_multiplier, roll_value, dropped_rarity, user_inventory_item_id)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		userID, taskID, plan.BaseXP, plan.TaskMultiplier, plan.EquipmentMultiplier, plan.FinalXP,
		plan.DropMultiplier, plan.DropRoll, nullableRarity(plan.DropRarity), dropItemID); err != nil {
		return reward.Result{}, err
	}

	if _, err := tx.ExecContext(ctx,
		`UPDATE tasks SET status = 'completed', completed_at = now(), updated_at = now()
		 WHERE id = $1 AND user_id = $2`, taskID, userID); err != nil {
		return reward.Result{}, err
	}
	if _, err := tx.ExecContext(ctx,
		`INSERT INTO audit_logs (user_id, action, details_json) VALUES ($1, 'reward.complete', $2::jsonb)`,
		userID, completionAuditDetails(taskID, plan.FinalXP)); err != nil {
		return reward.Result{}, err
	}
	if _, err := tx.ExecContext(ctx,
		`INSERT INTO audit_logs (user_id, action, details_json) VALUES ($1, 'reward.roll', $2::jsonb)`,
		userID, rollAuditDetails(taskID, plan.DropRarity, plan.DropRarity != "")); err != nil {
		return reward.Result{}, err
	}

	if err := tx.Commit(); err != nil {
		return reward.Result{}, err
	}

	return reward.Result{
		IsFresh:   true,
		LeveledUp: newLevel > oldLevel,
		XPGrant: reward.XPGrant{
			BaseXP: plan.BaseXP, TaskMultiplier: plan.TaskMultiplier,
			EquipmentMultiplier: plan.EquipmentMultiplier, FinalXP: plan.FinalXP,
		},
		ProgressionBefore: before,
		ProgressionAfter:  after,
		LevelRewards:      levelRewards,
		Drop: reward.DropResult{
			Dropped: plan.DropRarity != "", Rarity: plan.DropRarity, Item: dropView,
		},
	}, nil
}

func nullableRarity(r string) any {
	if r == "" {
		return nil
	}
	return r
}
