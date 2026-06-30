package httpserver

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"

	admindomain "taskcompanion/backend/internal/admin"
	"taskcompanion/backend/internal/adminrepo"
	"taskcompanion/backend/internal/auth"
)

func TestP08AdminRouteForbidsNormalUser(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	user := registerUser(t, server, "p08-user@example.test")

	response := doJSON(t, server, http.MethodGet, "/admin/users", nil, user.AccessToken)
	if response.Code != http.StatusForbidden {
		t.Fatalf("expected normal user forbidden, got %d", response.Code)
	}
}

func TestP08ItemMutationsWriteAuditEvents(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	admin := adminLogin(t, server, db, "p08-admin@example.test")

	item := createAdminItem(t, server, admin.AccessToken, "P08 Lamp")
	patch := doJSON(t, server, http.MethodPatch, "/admin/items/"+item.ID,
		map[string]any{"description": "updated"}, admin.AccessToken)
	if patch.Code != http.StatusOK {
		t.Fatalf("expected update 200, got %d", patch.Code)
	}
	disable := doJSON(t, server, http.MethodPost, "/admin/items/"+item.ID+"/disable", nil, admin.AccessToken)
	if disable.Code != http.StatusOK {
		t.Fatalf("expected disable 200, got %d", disable.Code)
	}

	assertAudit(t, db, "item.create", admin.User.ID)
	assertAudit(t, db, "item.update", admin.User.ID)
	assertAudit(t, db, "item.disable", admin.User.ID)
}

func TestP08DuplicateItemNameReturnsConflict(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	admin := adminLogin(t, server, db, "p08-duplicate-admin@example.test")

	createAdminItem(t, server, admin.AccessToken, "P08 Unique Name")
	duplicate := doJSON(t, server, http.MethodPost, "/admin/items", map[string]any{
		"name": "P08 Unique Name", "rarity": "common",
		"slot_key": "hat", "base_xp_multiplier": 1,
	}, admin.AccessToken)
	if duplicate.Code != http.StatusConflict {
		t.Fatalf("expected duplicate create 409, got %d", duplicate.Code)
	}
	second := createAdminItem(t, server, admin.AccessToken, "P08 Second Name")
	patch := doJSON(t, server, http.MethodPatch, "/admin/items/"+second.ID,
		map[string]any{"name": "P08 Unique Name"}, admin.AccessToken)
	if patch.Code != http.StatusConflict {
		t.Fatalf("expected duplicate patch 409, got %d", patch.Code)
	}
}

func TestP08AuditFailureRollsBackItemMutation(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	admin := adminLogin(t, server, db, "p08-audit-fail-admin@example.test")
	service := admindomain.NewService(adminrepo.New(db), t.TempDir())

	_, err := service.CreateItem(context.Background(), admindomain.ItemInput{
		Name: "P08 Audit Rollback", Description: "must not persist",
		Rarity: "common", SlotKey: "hat", BaseXPMultiplier: 1,
	}, admin.User.ID, "not-an-ip")
	if err == nil {
		t.Fatal("expected audit failure")
	}
	if c := countRows(t, db, `SELECT count(*) FROM inventory_items WHERE name=$1`, "P08 Audit Rollback"); c != 0 {
		t.Fatalf("expected rolled back item create, got %d rows", c)
	}

	item := createAdminItem(t, server, admin.AccessToken, "P08 Audit Update")
	updated := "leaked update"
	_, err = service.UpdateItem(context.Background(), item.ID, admindomain.ItemPatch{
		Description: &updated,
	}, admin.User.ID, "not-an-ip")
	if err == nil {
		t.Fatal("expected update audit failure")
	}
	if c := countRows(t, db,
		`SELECT count(*) FROM inventory_items WHERE id=$1 AND description=$2`, item.ID, updated); c != 0 {
		t.Fatalf("expected rolled back item update, got %d matching rows", c)
	}

	adminID := admin.User.ID
	err = adminrepo.New(db).SetItemAssetWithAudit(context.Background(), item.ID, "/assets/leak.png", auth.AuditEvent{
		UserID: &adminID, Action: "asset.upload", Details: map[string]any{"item_id": item.ID}, IP: "not-an-ip",
	})
	if err == nil {
		t.Fatal("expected asset audit failure")
	}
	if c := countRows(t, db,
		`SELECT count(*) FROM inventory_items WHERE id=$1 AND asset_url=$2`, item.ID, "/assets/leak.png"); c != 0 {
		t.Fatalf("expected rolled back asset update, got %d matching rows", c)
	}
}

