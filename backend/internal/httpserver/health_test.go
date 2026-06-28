package httpserver

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"taskcompanion/backend/internal/config"
)

func TestHealthHandler(t *testing.T) {
	cfg := config.Config{AppEnv: "test", HTTPAddr: "127.0.0.1:0", ServiceName: "task-manager-backend"}
	server := New(cfg, slog.New(slog.NewTextHandler(io.Discard, nil)), nil)
	request := httptest.NewRequest(http.MethodGet, "/health", nil)
	response := httptest.NewRecorder()

	server.Handler.ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", response.Code)
	}
	if response.Header().Get("X-Request-Id") == "" {
		t.Fatal("expected X-Request-Id header")
	}

	var body healthResponse
	if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
		t.Fatalf("decode health response: %v", err)
	}
	if body.Service != "task-manager-backend" || body.Status != "ok" || body.Env != "test" {
		t.Fatalf("unexpected health response: %+v", body)
	}
	if body.RequestID == "" {
		t.Fatal("expected request_id in body")
	}
}
