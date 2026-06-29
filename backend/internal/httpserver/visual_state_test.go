package httpserver

import (
	"net/http"
	"testing"

	"taskcompanion/backend/internal/visual"
)

func TestVisualRefreshPersistsAndUsesWhitelist(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	user := registerUser(t, server, "visual@example.test")

	response := doJSON(t, server, http.MethodPost, "/visual-state/refresh", map[string]string{"event": "manual-refresh"}, user.AccessToken)
	if response.Code != http.StatusOK {
		t.Fatalf("expected visual refresh 200, got %d", response.Code)
	}
	state := decodeBody[visual.State](t, response)
	if !visual.Valid(state) {
		t.Fatalf("visual refresh returned non-whitelisted state: %+v", state)
	}
	get := doJSON(t, server, http.MethodGet, "/visual-state", nil, user.AccessToken)
	if persisted := decodeBody[visual.State](t, get); persisted != state {
		t.Fatalf("expected persisted visual state\nwant: %+v\ngot: %+v", state, persisted)
	}
}

func TestVisualRefreshDisabledDoesNotReroll(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	user := registerUser(t, server, "visual-disabled@example.test")
	initial := doJSON(t, server, http.MethodPost, "/visual-state/refresh", map[string]string{"event": "app-enter"}, user.AccessToken)
	state := decodeBody[visual.State](t, initial)

	disable := doJSON(t, server, http.MethodPatch, "/settings",
		map[string]any{"disable_visual_randomness": true}, user.AccessToken)
	if disable.Code != http.StatusOK {
		t.Fatalf("expected disable setting 200, got %d", disable.Code)
	}
	next := doJSON(t, server, http.MethodPost, "/visual-state/refresh", map[string]string{"event": "level-up"}, user.AccessToken)
	if disabledState := decodeBody[visual.State](t, next); disabledState != state {
		t.Fatalf("disabled visual refresh rerolled\nwant: %+v\ngot: %+v", state, disabledState)
	}
}

func TestVisualRefreshDisabledUsesCanonicalSettingAndPersistsFallback(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	user := registerUser(t, server, "visual-canonical-disabled@example.test")
	disable := doJSON(t, server, http.MethodPatch, "/settings",
		map[string]any{"disable_visual_randomness": true}, user.AccessToken)
	if disable.Code != http.StatusOK {
		t.Fatalf("expected disable setting 200, got %d", disable.Code)
	}

	refresh := doJSON(t, server, http.MethodPost, "/visual-state/refresh", map[string]string{"event": "app-enter"}, user.AccessToken)
	if refresh.Code != http.StatusOK {
		t.Fatalf("expected disabled visual refresh 200, got %d", refresh.Code)
	}
	if state := decodeBody[visual.State](t, refresh); state != visual.Fallback() {
		t.Fatalf("expected persisted fallback for disabled refresh, got %+v", state)
	}
	get := doJSON(t, server, http.MethodGet, "/visual-state", nil, user.AccessToken)
	if persisted := decodeBody[visual.State](t, get); persisted != visual.Fallback() {
		t.Fatalf("expected fallback to be persisted, got %+v", persisted)
	}
	if count := countRows(t, db, `SELECT count(*) FROM settings WHERE user_id = $1`, user.User.ID); count != 4 {
		t.Fatalf("expected only canonical settings, got %d rows", count)
	}
}

func TestVisualFallbackAndEventValidation(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	user := registerUser(t, server, "visual-fallback@example.test")
	if _, err := db.Exec(`INSERT INTO visual_state (user_id, scope, key, value)
		VALUES ($1, 'mobile', 'accent_color', '{"value":"hotpink"}'::jsonb)`, user.User.ID); err != nil {
		t.Fatalf("insert invalid visual state: %v", err)
	}
	get := doJSON(t, server, http.MethodGet, "/visual-state", nil, user.AccessToken)
	if state := decodeBody[visual.State](t, get); state != visual.Fallback() {
		t.Fatalf("expected fallback for invalid visual state, got %+v", state)
	}
	bad := doJSON(t, server, http.MethodPost, "/visual-state/refresh", map[string]string{"event": "surprise"}, user.AccessToken)
	if bad.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid event 400, got %d", bad.Code)
	}
}
