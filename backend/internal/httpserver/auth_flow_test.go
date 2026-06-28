package httpserver

import (
	"net/http"
	"testing"
)

func TestAuthRegisterLoginRefreshAndAdminRBAC(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()

	registered := registerUser(t, server, "user@example.test")
	assertBaselines(t, db, registered.User.ID)
	me := doJSON(t, server, http.MethodGet, "/auth/me", nil, registered.AccessToken)
	if me.Code != http.StatusOK {
		t.Fatalf("expected /auth/me 200, got %d", me.Code)
	}

	login := doJSON(t, server, http.MethodPost, "/auth/login", loginBody("user@example.test", "password123"), "")
	if login.Code != http.StatusOK {
		t.Fatalf("expected login 200, got %d", login.Code)
	}
	loggedIn := decodeAuth(t, login)
	if loggedIn.AccessToken == "" || loggedIn.RefreshToken == "" {
		t.Fatal("expected login auth tokens")
	}

	refresh := doJSON(t, server, http.MethodPost, "/auth/refresh", refreshBody(loggedIn.RefreshToken), "")
	if refresh.Code != http.StatusOK {
		t.Fatalf("expected refresh 200, got %d", refresh.Code)
	}
	refreshed := decodeAuth(t, refresh)
	if refreshed.RefreshToken == loggedIn.RefreshToken {
		t.Fatal("expected refresh token rotation")
	}
	assertOldRefreshRevoked(t, db, loggedIn.User.ID)

	reuse := doJSON(t, server, http.MethodPost, "/auth/refresh", refreshBody(loggedIn.RefreshToken), "")
	if reuse.Code != http.StatusUnauthorized {
		t.Fatalf("expected reused refresh 401, got %d", reuse.Code)
	}
	assertAudit(t, db, "auth.refresh_reuse", loggedIn.User.ID)

	denied := doJSON(t, server, http.MethodGet, "/admin/stats", nil, registered.AccessToken)
	if denied.Code != http.StatusForbidden {
		t.Fatalf("expected user admin denial 403, got %d", denied.Code)
	}
	assertAudit(t, db, "admin.role_denied", registered.User.ID)
}

func TestFailedLoginAndAdminAudit(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()

	for range 3 {
		response := doJSON(t, server, http.MethodPost, "/auth/login", loginBody("missing@example.test", "bad-password"), "")
		if response.Code != http.StatusUnauthorized {
			t.Fatalf("expected failed login 401, got %d", response.Code)
		}
	}
	assertAudit(t, db, "auth.login_failure_threshold", "")
	assertAuditDetailsClean(t, db, "bad-password")

	admin := registerUser(t, server, "admin@example.test")
	if _, err := db.Exec(`UPDATE users SET role = 'admin' WHERE id = $1`, admin.User.ID); err != nil {
		t.Fatalf("promote admin: %v", err)
	}
	login := doJSON(t, server, http.MethodPost, "/auth/login", loginBody("admin@example.test", "password123"), "")
	if login.Code != http.StatusOK {
		t.Fatalf("expected admin login 200, got %d", login.Code)
	}
	adminLogin := decodeAuth(t, login)
	ok := doJSON(t, server, http.MethodGet, "/admin/stats", nil, adminLogin.AccessToken)
	if ok.Code != http.StatusOK {
		t.Fatalf("expected admin stats 200, got %d", ok.Code)
	}
	assertAudit(t, db, "auth.admin_login", admin.User.ID)
}

func registerUser(t *testing.T, server *http.Server, email string) authResponse {
	t.Helper()
	response := doJSON(t, server, http.MethodPost, "/auth/register", map[string]string{
		"email": email, "password": "password123", "display_name": "Tester",
	}, "")
	if response.Code != http.StatusCreated {
		t.Fatalf("expected register 201, got %d", response.Code)
	}
	return decodeAuth(t, response)
}

func loginBody(email string, password string) map[string]string {
	return map[string]string{"email": email, "password": password}
}

func refreshBody(token string) map[string]string {
	return map[string]string{"refresh_token": token}
}
