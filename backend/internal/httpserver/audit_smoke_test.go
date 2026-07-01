package httpserver

import (
	"io"
	"log/slog"
	"net/http"
	"testing"

	"taskcompanion/backend/internal/config"
	"taskcompanion/backend/internal/dbtest"
)

// TestAuditSmokeCoversAllRequiredActions runs one realistic end-to-end flow
// (P14 packet: register/login, task complete + level reward, equip/unequip,
// admin item mutation, asset upload) and asserts every audit action the
// packet's Acceptance section requires is actually recorded in audit_logs.
func TestAuditSmokeCoversAllRequiredActions(t *testing.T) {
	db := dbtest.OpenMigratedDB(t)
	defer db.Close()
	cfg := config.Config{
		AppEnv: "test", HTTPAddr: "127.0.0.1:0", ServiceName: "task-manager-backend",
		AccessTokenSecret: "test-access-secret", RefreshTokenSecret: "test-refresh-secret",
		AccessTokenTTL: "15m", RefreshTokenTTL: "720h", AssetsDir: t.TempDir(),
	}
	server := New(cfg, slog.New(slog.NewTextHandler(io.Discard, nil)), db)

	user := registerUser(t, server, "audit-smoke-user@example.test")
	login := doJSON(t, server, http.MethodPost, "/auth/login", loginBody("audit-smoke-user@example.test", "password123"), "")
	if login.Code != http.StatusOK {
		t.Fatalf("expected login 200, got %d", login.Code)
	}
	assertAudit(t, db, "auth.login_success", user.User.ID)

	for range 3 {
		resp := doJSON(t, server, http.MethodPost, "/auth/login", loginBody("audit-smoke-missing@example.test", "bad-password"), "")
		if resp.Code != http.StatusUnauthorized {
			t.Fatalf("expected failed login 401, got %d", resp.Code)
		}
	}
	assertAudit(t, db, "auth.login_failure_threshold", "")

	denied := doJSON(t, server, http.MethodGet, "/admin/stats", nil, user.AccessToken)
	if denied.Code != http.StatusForbidden {
		t.Fatalf("expected user admin denial 403, got %d", denied.Code)
	}
	assertAudit(t, db, "admin.role_denied", user.User.ID)

	// Seed progression just below level 5 so the single task completion below
	// also crosses the milestone and triggers reward.level in the same call.
	seedCatalogItems(t, db)
	if _, err := db.Exec(`UPDATE progressions SET xp_total=3999, level=4 WHERE user_id=$1`, user.User.ID); err != nil {
		t.Fatalf("seed progression: %v", err)
	}
	taskID := createTaskID(t, server, user.AccessToken)
	complete := doJSON(t, server, http.MethodPost, "/tasks/"+taskID+"/complete", nil, user.AccessToken)
	if complete.Code != http.StatusOK {
		t.Fatalf("expected complete 200, got %d: %s", complete.Code, complete.Body.String())
	}
	assertAudit(t, db, "reward.complete", user.User.ID)
	assertAudit(t, db, "reward.roll", user.User.ID)
	assertAudit(t, db, "reward.level", user.User.ID)

	ownedID := seedItemFixture(t, db, user.User.ID, "head", "common")
	equip := doJSON(t, server, http.MethodPost, "/inventory/"+ownedID+"/equip", nil, user.AccessToken)
	if equip.Code != http.StatusOK {
		t.Fatalf("expected equip 200, got %d: %s", equip.Code, equip.Body.String())
	}
	assertAudit(t, db, "inventory.equip", user.User.ID)
	unequip := doJSON(t, server, http.MethodPost, "/inventory/"+ownedID+"/unequip", nil, user.AccessToken)
	if unequip.Code != http.StatusNoContent {
		t.Fatalf("expected unequip 204, got %d: %s", unequip.Code, unequip.Body.String())
	}
	assertAudit(t, db, "inventory.unequip", user.User.ID)

	admin := adminLogin(t, server, db, "audit-smoke-admin@example.test")
	assertAudit(t, db, "auth.admin_login", admin.User.ID)

	item := createAdminItem(t, server, admin.AccessToken, "Audit Smoke Item")
	assertAudit(t, db, "item.create", admin.User.ID)
	patch := doJSON(t, server, http.MethodPatch, "/admin/items/"+item.ID, map[string]any{"description": "updated"}, admin.AccessToken)
	if patch.Code != http.StatusOK {
		t.Fatalf("expected item patch 200, got %d", patch.Code)
	}
	assertAudit(t, db, "item.update", admin.User.ID)
	disable := doJSON(t, server, http.MethodPost, "/admin/items/"+item.ID+"/disable", nil, admin.AccessToken)
	if disable.Code != http.StatusOK {
		t.Fatalf("expected item disable 200, got %d", disable.Code)
	}
	assertAudit(t, db, "item.disable", admin.User.ID)

	pngHeader := []byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0}
	upload := doUpload(t, server, "/admin/items/"+item.ID+"/assets", pngHeader, admin.AccessToken)
	if upload.Code != http.StatusOK {
		t.Fatalf("expected upload 200, got %d: %s", upload.Code, upload.Body.String())
	}
	assertAudit(t, db, "asset.upload", admin.User.ID)
}
