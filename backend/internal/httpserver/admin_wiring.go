package httpserver

import (
	"database/sql"
	"time"

	"github.com/go-chi/chi/v5"

	"taskcompanion/backend/internal/admin"
	"taskcompanion/backend/internal/adminrepo"
	"taskcompanion/backend/internal/auth"
	"taskcompanion/backend/internal/config"
)

// registerAdminRoutes wires every /admin/* route behind RequireAuth +
// RequireAdmin. Mutations (create/update/disable) and asset upload also carry
// RateLimit per RULES.md §6.
func registerAdminRoutes(router chi.Router, cfg config.Config, tokens auth.TokenManager, authSvc *auth.Service, db *sql.DB) {
	repo := adminrepo.New(db)
	service := admin.NewService(repo, cfg.AssetsDir)
	handlers := NewAdminHandlers(service, repo)
	adminLimit := auth.NewRateLimiter(20, time.Minute)

	router.With(RequireAuth(tokens), RequireAdmin(authSvc)).Get("/admin/users", handlers.ListUsers)
	router.With(RequireAuth(tokens), RequireAdmin(authSvc)).Get("/admin/items", handlers.ListItems)
	router.With(RequireAuth(tokens), RequireAdmin(authSvc)).Get("/admin/items/{id}", handlers.GetItem)
	router.With(RequireAuth(tokens), RequireAdmin(authSvc), RateLimit(adminLimit, "admin-item-create")).Post("/admin/items", handlers.CreateItem)
	router.With(RequireAuth(tokens), RequireAdmin(authSvc), RateLimit(adminLimit, "admin-item-update")).Patch("/admin/items/{id}", handlers.UpdateItem)
	router.With(RequireAuth(tokens), RequireAdmin(authSvc), RateLimit(adminLimit, "admin-item-disable")).Post("/admin/items/{id}/disable", handlers.DisableItem)
	router.With(RequireAuth(tokens), RequireAdmin(authSvc), RateLimit(adminLimit, "admin-asset-upload")).Post("/admin/items/{id}/assets", handlers.UploadAsset)
	router.With(RequireAuth(tokens), RequireAdmin(authSvc)).Get("/admin/stats", handlers.Stats)
	router.With(RequireAuth(tokens), RequireAdmin(authSvc)).Get("/admin/logs", handlers.ListLogs)
}
