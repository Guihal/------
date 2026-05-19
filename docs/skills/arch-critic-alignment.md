# Skill: arch-critic-alignment

**Status: MERGED into operator-loop + spec-drift-guard + constitution. Not a standalone skill.**

This document is retained as reference for the 5-point architect checklist and split verdict analysis. The checklist items (CLEANUP, SoC, CONFIG, TEST, SPEC_DRIFT) are injected into the architect prompt in `~/.claude/skills/kimi-operator-loop/SKILL.md`. The spec-drift detection portion merges into `/spec-drift-guard` skill. The split_rate metric is in `~/.claude/skills/system-constitution/SKILL.md` Limits table.

Trigger: split verdict — architect ok=TRUE, critic ok=FALSE on same packet/round.

## Problem

Architect reviews spec compliance ("does the code match the intent?").
Critic reviews code-level rules ("does the code compile, test, and follow constraints?").
When both run on the same diff, systematic gaps emerge where architect passes and critic blocks.

## Evidence from HR-REMAINING operator log

### Pattern 1: Cleanup / side-effect orphans (HR-W12 r0)
- Architect: ok=TRUE, "minor checklist staleness vs spec v2 tool names, no blockers"
- Critic: 3 blockers — all cleanup defects:
  - (a) `tests/migrate-tasks-from-memory.test.ts` orphan imports from deleted scripts → `bun test --bail` fail
  - (b) `scripts/rollback-migration.ts` dangling type-import
  - (c) `scripts/check-file-size.ts:73` stale `TRANSITIONAL_WHITELIST` row
- **Bias**: architect scans "what was added", misses "what was broken by deletion"

### Pattern 2: SoC / repository layer gaps (HR-W10 r0)
- Architect: ok=true, fix_target=spec (packet-context bookkeeping, not wave spec)
- Critic: 1 blocker — "SoC ProjectMonitorsRepository missing"
- **Bias**: architect sees feature completeness, misses architectural boundary enforcement

### Pattern 3: Config / constant drift (HR-W11 r1)
- Architect: still cooking (no verdict yet, but r1 was spec-fix round)
- Critic: 1 blocker — `TOOL_TIMEOUTS` missing `web_browser_restart` entry (falls back to 5000ms instead of web_* scope 15000ms)
- **Bias**: config tables treated as "implementation detail", not checked against rule cross-references

### Pattern 4: Spec drift misclassified as impl bug (HR-W10)
- Architect routed fix_target=spec for "packet-context bookkeeping, not wave spec"
- Critic routed fix_target=impl for "SoC ProjectMonitorsRepository missing"
- **Same underlying issue**: spec did not define repository boundary → both spec and impl at fault

## Systematic bias summary

| What critic finds | What architect misses | Root cause |
|---|---|---|
| Orphan imports, dangling refs, stale rows | Deletion side-effects | Architect reads added files; critic runs `bun test` + grep |
| Missing repository / SoC boundary | Architectural boundary gaps | Architect checks feature completeness, not layer separation |
| Config constant mismatches (timeouts, whitelists) | Cross-reference validation | Architect reviews prose spec; critic reviews code + rule tables |
| Test failures from import breakage | Test hygiene | Architect does not run tests; critic runs `bun test --bail` |

## Skill specification

### Option A: Strengthen architect prompt (recommended)

Add to architect review checklist:

```
Before declaring ok=TRUE, verify:
1. [CLEANUP] If any files were deleted in this diff, grep for orphan imports/refs.
2. [SoC] Every new domain entity has a corresponding Repository in db/tables/.
3. [CONFIG] Every new tool/constant added to a config table has matching entry in:
   - TOOL_TIMEOUTS (if tool)
   - TRANSITIONAL_WHITELIST (if file path)
   - Any other rule-referenced lookup table
4. [TEST] Run `bun test --bail` on affected test files; fail = blocker.
5. [SPEC_DRIFT] If the implementation required a spec patch to pass, classify:
   - "spec was incomplete" → fix_target=spec
   - "impl deviated from spec" → fix_target=impl
   - "both" → fix_target=both (triggers spec patch + impl fix)
```

### Option B: Critic classification prompt

When critic finds a blocker, classify in verdict JSON:

```json
{
  "blockers": [
    {
      "description": "...",
      "category": "code_bug|spec_drift|cleanup|soc_boundary|config_drift",
      "fix_target": "impl|spec|both",
      "would_architect_catch": "yes|no|maybe"
    }
  ]
}
```

Operator uses `would_architect_catch: no` to extend packet-context with the missing check for next round.

## Usage pattern

1. On split verdict, operator logs the pattern to `.operator-tick.<wave>.log` with tag `SPLIT_VERDICT:<pattern>`.
2. Weekly retro aggregates tags; if any pattern >= 2 occurrences, apply Option A to architect prompt.
3. If pattern persists after prompt patch, escalate to constitution-patch (role-rights review: should architect run tests?).

## Trigger conditions

- `arch.ok == true && critic.ok == false` in same packet/round
- `critic.fix_target == "impl" && arch.fix_target == "spec"` (disagreement on root cause)
- `critic.blockers[].category in ["cleanup", "soc_boundary", "config_drift"]`

## Files

- Source log: `/usr/projects/subbrain/.operator-tick.HR-REMAINING.log`
- This skill: `/usr/projects/Диплом/docs/skills/arch-critic-alignment.md`
