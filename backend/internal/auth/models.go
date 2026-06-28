package auth

import "time"

const (
	RoleUser  = "user"
	RoleAdmin = "admin"
)

type User struct {
	ID          string
	Email       string
	Role        string
	DisplayName string
}

type AuthResponse struct {
	AccessToken  string
	RefreshToken string
	ExpiresAt    time.Time
	User         User
}

type SessionRecord struct {
	ID               string
	UserID           string
	FamilyID         string
	RefreshTokenHash string
	ExpiresAt        time.Time
	RevokedAt        *time.Time
	User             User
}

type AuditEvent struct {
	UserID  *string
	Action  string
	Details map[string]any
	IP      string
}
