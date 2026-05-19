# Executor Commit Nudge

Soft behavioral skill для Kimi/Claude executors. Предотвращает "refine forever" hang без hard time limit.

## Problem (evidence from HR-REMAINING wave)

| Wave | Round | Max Elapsed | Outcome |
|------|-------|-------------|---------|
| HR-W11 r1 | 5 polls | 26:14 | Never committed, operator respawned r2 (1-line fix, 3-4 min) |
| HR-W12 r0 | 12 polls | 55:42 | "refining during acceptance" — files refreshed at 23:15 but no commit until operator intervention |

Observed hang signatures in operator tick log:
- `elapsed 26:14, no commit. claude+ast-metrics+node tree alive`
- `elapsed 55:42. Files refreshed ts 23:15 (delta from 22:37-22:38) — executor refining during acceptance. Tests 379 LOC. 5 fixtures + README present.`

Root cause: executor достигает "good enough" состояния (tests pass, files written) но продолжает полировать вместо коммита. No external signal says "stop now".

## When to trigger

### Before dispatch (injected into executor prompt)
Always — skill text appended to task packet prompt as behavioral preamble.

### During poll (operator-side nudge)
When operator detects pattern in tick log:
- `elapsed > 15min` + `no commit` + process `alive`
- `refining during acceptance` detected (files refreshed but no commit)
- `claude+ast-metrics+node tree alive` (executor busy with tooling, not idle)

Send nudge via sidechannel or prepend to next prompt.

## Skill text (what the executor sees)

```
---
COMMIT CHECKPOINT — read before every tool call after 10 minutes of work
---

You have been working on this task for a while. Before the next edit, ask:

1. Does `git status` show changes that satisfy the task spec?
2. Do tests pass (run them now if unsure)?
3. Are there any TODO/FIXME comments left that block commit?

If YES to #1 and #2 → COMMIT NOW with a descriptive message.
  Commit LOCALLY ONLY. Do NOT push to remote.
  Do not "polish one more thing." Do not "just check one more edge case."
  The critic round will catch what you missed. Your job is to land the
  implementation, not to perfect it in isolation.

If NO → fix the blocker, then commit immediately after.

If stuck on a blocker > 5 min → commit what you have with "WIP: <blocker>"
  and let the operator decide next step.

---
```

## How operator uses it

### Pre-dispatch (recommended)
Append skill text to executor prompt template. Kimi executors get it as part of every task packet. Zero runtime overhead.

### Runtime nudge (when hang detected)
Operator tick script detects `elapsed > 15min && no commit`:
1. Write `.nudge-commit` file in repo root; executor checks it every 5 min
2. Or: prepend skill text to next prompt in the same session

### Post-hang (recovery)
If executor marked lost after 2 silent heartbeats:
- Do NOT respawn blindly
- Check `git status` in executor worktree first
- If changes exist → commit as-is, spawn critic on that commit
- If no changes → respawn with skill text reinforced in prompt

## Anti-patterns this prevents

| Pattern | Evidence | Why it happens |
|---------|----------|----------------|
| Refining during acceptance | Files refreshed, tests written, no commit | Executor thinks "almost done" and keeps polishing |
| Tool loop hang | `claude+ast-metrics+node tree alive` for 20+ min | Running analysis tools instead of committing results |
| Silent death | Process alive but no output | Executor stuck in internal reasoning loop |

## Why soft nudge, not hard timeout

Hard timeout kills work in progress — lost commits, partial fixes, wasted tokens. Soft nudge:
- Respects variable task complexity (some tasks legitimately need 30+ min)
- Leverages executor's own judgment (it knows when it's done)
- Allows operator to see *what* the executor was doing when nudged
- Reduces to "commit checkpoint" habit, not external enforcement

## Verification

After deploying this skill, operator tick log should show:
- Fewer `elapsed > 15min, no commit` entries
- More commits with elapsed 5-10 min (executor commits when done, not when forced)
- `refining during acceptance` pattern eliminated
