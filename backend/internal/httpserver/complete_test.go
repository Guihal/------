package httpserver

import (
	"net/http"
	"strings"
	"sync"
	"testing"

	"taskcompanion/backend/internal/reward"
	"taskcompanion/backend/internal/task"
)

// createTaskID creates a default medium task and returns its id.
func createTaskID(t *testing.T, server *http.Server, token string) string {
	t.Helper()
	resp := doJSON(t, server, http.MethodPost, "/tasks", map[string]any{"title": "to complete"}, token)
	if resp.Code != http.StatusCreated {
		t.Fatalf("task create failed: %d %s", resp.Code, resp.Body.String())
	}
	return decodeBody[task.Task](t, resp).ID
}

// seedCatalogItems lives in complete_outcome_test.go (used by the drop test).

func TestCompleteFreshGrantsXP(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	user := registerUser(t, server, "complete-fresh@example.test")
	taskID := createTaskID(t, server, user.AccessToken)

	resp := doJSON(t, server, http.MethodPost, "/tasks/"+taskID+"/complete", nil, user.AccessToken)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.Code, resp.Body.String())
	}
	payload := decodeBody[reward.CompletionPayload](t, resp)
	if !payload.IsFreshCompletionEvent {
		t.Fatal("expected is_fresh=true")
	}
	if payload.ProgressionAfter.XPTotal <= payload.ProgressionBefore.XPTotal {
		t.Fatalf("xp did not advance: before=%d after=%d",
			payload.ProgressionBefore.XPTotal, payload.ProgressionAfter.XPTotal)
	}
	if strings.Contains(resp.Body.String(), "roll_value") {
		t.Fatal("response body leaked roll_value")
	}
}

func TestCompleteRepeatIsIdempotent(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	user := registerUser(t, server, "complete-repeat@example.test")
	taskID := createTaskID(t, server, user.AccessToken)

	doJSON(t, server, http.MethodPost, "/tasks/"+taskID+"/complete", nil, user.AccessToken)
	grantsBefore := countRows(t, db, `SELECT count(*) FROM task_xp_grants WHERE task_id=$1`, taskID)
	rollsBefore := countRows(t, db, `SELECT count(*) FROM task_reward_rolls WHERE task_id=$1`, taskID)

	resp := doJSON(t, server, http.MethodPost, "/tasks/"+taskID+"/complete", nil, user.AccessToken)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected repeat 200, got %d", resp.Code)
	}
	if decodeBody[reward.CompletionPayload](t, resp).IsFreshCompletionEvent {
		t.Fatal("expected is_fresh=false on repeat")
	}
	if c := countRows(t, db, `SELECT count(*) FROM task_xp_grants WHERE task_id=$1`, taskID); c != grantsBefore {
		t.Fatalf("grants row duplicated: %d -> %d", grantsBefore, c)
	}
	if c := countRows(t, db, `SELECT count(*) FROM task_reward_rolls WHERE task_id=$1`, taskID); c != rollsBefore {
		t.Fatalf("rolls row duplicated: %d -> %d", rollsBefore, c)
	}
}

func TestCompleteConcurrentNoDoubleGrant(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	user := registerUser(t, server, "complete-concurrent@example.test")
	taskID := createTaskID(t, server, user.AccessToken)

	var wg sync.WaitGroup
	codes := make([]int, 2)
	for i := 0; i < 2; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			codes[idx] = doJSON(t, server, http.MethodPost, "/tasks/"+taskID+"/complete", nil, user.AccessToken).Code
		}(i)
	}
	wg.Wait()
	for _, c := range codes {
		if c != http.StatusOK {
			t.Fatalf("expected both 200, got %v", codes)
		}
	}
	if c := countRows(t, db, `SELECT count(*) FROM task_xp_grants WHERE task_id=$1`, taskID); c != 1 {
		t.Fatalf("expected exactly 1 grant row, got %d", c)
	}
	if c := countRows(t, db, `SELECT count(*) FROM task_reward_rolls WHERE task_id=$1`, taskID); c != 1 {
		t.Fatalf("expected exactly 1 roll row, got %d", c)
	}
}