func TestP08AssetUploadRejectsInvalidTypeAndOversize(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	admin := adminLogin(t, server, db, "p08-upload-admin@example.test")
	item := createAdminItem(t, server, admin.AccessToken, "P08 Upload Item")

	invalid := doUpload(t, server, "/admin/items/"+item.ID+"/assets", []byte("not an image"), admin.AccessToken)
	if invalid.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid upload 400, got %d", invalid.Code)
	}
	oversized := doUpload(t, server, "/admin/items/"+item.ID+"/assets", bytes.Repeat([]byte{0}, maxAssetBytes+1), admin.AccessToken)
	if oversized.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("expected oversized upload 413, got %d", oversized.Code)
	}
}

func TestP08StatsAndAuditLogFilters(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	admin := adminLogin(t, server, db, "p08-logs-admin@example.test")
	item := createAdminItem(t, server, admin.AccessToken, "P08 Log Item")
	doJSON(t, server, http.MethodPatch, "/admin/items/"+item.ID,
		map[string]any{"description": "filter target"}, admin.AccessToken)

	stats := doJSON(t, server, http.MethodGet, "/admin/stats", nil, admin.AccessToken)
	if stats.Code != http.StatusOK {
		t.Fatalf("expected stats 200, got %d", stats.Code)
	}
	var summary map[string]int
	if err := json.NewDecoder(stats.Body).Decode(&summary); err != nil {
		t.Fatalf("decode stats: %v", err)
	}
	for _, key := range []string{"users", "tasks", "completed_tasks", "reward_rolls", "items", "granted_items"} {
		if _, ok := summary[key]; !ok {
			t.Fatalf("stats missing %s", key)
		}
	}

	from := url.QueryEscape(time.Now().Add(-time.Hour).Format(time.RFC3339))
	to := url.QueryEscape(time.Now().Add(time.Hour).Format(time.RFC3339))
	path := "/admin/logs?action=item.update&user_id=" + admin.User.ID + "&from=" + from + "&to=" + to
	logs := doJSON(t, server, http.MethodGet, path, nil, admin.AccessToken)
	if logs.Code != http.StatusOK {
		t.Fatalf("expected logs 200, got %d", logs.Code)
	}
	var body struct {
		Items []struct {
			Action string  `json:"action"`
			UserID *string `json:"user_id"`
		} `json:"items"`
	}
	if err := json.NewDecoder(logs.Body).Decode(&body); err != nil {
		t.Fatalf("decode logs: %v", err)
	}
	if len(body.Items) != 1 || body.Items[0].Action != "item.update" || *body.Items[0].UserID != admin.User.ID {
		t.Fatalf("expected one filtered item.update log, got %+v", body.Items)
	}
}

func TestP08AdminMutationRateLimit(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	admin := adminLogin(t, server, db, "p08-rate-admin@example.test")

	var response *httptest.ResponseRecorder
	for i := 0; i < 21; i++ {
		response = doJSON(t, server, http.MethodPost, "/admin/items",
			map[string]any{"name": "", "rarity": "common", "slot_key": "hat"}, admin.AccessToken)
	}
	if response.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 21st admin mutation to be rate-limited, got %d", response.Code)
	}
}

type adminItemResponse struct {
	ID string `json:"id"`
}

func adminLogin(t *testing.T, server *http.Server, db *sql.DB, email string) authResponse {
	t.Helper()
	registered := registerUser(t, server, email)
	if _, err := db.Exec(`UPDATE users SET role = 'admin' WHERE id = $1`, registered.User.ID); err != nil {
		t.Fatalf("promote admin: %v", err)
	}
	login := doJSON(t, server, http.MethodPost, "/auth/login", loginBody(email, "password123"), "")
	if login.Code != http.StatusOK {
		t.Fatalf("expected admin login 200, got %d", login.Code)
	}
	return decodeAuth(t, login)
}

func createAdminItem(t *testing.T, server *http.Server, token, name string) adminItemResponse {
	t.Helper()
	response := doJSON(t, server, http.MethodPost, "/admin/items", map[string]any{
		"name": name, "description": "created by test", "rarity": "common",
		"slot_key": "hat", "base_xp_multiplier": 1,
	}, token)
	if response.Code != http.StatusCreated {
		t.Fatalf("expected create 201, got %d", response.Code)
	}
	var item adminItemResponse
	if err := json.NewDecoder(response.Body).Decode(&item); err != nil {
		t.Fatalf("decode item: %v", err)
	}
	if item.ID == "" {
		t.Fatal("expected created item id")
	}
	return item
}

func doUpload(t *testing.T, server *http.Server, path string, body []byte, token string) *httptest.ResponseRecorder {
	t.Helper()
	request := httptest.NewRequest(http.MethodPost, path, bytes.NewReader(body))
	request.RemoteAddr = "127.0.0.1:12345"
	request.Header.Set("Authorization", "Bearer "+token)
	response := httptest.NewRecorder()
	server.Handler.ServeHTTP(response, request)
	return response
}
