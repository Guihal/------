package auth

import (
	"context"
	"errors"
)

func (s *Service) Refresh(ctx context.Context, refreshToken string, ip string) (AuthResponse, error) {
	hash := HashRefreshToken(s.refreshKey, refreshToken)
	session, err := s.repo.SessionByRefreshHash(ctx, hash)
	if err != nil {
		return AuthResponse{}, ErrUnauthorized
	}
	if session.RevokedAt != nil {
		s.auditRefreshReuse(ctx, session, ip)
		return AuthResponse{}, ErrUnauthorized
	}
	if !session.ExpiresAt.After(s.now().UTC()) {
		return AuthResponse{}, ErrUnauthorized
	}
	nextRaw, err := NewRefreshToken()
	if err != nil {
		return AuthResponse{}, err
	}
	nextHash := HashRefreshToken(s.refreshKey, nextRaw)
	next, err := s.repo.RotateSession(ctx, session, nextHash, s.now().UTC().Add(s.refreshTTL))
	if err != nil {
		if errors.Is(err, ErrUnauthorized) {
			s.auditRefreshReuse(ctx, session, ip)
			return AuthResponse{}, ErrUnauthorized
		}
		return AuthResponse{}, err
	}
	return s.authResponse(next.User, nextRaw)
}

func (s *Service) auditRefreshReuse(ctx context.Context, session SessionRecord, ip string) {
	_ = s.repo.RevokeFamily(ctx, session.FamilyID)
	_ = s.repo.Audit(ctx, AuditEvent{UserID: &session.UserID, Action: "auth.refresh_reuse", IP: ip})
}

func (s *Service) Logout(ctx context.Context, refreshToken string, userID string, ip string) error {
	hash := HashRefreshToken(s.refreshKey, refreshToken)
	session, err := s.repo.SessionByRefreshHash(ctx, hash)
	if err != nil {
		return ErrUnauthorized
	}
	if session.UserID != userID {
		return ErrUnauthorized
	}
	if err := s.repo.RevokeSession(ctx, session.ID); err != nil {
		return err
	}
	return s.repo.Audit(ctx, AuditEvent{UserID: &session.UserID, Action: "auth.logout", IP: ip})
}

func (s *Service) issuePair(ctx context.Context, user User, familyID string, ip string) (AuthResponse, error) {
	raw, err := NewRefreshToken()
	if err != nil {
		return AuthResponse{}, err
	}
	hash := HashRefreshToken(s.refreshKey, raw)
	if _, err := s.repo.CreateSession(ctx, user, hash, familyID, s.now().UTC().Add(s.refreshTTL)); err != nil {
		return AuthResponse{}, err
	}
	return s.authResponse(user, raw)
}

func (s *Service) authResponse(user User, refresh string) (AuthResponse, error) {
	access, expires, err := s.tokens.Sign(user)
	if err != nil {
		return AuthResponse{}, err
	}
	return AuthResponse{AccessToken: access, RefreshToken: refresh, ExpiresAt: expires, User: user}, nil
}

func (s *Service) recordFailedLogin(ctx context.Context, email string, ip string) {
	key := normalize(email)
	if key == "" || !s.failures.Add(key) {
		return
	}
	_ = s.repo.Audit(ctx, AuditEvent{
		Action:  "auth.login_failure_threshold",
		Details: map[string]any{"email_hash": HashSubject(key)},
		IP:      ip,
	})
}
