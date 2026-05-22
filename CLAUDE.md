# Project Rules (Диплом)

## Tooling
- **Biome** — mandatory lint+format. Run `biome check` before commit.
- **TypeScript** — strict. No `as any`. No `@ts-ignore`.
- **Tests** — `bun test` must pass for affected areas.

## Code Quality
- **File cap**: 150 LOC max per source file (excludes tests, generated code).
- **Complexity**: cyclomatic complexity < 10 per function. Run `ast-metrics` before large refactors.
- **No raw SQL in routes** — keep SQL in db/ or repository layer.
- **No `console.log` in src/** — use logger contract (single-arg).

## Subagent Discipline
- Worker writes code + runs acceptance.
- Test subagent verifies acceptance, edge coverage, no test-only fixes.
- Architect (Opus) reviews structure.
- Critic (Sonnet) reviews rules + biome + complexity.
