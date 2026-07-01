package httpserver

import (
	"net/http"
	"testing"

	"taskcompanion/backend/internal/inventory"
)

// TestCompleteAnotherUsersTaskIs404 proves user A cannot complete user B's
// task via the API — complement to TestTaskOwnership (get/patch/archive)
// in task_test.go, which does not cover the complete endpoint.
func TestCompleteAnotherUsersTaskIs404(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	owner := registerUser(t, server, "complete-owner@example.test")
	other := registerUser(t, server, "complete-other@example.test")

	create := doJSON(t, server, http.MethodPost, "/tasks", map[string]any{"title": "not yours"}, owner.AccessToken)
	if create.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", create.Code)
	}
	id := decodeBody[struct {
		ID string `json:"id"`
	}](t, create).ID

	resp := doJSON(t, server, http.MethodPost, "/tasks/"+id+"/complete", nil, other.AccessToken)
	if resp.Code != http.StatusNotFound {
		t.Fatalf("expected 404 for other user completing task, got %d: %s", resp.Code, resp.Body.String())
	}
}

// TestInventoryListDoesNotLeakOtherUsersItems proves user A's GET /inventory
// never returns items owned by user B.
func TestInventoryListDoesNotLeakOtherUsersItems(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	owner := registerUser(t, server, "inv-owner@example.test")
	other := registerUser(t, server, "inv-other@example.test")

	ownedID := seedItemFixture(t, db, owner.User.ID, "head", "common")

	list := decodeBody[inventory.InventoryResponse](t, doJSON(t, server, http.MethodGet, "/inventory", nil, other.AccessToken))
	for _, item := range list.Items {
		if item.ID == ownedID {
			t.Fatalf("other user's inventory leaked owner's item %s", ownedID)
		}
	}
}
