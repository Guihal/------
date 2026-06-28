package httpserver

import (
	"net/http"

	"taskcompanion/backend/internal/auth"
)

func RateLimit(limiter *auth.RateLimiter, scope string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			key := scope + ":" + clientIP(r)
			if !limiter.Allow(key) {
				writeError(w, r, http.StatusTooManyRequests, "rate_limited", "too many requests")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
