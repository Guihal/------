# Constitution Consistency Review

**Reviewer:** kimi-research team, task #8
**Scope:** 4 tactical skills vs. system-constitution SKILL.md
**Date:** 2026-05-19

---

## 1. Role Boundaries — No Blur Detected

All 4 skills stay within their role lanes:

| Skill | Role | Constitution Check |
|---|---|---|
| `executor-commit-nudge` | Operator-side prompt injection | Operator writes docs only — nudge text is operator prompt template, not executor code. OK. |
| `arch-critic-alignment` | Operator/architect coordination | Recommends prompt strengthening for architect; no architect write access granted. OK. |
| `spec-drift-guard` | Operator routing logic | Classifies drift signals; routing stays operator's decision. OK. |
| `operator-cleanup` | Operator housekeeping | File-system hygiene (bind files, locks, zombies). No code mutations. OK. |

No skill grants cross-role write permissions or lets one role perform another's core duty.

## 2. Role Rights Table — Architect "Test Running" Question

`arch-critic-alignment` systematic-bias table states: "Architect does not run tests; critic runs `bun test --bail`." This is **observation**, not duty assignment. Constitution Role Rights table says architect "Reads: spec docs, git diff, ADRs" and "Cannot write: anything" — it does **not** say architect cannot *run* tests. However, constitution Bounded Context says architect gets "spec docs + git diff (+ ADRs at depth=complex). НЕ full codebase, НЕ test logs." Test logs are critic's domain.

**Verdict:** `arch-critic-alignment` does not *grant* architect test-running duty; it documents an existing gap. No constitution violation. The skill's Option A (strengthen architect prompt with "ask operator to run tests before verdict") keeps architect read-only and delegates execution to operator — consistent with role rights.

## 3. Duplication — Minor Drift Risk in `spec-drift-guard`

`spec-drift-guard` repeats constitution concepts:
- "Documentation drift → правится spec, не игнорируется" (constitution Principle: "Док-дрифт сверху")
- "Executor не переписывает spec под свою реализацию" (constitution anti-pattern)

These are **necessary context** for the routing table (operator/executor/critic prompts), not verbatim copies. Risk is low because `spec-drift-guard` references the principle rather than duplicating the rule text. Still, constitution Anti-patterns section explicitly warns: "Дублирование constitution content в tactical skill → drift across copies." Recommend adding a single-line reference link to constitution instead of inline restatement.

## 4. Amendment Need — None Required

All 4 skills are purely tactical:
- `executor-commit-nudge` — behavioral prompt engineering
- `arch-critic-alignment` — prompt strengthening + classification
- `spec-drift-guard` — routing heuristic
- `operator-cleanup` — operational hygiene checklist

None introduce new invariants, role rights, or loop models. No constitution amendment needed.

## 5. Role Collapse Risk — `executor-commit-nudge`

**Question:** Could the nudge make executors self-policing beyond their role?

The skill injects text reminding executor to "commit early and often" and "signal blockers." This is **meta-behavioral guidance**, not structural policing. Executor still writes only `allowed_write_paths`, still does not read spec docs, still does not route decisions. The nudge does not ask executor to review their own work architecturally or criticize their own diff.

**Verdict:** Low collapse risk. The nudge is within executor's bounded context (packet execution hygiene). It does not encroach on critic mismatch-detection or operator flow-control duties.

---

## Summary

| Check | Result |
|---|---|
| Role boundary blur | None found |
| Architect test-running duty | Not granted; gap documented only |
| Constitution duplication | Minor in `spec-drift-guard`; recommend reference-link refactor |
| Amendment needed | No |
| Role collapse risk | Low; `executor-commit-nudge` is safe |

**Single recommendation:** In `spec-drift-guard`, replace inline restatements of constitution principles with `> See system-constitution: <principle-name>` references to reduce drift surface.
