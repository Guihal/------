package httpserver

import (
	"net/http"
	"time"

	"taskcompanion/backend/internal/auth"
)

// refreshCookieName carries the refresh token for browser clients (admin SPA).
// It is httpOnly so JS can never read it — RULES.md forbids storing secrets in
// localStorage/sessionStorage. Native clients keep sending the token in the
// JSON body and ignore this cookie.
const refreshCookieName = "admin_rt"

type AuthHandlers struct {
	service      *auth.Service
	refreshTTL   time.Duration
	cookieSecure bool
}

type authRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"display_name"`
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

type authUser struct {
	ID          string `json:"id"`
	Email       string `json:"email"`
	Role        string `json:"role"`
	DisplayName string `json:"display_name"`
}

type authResponse struct {
	AccessToken  string   `json:"access_token"`
	RefreshToken string   `json:"refresh_token"`
	ExpiresAt    string   `json:"access_expires_at"`
	User         authUser `json:"user"`
}

func NewAuthHandlers(service *auth.Service) AuthHandlers {
	return AuthHandlers{service: service}
}

func (h AuthHandlers) Register(w http.ResponseWriter, r *http.Request) {
	var request authRequest
	if !decodeJSONBody(w, r, &request) {
		return
	}
	response, err := h.service.Register(r.Context(), request.Email, request.Password, request.DisplayName, clientIP(r))
	h.writeAuthResult(w, r, response, err, http.StatusCreated)
}

func (h AuthHandlers) Login(w http.ResponseWriter, r *http.Request) {
	var request authRequest
	if !decodeJSONBody(w, r, &request) {
		return
	}
	response, err := h.service.Login(r.Context(), request.Email, request.Password, clientIP(r))
	h.writeAuthResult(w, r, response, err, http.StatusOK)
}

func (h AuthHandlers) Refresh(w http.ResponseWriter, r *http.Request) {
	var request refreshRequest
	if !decodeJSONBody(w, r, &request) {
		return
	}
	response, err := h.service.Refresh(r.Context(), request.RefreshToken, clientIP(r))
	h.writeAuthResult(w, r, response, err, http.StatusOK)
}

func (h AuthHandlers) Logout(w http.ResponseWriter, r *http.Request) {
	var request refreshRequest
	if !decodeJSONBody(w, r, &request) {
		return
	}
	if err := h.service.Logout(r.Context(), request.RefreshToken, CurrentClaims(r).Subject, clientIP(r)); err != nil {
		writeAuthError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h AuthHandlers) Me(w http.ResponseWriter, r *http.Request) {
	user, err := h.service.Me(r.Context(), CurrentClaims(r).Subject)
	if err != nil {
		writeAuthError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, mapUser(user))
}

func (h AuthHandlers) writeAuthResult(w http.ResponseWriter, r *http.Request, result auth.AuthResponse, err error, status int) {
	if err != nil {
		writeAuthError(w, r, err)
		return
	}
	writeJSON(w, status, mapAuth(result))
}
