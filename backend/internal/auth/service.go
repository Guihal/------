package auth

import (
	"context"
	"errors"
	"strings"
	"time"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUnauthorized       = errors.New("unauthorized")
	ErrEmailTaken         = errors.New("email taken")
)

type Repository interface {
	CreateUser(context.Context, string, string, string) (User, error)
	UserByEmail(context.Context, string) (User, string, error)
	UserByID(context.Context, string) (User, error)
	CreateSession(context.Context, User, string, string, time.Time) (SessionRecord, error)
	SessionByRefreshHash(context.Context, string) (SessionRecord, error)
	RotateSession(context.Context, SessionRecord, string, time.Time) (SessionRecord, error)
	RevokeSession(context.Context, string) error
	RevokeFamily(context.Context, string) error
	Audit(context.Context, AuditEvent) error
}

type Service struct {
	repo       Repository
	tokens     TokenManager
	refreshKey string
	refreshTTL time.Duration
	failures   *FailureTracker
	now        func() time.Time
}

func NewService(repo Repository, tokens TokenManager, refreshKey string, refreshTTL time.Duration) *Service {
	return &Service{repo: repo, tokens: tokens, refreshKey: refreshKey, refreshTTL: refreshTTL, failures: NewFailureTracker(3, 15*time.Minute), now: time.Now}
}

func (s *Service) Register(ctx context.Context, email string, password string, name string, ip string) (AuthResponse, error) {
	if strings.TrimSpace(email) == "" || len(password) < 8 || strings.TrimSpace(name) == "" {
		return AuthResponse{}, ErrInvalidCredentials
	}
	hash, err := HashPassword(password)
	if err != nil {
		return AuthResponse{}, err
	}
	user, err := s.repo.CreateUser(ctx, email, hash, strings.TrimSpace(name))
	if err != nil {
		return AuthResponse{}, err
	}
	_ = s.repo.Audit(ctx, AuditEvent{UserID: &user.ID, Action: "auth.register", IP: ip})
	return s.issuePair(ctx, user, "", ip)
}

func (s *Service) Login(ctx context.Context, email string, password string, ip string) (AuthResponse, error) {
	user, hash, err := s.repo.UserByEmail(ctx, email)
	if err != nil || !CheckPassword(hash, password) {
		s.recordFailedLogin(ctx, email, ip)
		return AuthResponse{}, ErrInvalidCredentials
	}
	s.failures.Reset(normalize(email))
	_ = s.repo.Audit(ctx, AuditEvent{UserID: &user.ID, Action: "auth.login_success", IP: ip})
	if user.Role == RoleAdmin {
		_ = s.repo.Audit(ctx, AuditEvent{UserID: &user.ID, Action: "auth.admin_login", IP: ip})
	}
	return s.issuePair(ctx, user, "", ip)
}

func (s *Service) Me(ctx context.Context, userID string) (User, error) {
	return s.repo.UserByID(ctx, userID)
}

func (s *Service) AuditAdminDenied(ctx context.Context, userID string, path string, ip string) {
	_ = s.repo.Audit(ctx, AuditEvent{UserID: &userID, Action: "admin.role_denied", Details: map[string]any{"path": path}, IP: ip})
}

func normalize(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}
