package httpserver

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"

	"taskcompanion/backend/internal/config"
)

func New(cfg config.Config, logger *slog.Logger) *http.Server {
	router := chi.NewRouter()
	router.Use(RequestID)
	router.Use(AccessLog(logger))
	router.Get("/health", HealthHandler(cfg))

	return &http.Server{
		Addr:              cfg.HTTPAddr,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
	}
}
