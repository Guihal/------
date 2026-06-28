package httpserver

import (
	"encoding/json"
	"net/http"

	"taskcompanion/backend/internal/config"
)

type healthResponse struct {
	Service   string `json:"service"`
	Status    string `json:"status"`
	Env       string `json:"env"`
	RequestID string `json:"request_id"`
}

func HealthHandler(cfg config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(healthResponse{
			Service:   cfg.ServiceName,
			Status:    "ok",
			Env:       cfg.AppEnv,
			RequestID: RequestIDFromContext(r.Context()),
		})
	}
}
