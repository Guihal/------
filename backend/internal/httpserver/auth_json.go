package httpserver

import (
	"encoding/json"
	"errors"
	"net/http"

	"taskcompanion/backend/internal/auth"
)

func decodeJSONBody(w http.ResponseWriter, r *http.Request, value any) bool {
	if err := json.NewDecoder(r.Body).Decode(value); err != nil {
		writeError(w, r, http.StatusBadRequest, "bad_request", "invalid JSON body")
		return false
	}
	return true
}

func writeAuthError(w http.ResponseWriter, r *http.Request, err error) {
	switch {
	case errors.Is(err, auth.ErrInvalidCredentials):
		writeError(w, r, http.StatusUnauthorized, "invalid_credentials", "invalid email or password")
	case errors.Is(err, auth.ErrUnauthorized):
		writeError(w, r, http.StatusUnauthorized, "unauthorized", "authentication required")
	case errors.Is(err, auth.ErrEmailTaken):
		writeError(w, r, http.StatusConflict, "email_taken", "email is already registered")
	default:
		writeError(w, r, http.StatusInternalServerError, "internal_error", "internal server error")
	}
}

func mapAuth(result auth.AuthResponse) authResponse {
	return authResponse{
		AccessToken:  result.AccessToken,
		RefreshToken: result.RefreshToken,
		ExpiresAt:    result.ExpiresAt.UTC().Format("2006-01-02T15:04:05Z"),
		User:         mapUser(result.User),
	}
}

func mapUser(user auth.User) authUser {
	return authUser{ID: user.ID, Email: user.Email, Role: user.Role, DisplayName: user.DisplayName}
}
