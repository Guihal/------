package httpserver

import (
	"net/http"
	"testing"
	"time"

	"taskcompanion/backend/internal/task"
)

func TestTaskCreateWithTitleOnlyAndCategories(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	user := registerUser(t, server, "task-create@example.test")

	cats := decodeBody[struct {
		Items []task.TaskCategory `json:"items"`
	}](t, doJSON(t, server, http.MethodGet, "/task-categories", nil, user.AccessToken))
	if catsResp := cats.Items; len(catsResp) != 4 {
		t.Fatalf("expected 4 system categories, got %d", len(catsResp))
	}
	if cats.Items[0].Title != "Учеба" && cats.Items[len(cats.Items)-1].Title != "общее" {
		// ordering: is_system DESC then title ASC; общее sorts among system by title
	}

	create := doJSON(t, server, http.MethodPost, "/tasks", map[string]any{"title": "My first task"}, user.AccessToken)
	if create.Code != http.StatusCreated {
		t.Fatalf("expected task create 201, got %d: %s", create.Code, create.Body.String())
	}
	created := decodeBody[task.Task](t, create)
	if created.CategoryID == nil || created.Status != "active" || created.Priority != "normal" || created.Complexity != "medium" {
		t.Fatalf("unexpected task defaults: %+v", created)
	}
}

func TestTaskOwnership(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	owner := registerUser(t, server, "owner@example.test")
	other := registerUser(t, server, "other@example.test")

	create := doJSON(t, server, http.MethodPost, "/tasks", map[string]any{"title": "Secret task"}, owner.AccessToken)
	if create.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", create.Code)
	}
	id := decodeBody[task.Task](t, create).ID

	for _, tc := range []struct {
		name   string
		method string
		path   string
		body   any
	}{
		{"get", http.MethodGet, "/tasks/" + id, nil},
		{"patch", http.MethodPatch, "/tasks/" + id, map[string]any{"title": "hijacked"}},
		{"archive", http.MethodPost, "/tasks/"+id+"/archive", nil},
	} {
		resp := doJSON(t, server, tc.method, tc.path, tc.body, other.AccessToken)
		if resp.Code != http.StatusNotFound {
			t.Fatalf("%s: expected 404 for other user, got %d", tc.name, resp.Code)
		}
	}
	// owner can still access
	own := doJSON(t, server, http.MethodGet, "/tasks/"+id, nil, owner.AccessToken)
	if own.Code != http.StatusOK {
		t.Fatalf("owner expected 200, got %d", own.Code)
	}
}

func TestTaskListOverdueSort(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	user := registerUser(t, server, "sort@example.test")

	past := time.Now().Add(-time.Hour).UTC().Format(time.RFC3339)
	future := time.Now().Add(time.Hour).UTC().Format(time.RFC3339)
	doJSON(t, server, http.MethodPost, "/tasks", map[string]any{"title": "no deadline"}, user.AccessToken)
	doJSON(t, server, http.MethodPost, "/tasks", map[string]any{"title": "future", "deadline_at": future}, user.AccessToken)
	overdueCreate := doJSON(t, server, http.MethodPost, "/tasks", map[string]any{"title": "overdue", "deadline_at": past}, user.AccessToken)
	if overdueCreate.Code != http.StatusCreated {
		t.Fatalf("expected overdue create 201, got %d", overdueCreate.Code)
	}

	list := decodeBody[task.ListResult](t, doJSON(t, server, http.MethodGet, "/tasks", nil, user.AccessToken))
	if len(list.Items) != 3 {
		t.Fatalf("expected 3 tasks, got %d", len(list.Items))
	}
	if list.Items[0].Title != "overdue" || !list.Items[0].Overdue {
		t.Fatalf("expected overdue task first, got %+v", list.Items[0])
	}
}

func TestTaskArchiveRemovesFromActiveList(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	user := registerUser(t, server, "archive@example.test")

	id := decodeBody[task.Task](t, doJSON(t, server, http.MethodPost, "/tasks", map[string]any{"title": "to archive"}, user.AccessToken)).ID
	arch := doJSON(t, server, http.MethodPost, "/tasks/"+id+"/archive", nil, user.AccessToken)
	if arch.Code != http.StatusOK {
		t.Fatalf("expected archive 200, got %d", arch.Code)
	}
	if decodeBody[task.Task](t, arch).Status != "archived" {
		t.Fatal("expected archived status")
	}
	active := decodeBody[task.ListResult](t, doJSON(t, server, http.MethodGet, "/tasks", nil, user.AccessToken))
	if active.Total != 0 {
		t.Fatalf("expected 0 active after archive, got %d", active.Total)
	}
	archived := decodeBody[task.ListResult](t, doJSON(t, server, http.MethodGet, "/tasks?status=archived", nil, user.AccessToken))
	if archived.Total != 1 {
		t.Fatalf("expected 1 archived, got %d", archived.Total)
	}
}

func TestTaskCreateIgnoresClientControlledFields(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	user := registerUser(t, server, "xp@example.test")

	// Client tries to send final_xp, level, status, completed_at — must be ignored/rejected, never persisted.
	resp := doJSON(t, server, http.MethodPost, "/tasks", map[string]any{
		"title": "xp cheat", "final_xp": 9999, "level": 50, "status": "completed", "completed_at": "2026-01-01T00:00:00Z",
	}, user.AccessToken)
	if resp.Code != http.StatusCreated {
		t.Fatalf("expected 201 (extra fields ignored by struct), got %d: %s", resp.Code, resp.Body.String())
	}
	created := decodeBody[task.Task](t, resp)
	if created.Status != "active" || created.CompletedAt != nil {
		t.Fatalf("client set status/completed_at: %+v", created)
	}
}

func TestTaskCreateCategoryOwnership(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	owner := registerUser(t, server, "cat-owner@example.test")
	other := registerUser(t, server, "cat-other@example.test")

	otherCats := decodeBody[struct {
		Items []task.TaskCategory `json:"items"`
	}](t, doJSON(t, server, http.MethodGet, "/task-categories", nil, other.AccessToken))
	otherCatID := otherCats.Items[0].ID

	resp := doJSON(t, server, http.MethodPost, "/tasks", map[string]any{"title": "steal cat", "category_id": otherCatID}, owner.AccessToken)
	if resp.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for foreign category, got %d", resp.Code)
	}
}
