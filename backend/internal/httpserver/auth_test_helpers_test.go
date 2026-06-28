package httpserver

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"taskcompanion/backend/internal/config"
	"taskcompanion/backend/internal/dbtest"
)

func authTestServer(t *testing.T) (*http.Server, *sql.DB) {
	t.Helper()
	db := dbtest.OpenMigratedDB(t)
	cfg := config.Config{
		AppEnv: "test", HTTPAddr: "127.0.0.1:0", ServiceName: "task-manager-backend",
		AccessTokenSecret: "test-access-secret", RefreshTokenSecret: "test-refresh-secret",
		AccessTokenTTL: "15m", RefreshTokenTTL: "720h",
	}
	server := New(cfg, slog.New(slog.NewTextHandler(io.Discard, nil)), db)
	return server, db
}

func doJSON(t *testing.T, server *http.Server, method string, path string, body any, token string) *httptest.ResponseRecorder {
	t.Helper()
	raw, err := json.Marshal(body)
	if err != nil {
		t.Fatalf("marshal request: %v", err)
	}
	request := httptest.NewRequest(method, path, bytes.NewReader(raw))
	request.Header.Set("Content-Type", "application/json")
	request.RemoteAddr = "127.0.0.1:12345"
	if token != "" {
		request.Header.Set("Authorization", "Bearer "+token)
	}
	response := httptest.NewRecorder()
	server.Handler.ServeHTTP(response, request)
	return response
}

func decodeAuth(t *testing.T, response *httptest.ResponseRecorder) authResponse {
	t.Helper()
	var body authResponse
	if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
		t.Fatalf("decode auth response: %v", err)
	}
	return body
}

func countRows(t *testing.T, db *sql.DB, query string, args ...any) int {
	t.Helper()
	var count int
	if err := db.QueryRow(query, args...).Scan(&count); err != nil {
		t.Fatalf("count query failed: %v", err)
	}
	return count
}
