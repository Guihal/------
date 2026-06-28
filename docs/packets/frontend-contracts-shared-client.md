# Packet P09: Frontend Contracts and Shared API Client

## Goal
Create shared frontend API client, DTO types, error mapper, and page contract conventions.

## Read First
- `docs/10-rebuild-technical-spec.md` § 9.6
- `docs/10-rebuild-technical-spec.md` § 10.1-10.2
- `docs/10-rebuild-technical-spec.md` § 13
- `docs/RULES.md`
- `docs/packets/README.md` § Архитектурный минимум для пакетов

## Scope In
- shared OpenAPI-based client or typed `ofetch` wrapper.
- auth header/refresh handling contract.
- API error mapper.
- DTO type location.
- Pinia store conventions.
- route middleware conventions for admin/mobile apps.

## Scope Out
- No backend endpoint implementation.
- No complete mobile screens.
- No admin page implementation.
- No local business logic for XP/rewards.

## Requirements
- Frontend never submits trusted server-owned fields: `user_id`, `final_xp`, `level`, `roll_value`.
- `user_id`, `final_xp`, `level`, and reward summary fields may exist in readonly response DTOs where backend returns data; they must not be accepted from normal client action payloads or computed in UI.
- Access token is memory-only.
- Refresh handling is centralized.
- Admin app uses the same memory-only access token rule.
- Admin refresh token strategy is `httpOnly Secure SameSite` cookie where possible; Bearer refresh flow is allowed only if secrets are never stored in `localStorage` or `sessionStorage`.
- UI errors use backend error format.
- Page contracts list endpoints, data shape, states and actions.
- Stores call services and do not compute business mechanics.
- Pinia is a thin state/loading/error/actions layer.
- Do not add a class wrapper over Pinia as a business layer.
- Readonly helper/view-model formatters are allowed for display-only data.

## Acceptance
- admin and mobile apps import API client from one agreed location.
- API errors are mapped to Russian UI messages.
- unauthorized/expired session path is implemented in client contract.
- `rg -n "Math.random|final_xp|roll_value" apps` is reviewed so matches are only generated readonly DTOs or response rendering, not client business logic or request payloads.
- generated request types do not require user-controlled `user_id` for protected actions.

## Escalation
- Stop if OpenAPI schema is missing for required endpoints.
- Stop if auth storage strategy differs between apps without TЗ update.
- Stop if generated types conflict with backend response shape.
