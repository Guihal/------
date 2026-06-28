package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"taskcompanion/backend/internal/config"
	"taskcompanion/backend/internal/httpserver"
)

func main() {
	cfg := config.Load()
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	srv := httpserver.New(cfg, logger)
	errs := make(chan error, 1)

	go func() {
		logger.Info("server_starting", "addr", cfg.HTTPAddr)
		errs <- srv.ListenAndServe()
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	select {
	case err := <-errs:
		if err != nil {
			logger.Error("server_stopped", "error", err)
			os.Exit(1)
		}
	case <-stop:
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := srv.Shutdown(ctx); err != nil {
			logger.Error("server_shutdown_failed", "error", err)
			os.Exit(1)
		}
		logger.Info("server_shutdown_complete")
	}
}
