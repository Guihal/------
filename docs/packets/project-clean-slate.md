# Packet P00: Project Clean Slate

## Goal
Prepare the repository for rebuild by removing old implementation entrypoints and fixing project documentation pointers.

## Read First
- `docs/10-rebuild-technical-spec.md` § 1-4
- `docs/10-rebuild-technical-spec.md` § 9
- `docs/RULES.md`
- `docs/packets/README.md` § Архитектурный минимум для пакетов
- `AGENTS.md`

## Scope In
- root README and docs index consistency.
- workspace layout for:
  - `backend/`
  - `apps/admin/`
  - `apps/mobile/`
  - optional `shared/contracts/`
- removal or quarantine of old Nuxt/SQLite/offline-first implementation files.
- `.gitignore` and `.env.example` placeholders if missing.

## Scope Out
- No backend features.
- No frontend screens.
- No database migrations.
- No package install decisions beyond the mandatory stack already fixed in TЗ.

## Requirements
- Do not restore deleted old docs.
- Do not preserve old SQLite/local repository architecture as source of truth.
- New layout must make backend, admin, mobile and shared contracts visually obvious.
- Keep `docs/10-rebuild-technical-spec.md` as the only source of truth.
- Layout must support feature-first simple layering without heavy DDD ceremony.

## Acceptance
- `find docs -maxdepth 2 -type f | sort` shows only current docs and packet docs.
- `rg -n "offline-first|SQLite.*source of truth|MVP-0" README.md AGENTS.md docs` only finds text that rejects old approach.
- repo has clear empty/scaffold directories for backend/admin/mobile/shared contract work.
- no old app entrypoint is presented as current production app in README.

## Escalation
- Stop if user wants to preserve old implementation code as active source.
- Stop if deleting a file would remove unique assets needed for mascot/items.
- Stop if package manager choice is required but not yet fixed.
