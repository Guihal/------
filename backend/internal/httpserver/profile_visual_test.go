package httpserver

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"taskcompanion/backend/internal/profile"
)

func TestProfileUsesAuthenticatedUser(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	first := registerUser(t, server, "profile-one@example.test")
	second := registerUser(t, server, "profile-two@example.test")

	patch := doJSON(t, server, http.MethodPatch, "/profile", map[string]string{"display_name": "First"}, first.AccessToken)
	if patch.Code != http.StatusOK {
		t.Fatalf("expected profile patch 200, got %d", patch.Code)
	}
	own := decodeBody[profile.Summary](t, patch)
	if own.DisplayName != "First" {
		t.Fatalf("expected patched name, got %q", own.DisplayName)
	}
	other := doJSON(t, server, http.MethodGet, "/profile", nil, second.AccessToken)
	if decodeBody[profile.Summary](t, other).DisplayName == "First" {
		t.Fatal("profile patch affected another user")
	}
	if unauthorized := doJSON(t, server, http.MethodGet, "/profile", nil, ""); unauthorized.Code != http.StatusUnauthorized {
		t.Fatalf("expected unauthenticated profile 401, got %d", unauthorized.Code)
	}
}

func TestSettingsPatchValidation(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	user := registerUser(t, server, "settings@example.test")

	badType := doJSON(t, server, http.MethodPatch, "/settings", map[string]any{"reduced_motion": "yes"}, user.AccessToken)
	if badType.Code != http.StatusBadRequest {
		t.Fatalf("expected bad type 400, got %d", badType.Code)
	}
	badRange := doJSON(t, server, http.MethodPatch, "/settings",
		map[string]any{"default_reminder_minutes_before_deadline": -1}, user.AccessToken)
	if badRange.Code != http.StatusBadRequest {
		t.Fatalf("expected bad range 400, got %d", badRange.Code)
	}
	nullValue := doJSON(t, server, http.MethodPatch, "/settings",
		map[string]any{"notifications_enabled": nil}, user.AccessToken)
	if nullValue.Code != http.StatusBadRequest {
		t.Fatalf("expected null value 400, got %d", nullValue.Code)
	}
	nullBody := doJSON(t, server, http.MethodPatch, "/settings", nil, user.AccessToken)
	if nullBody.Code != http.StatusBadRequest {
		t.Fatalf("expected null body 400, got %d", nullBody.Code)
	}
	ok := doJSON(t, server, http.MethodPatch, "/settings", map[string]any{
		"notifications_enabled": false, "default_reminder_minutes_before_deadline": 30,
		"disable_visual_randomness": true, "reduced_motion": true,
	}, user.AccessToken)
	if ok.Code != http.StatusOK {
		t.Fatalf("expected settings patch 200, got %d", ok.Code)
	}
	settings := decodeBody[profile.Settings](t, ok)
	if settings.NotificationsEnabled || settings.DefaultReminderMinutesBeforeDeadline != 30 || !settings.ReducedMotion {
		t.Fatalf("unexpected settings response: %+v", settings)
	}
	mixedBad := doJSON(t, server, http.MethodPatch, "/settings",
		map[string]any{"reduced_motion": false, "notifications_enabled": nil}, user.AccessToken)
	if mixedBad.Code != http.StatusBadRequest {
		t.Fatalf("expected mixed invalid patch 400, got %d", mixedBad.Code)
	}
	afterBad := doJSON(t, server, http.MethodGet, "/settings", nil, user.AccessToken)
	if afterSettings := decodeBody[profile.Settings](t, afterBad); !afterSettings.ReducedMotion {
		t.Fatalf("invalid patch partially persisted: %+v", afterSettings)
	}
	if count := countRows(t, db, `SELECT count(*) FROM settings WHERE user_id = $1 AND key = 'preferences'`, user.User.ID); count != 0 {
		t.Fatalf("expected no preferences setting row, got %d", count)
	}
	if count := countRows(t, db, `SELECT count(*) FROM settings WHERE user_id = $1`, user.User.ID); count != 4 {
		t.Fatalf("expected four canonical settings rows, got %d", count)
	}
}

func decodeBody[T any](t *testing.T, response *httptest.ResponseRecorder) T {
	t.Helper()
	var body T
	if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	return body
}
