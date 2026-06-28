package config

import "os"

const (
	defaultAppEnv      = "development"
	defaultHTTPAddr    = "127.0.0.1:8080"
	defaultDatabaseURL = "postgres://task_companion:task_companion@localhost:5432/task_companion?sslmode=disable"
	defaultServiceName = "task-manager-backend"
	defaultAccessTTL   = "15m"
	defaultRefreshTTL  = "720h"
)

type Config struct {
	AppEnv             string
	HTTPAddr           string
	DatabaseURL        string
	ServiceName        string
	AccessTokenSecret  string
	RefreshTokenSecret string
	AccessTokenTTL     string
	RefreshTokenTTL    string
}

func Load() Config {
	return Config{
		AppEnv:             envOrDefault("APP_ENV", defaultAppEnv),
		HTTPAddr:           envOrDefault("HTTP_ADDR", defaultHTTPAddr),
		DatabaseURL:        envOrDefault("DATABASE_URL", defaultDatabaseURL),
		ServiceName:        envOrDefault("SERVICE_NAME", defaultServiceName),
		AccessTokenSecret:  envOrDefault("ACCESS_TOKEN_SECRET", "dev-access-secret"),
		RefreshTokenSecret: envOrDefault("REFRESH_TOKEN_SECRET", "dev-refresh-secret"),
		AccessTokenTTL:     envOrDefault("ACCESS_TOKEN_TTL", defaultAccessTTL),
		RefreshTokenTTL:    envOrDefault("REFRESH_TOKEN_TTL", defaultRefreshTTL),
	}
}

func envOrDefault(key string, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
