package httpserver

import (
	"context"
	"database/sql"
	"net/http"
	"testing"

	"taskcompanion/backend/internal/reward"
	"taskcompanion/backend/internal/rewardrepo"
)

// seedCatalogItems inserts one active catalog item per rarity so grantCatalogItem
// has something to grant. The migration-only test DB has no seed rows.
func seedCatalogItems(t *testing.T, db *sql.DB) {
	t.Helper()
	for _, r := range []string{"common", "rare", "epic", "legendary"} {
		if _, err := db.Exec(
			`INSERT INTO inventory_items (name, description, rarity, slot_key, asset_url, base_xp_multiplier, active)
			 VALUES ($1, 'test', $2, 'hand', '/assets/x.png', 1.05, true)
			 ON CONFLICT (name) DO NOTHING`,
			"Test "+r, r); err != nil {
			t.Fatalf("seed catalog %s: %v", r, err)
		}
	}
}

func TestCompleteAlwaysLogsRoll(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	user := registerUser(t, server, "complete-roll@example.test")
	taskID := createTaskID(t, server, user.AccessToken)

	doJSON(t, server, http.MethodPost, "/tasks/"+taskID+"/complete", nil, user.AccessToken)
	if c := countRows(t, db, `SELECT count(*) FROM task_reward_rolls WHERE task_id=$1`, taskID); c != 1 {
		t.Fatalf("expected 1 roll row, got %d", c)
	}
	if c := countRows(t, db,
		`SELECT count(*) FROM audit_logs WHERE user_id=$1 AND action='reward.roll'`, user.User.ID); c != 1 {
		t.Fatalf("expected 1 reward.roll audit, got %d", c)
	}
}

func TestCompleteLevelJumpGrantsMilestone(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	user := registerUser(t, server, "complete-level@example.test")
	taskID := createTaskID(t, server, user.AccessToken)
	seedCatalogItems(t, db)
	// Level 5 starts at xp_total=4000; seed just below so a medium task (+200) crosses it.
	if _, err := db.Exec(
		`UPDATE progressions SET xp_total=3999, level=4 WHERE user_id=$1`, user.User.ID); err != nil {
		t.Fatalf("seed progression: %v", err)
	}

	resp := doJSON(t, server, http.MethodPost, "/tasks/"+taskID+"/complete", nil, user.AccessToken)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected complete 200, got %d: %s", resp.Code, resp.Body.String())
	}
	payload := decodeBody[reward.CompletionPayload](t, resp)
	found5 := false
	for _, lr := range payload.LevelRewards {
		if lr.Level == 5 {
			found5 = true
		}
		if lr.Item.Rarity != "legendary" {
			t.Fatalf("milestone item rarity=%q, want legendary", lr.Item.Rarity)
		}
	}
	if !found5 {
		t.Fatalf("expected level-5 milestone reward, got %+v", payload.LevelRewards)
	}
	lrCount := countRows(t, db, `SELECT count(*) FROM level_rewards WHERE user_id=$1`, user.User.ID)
	if lrCount != 1 {
		t.Fatalf("expected 1 level_rewards row, got %d", lrCount)
	}
	doJSON(t, server, http.MethodPost, "/tasks/"+taskID+"/complete", nil, user.AccessToken)
	if c := countRows(t, db, `SELECT count(*) FROM level_rewards WHERE user_id=$1`, user.User.ID); c != lrCount {
		t.Fatalf("level reward duplicated on repeat: %d -> %d", lrCount, c)
	}
}

// TestDropRarityMatchesGrantedItem exercises CompleteTx directly with a
// deterministic plan (rarity pre-resolved), proving the granted item's rarity
// equals the rolled rarity. Bypasses service RNG.
func TestDropRarityMatchesGrantedItem(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	user := registerUser(t, server, "drop-rarity@example.test")
	taskID := createTaskID(t, server, user.AccessToken)
	seedCatalogItems(t, db)

	repo := rewardrepo.New(db)
	plan := reward.Plan{
		BaseXP: 100, TaskMultiplier: 1.0, EquipmentMultiplier: 1.0, FinalXP: 100,
		DropMultiplier: 1.0, DropRoll: 0.0, DropRarity: "legendary",
	}
	res, err := repo.CompleteTx(context.Background(), user.User.ID, taskID, plan)
	if err != nil {
		t.Fatalf("CompleteTx: %v", err)
	}
	if !res.Drop.Dropped || res.Drop.Rarity != "legendary" || res.Drop.Item == nil {
		t.Fatalf("expected legendary drop, got %+v", res.Drop)
	}
	if res.Drop.Item.Rarity != "legendary" {
		t.Fatalf("granted item rarity=%q, want legendary", res.Drop.Item.Rarity)
	}
}
