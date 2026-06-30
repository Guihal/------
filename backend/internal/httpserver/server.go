package httpserver

import (
	"database/sql"
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"

	"taskcompanion/backend/internal/auth"
	"taskcompanion/backend/internal/authrepo"
	"taskcompanion/backend/internal/config"
	"taskcompanion/backend/internal/inventory"
	"taskcompanion/backend/internal/inventoryrepo"
	"taskcompanion/backend/internal/profile"
	"taskcompanion/backend/internal/profilerepo"
	"taskcompanion/backend/internal/reward"
	"taskcompanion/backend/internal/rewardrepo"
	"taskcompanion/backend/internal/task"
	"taskcompanion/backend/internal/taskrepo"
	"taskcompanion/backend/internal/visual"
	"taskcompanion/backend/internal/visualrepo"
)

func New(cfg config.Config, logger *slog.Logger, db *sql.DB) *http.Server {
	router := chi.NewRouter()
	router.Use(RequestID)
	router.Use(AccessLog(logger))
	router.Get("/health", HealthHandler(cfg))
	if db != nil {
		registerAuthRoutes(router, cfg, db, logger)
	}

	return &http.Server{
		Addr:              cfg.HTTPAddr,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
	}
}

func registerAuthRoutes(router chi.Router, cfg config.Config, db *sql.DB, logger *slog.Logger) {
	accessTTL, err := time.ParseDuration(cfg.AccessTokenTTL)
	if err != nil {
		accessTTL = 15 * time.Minute
	}
	refreshTTL, err := time.ParseDuration(cfg.RefreshTokenTTL)
	if err != nil {
		refreshTTL = 30 * 24 * time.Hour
	}
	tokens := auth.NewTokenManager(cfg.AccessTokenSecret, accessTTL)
	service := auth.NewService(authrepo.New(db), tokens, cfg.RefreshTokenSecret, refreshTTL)
	handlers := NewAuthHandlers(service)
	limit := auth.NewRateLimiter(20, time.Minute)

	router.With(RateLimit(limit, "register")).Post("/auth/register", handlers.Register)
	router.With(RateLimit(limit, "login")).Post("/auth/login", handlers.Login)
	router.With(RateLimit(limit, "refresh")).Post("/auth/refresh", handlers.Refresh)
	router.With(RequireAuth(tokens)).Post("/auth/logout", handlers.Logout)
	router.With(RequireAuth(tokens)).Get("/auth/me", handlers.Me)
	router.With(RequireAuth(tokens), RequireAdmin(service)).Get("/admin/stats", AdminStatsHandler)
	registerProfileRoutes(router, tokens, db)
	registerVisualRoutes(router, tokens, db)
	registerTaskRoutes(router, tokens, db)
	registerRewardRoutes(router, tokens, db, logger)
	registerInventoryRoutes(router, tokens, db, logger)
}

func registerInventoryRoutes(router chi.Router, tokens auth.TokenManager, db *sql.DB, logger *slog.Logger) {
	service := inventory.NewService(inventoryrepo.New(db), logger)
	handlers := NewInventoryHandlers(service)

	router.With(RequireAuth(tokens)).Get("/inventory", handlers.List)
	router.With(RequireAuth(tokens)).Get("/mascot/active", handlers.ActiveMascot)
	router.With(RequireAuth(tokens)).Post("/inventory/{userInventoryItemId}/equip", handlers.Equip)
	router.With(RequireAuth(tokens)).Post("/inventory/{userInventoryItemId}/unequip", handlers.Unequip)
}

func registerRewardRoutes(router chi.Router, tokens auth.TokenManager, db *sql.DB, logger *slog.Logger) {
	// Reuse the same visual service shape as the visual routes; reward needs it
	// for the post-commit visual_state refresh.
	visualService := visual.NewService(visualrepo.New(db))
	service := reward.NewService(rewardrepo.New(db), visualService, logger)
	handlers := NewRewardHandlers(service)

	router.With(RequireAuth(tokens)).Post("/tasks/{id}/complete", handlers.Complete)
}

func registerProfileRoutes(router chi.Router, tokens auth.TokenManager, db *sql.DB) {
	service := profile.NewService(profilerepo.New(db))
	profiles := NewProfileHandlers(service)
	settings := NewSettingsHandlers(service)

	router.With(RequireAuth(tokens)).Get("/profile", profiles.Get)
	router.With(RequireAuth(tokens)).Patch("/profile", profiles.Patch)
	router.With(RequireAuth(tokens)).Get("/profile/progression", profiles.Progression)
	router.With(RequireAuth(tokens)).Get("/settings", settings.Get)
	router.With(RequireAuth(tokens)).Patch("/settings", settings.Patch)
}

func registerVisualRoutes(router chi.Router, tokens auth.TokenManager, db *sql.DB) {
	service := visual.NewService(visualrepo.New(db))
	handlers := NewVisualHandlers(service)
	limit := auth.NewRateLimiter(60, time.Minute)

	router.With(RequireAuth(tokens)).Get("/visual-state", handlers.Get)
	router.With(RequireAuth(tokens), RateLimit(limit, "visual-refresh")).Post("/visual-state/refresh", handlers.Refresh)
}

func registerTaskRoutes(router chi.Router, tokens auth.TokenManager, db *sql.DB) {
	service := task.NewService(taskrepo.New(db))
	tasks := NewTaskHandlers(service)
	categories := NewTaskCategoryHandlers(service)

	router.With(RequireAuth(tokens)).Get("/tasks", tasks.List)
	router.With(RequireAuth(tokens)).Post("/tasks", tasks.Create)
	router.With(RequireAuth(tokens)).Get("/tasks/{id}", tasks.Get)
	router.With(RequireAuth(tokens)).Patch("/tasks/{id}", tasks.Patch)
	router.With(RequireAuth(tokens)).Post("/tasks/{id}/archive", tasks.Archive)
	router.With(RequireAuth(tokens)).Get("/task-categories", categories.List)
}
