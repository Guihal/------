package config

import "os"

const (
	defaultAppEnv      = "development"
	defaultHTTPAddr    = "127.0.0.1:8080"
	defaultDatabaseURL = "postgres://task_companion:task_companion@localhost:5432/task_companion"
	defaultServiceName = "task-manager-backend"
)

type Config struct {
	AppEnv      string
	HTTPAddr    string
	DatabaseURL string
	ServiceName string
}

func Load() Config {
	return Config{
		AppEnv:      envOrDefault("APP_ENV", defaultAppEnv),
		HTTPAddr:    envOrDefault("HTTP_ADDR", defaultHTTPAddr),
		DatabaseURL: envOrDefault("DATABASE_URL", defaultDatabaseURL),
		ServiceName: envOrDefault("SERVICE_NAME", defaultServiceName),
	}
}

func envOrDefault(key string, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
