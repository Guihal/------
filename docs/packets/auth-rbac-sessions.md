# Packet P03: Auth, RBAC, Sessions

## Goal
Implement email/password auth, refresh rotation, session lifecycle, and admin RBAC.

## Read First
- `docs/10-rebuild-technical-spec.md` § 7.1
- `docs/10-rebuild-technical-spec.md` § 8.1
- `docs/10-rebuild-technical-spec.md` § 9.7
- `docs/10-rebuild-technical-spec.md` § 13
- `docs/RULES.md`
- `docs/packets/README.md` § Архитектурный минимум для пакетов

## Scope In
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`
- `GET /auth/me`
- password hashing.
- access JWT.
- refresh token hash storage and rotation.
- reuse detection.
- role checks for admin endpoints.
- audit events for auth/security.

## Scope Out
- No OAuth/social login.
- No password reset email.
- No user profile UI.
- No admin user management UI.

## Requirements
- Access token is short-lived.
- Refresh token is stored in DB only as hash.
- Refresh rotates token every time.
- Reuse of revoked refresh token revokes session family and writes audit log.
- Login/register/refresh endpoints are rate-limited.
- Login errors must not leak sensitive account state.
- Admin role is `admin`; normal role is `user`.
- Audit events include login success, login failure threshold reached, admin login, admin role denial, refresh reuse, logout.
- Auth and session refresh require backend service/usecase ownership.
- Frontend storage is not business authority for session validity or role.

## Acceptance
- `cd backend && go test ./...` passes auth tests.
- register creates user, profile and progression.
- login returns valid auth response.
- refresh rotates token and revokes old token.
- reused old refresh token returns 401 and creates audit event.
- user role is denied on admin-only route.
- failed login threshold creates a security audit event without storing password/raw token.
- admin login and admin role denial are visible in audit logs.

## Escalation
- Stop if frontend storage strategy requires localStorage for secrets.
- Stop if cookie-session and Bearer-token split is introduced without updating TЗ.
- Stop if admin creation policy is unclear.
