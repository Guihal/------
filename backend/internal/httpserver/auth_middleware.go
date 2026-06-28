package httpserver

import (
	"context"
	"net"
	"net/http"
	"strings"

	"taskcompanion/backend/internal/auth"
)

type authContextKey struct{}

func RequireAuth(tokens auth.TokenManager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			raw := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
			claims, err := tokens.Verify(raw)
			if err != nil {
				writeError(w, r, http.StatusUnauthorized, "unauthorized", "authentication required")
				return
			}
			ctx := context.WithValue(r.Context(), authContextKey{}, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func RequireAdmin(service *auth.Service) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims := CurrentClaims(r)
			if claims.Role != auth.RoleAdmin {
				service.AuditAdminDenied(r.Context(), claims.Subject, r.URL.Path, clientIP(r))
				writeError(w, r, http.StatusForbidden, "forbidden", "admin role required")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func CurrentClaims(r *http.Request) auth.Claims {
	claims, _ := r.Context().Value(authContextKey{}).(auth.Claims)
	return claims
}

func clientIP(r *http.Request) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil {
		return host
	}
	return r.RemoteAddr
}
