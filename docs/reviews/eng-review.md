# Engineering Review: 4 Skills (kimi-research #6)

## Verdict: 3 of 4 are sound but need tightening. 1 (operator-cleanup) is redundant.

---

### 1. executor-commit-nudge — CONDITIONAL GO

**Mechanism**: Soft nudge via `.nudge-commit` file or sidechannel when `elapsed > 15min && no commit`. Executor checks file every 5 min.

**Feasible?** Yes. File-based signaling is trivial to implement and survives process restarts.

**Edge case — premature commits**: Risk is LOW but non-zero. A nudge during a 20-minute legitimate refactor could force a "checkpoint commit" of broken code. Mitigation: skill text says "commit checkpoint" (not "commit now"), and executor retains judgment. **Concern**: Kimi may interpret "checkpoint" as "commit whatever you have" and push WIP. Recommend adding explicit "do NOT push to remote; commit locally only" to the skill text.

**Edge case — sidechannel fiction**: "Send sidechannel message to executor process" is aspirational. No sidechannel exists in kimi-claude. The `.nudge-commit` file is the only real mechanism. Skill should drop sidechannel mention or mark it "future".

**Implementation**: One line in operator tick script + skill text injection. No hooks/settings changes.

---

### 2. arch-critic-alignment — GO with edits

**Mechanism**: 5-point architect checklist (CLEANUP, SoC, CONFIG, TEST, SPEC_DRIFT) injected into architect prompt before verdict.

**Feasible?** Yes. Prompt injection is proven.

**Weight concern**: 5 items is NOT too heavy for Opus (architect runs Opus). For Kimi-as-architect it would be, but architect role is Opus-bound per constitution. The checklist adds ~200 tokens to an already-long prompt — negligible.

**Real concern**: Item 4 (`bun test --bail`) assumes test runner availability. In packets without tests or with different runner, this is noise. Recommend making TEST conditional: "If test files exist in diff, run `bun test --bail` on affected files."

**Evidence quality**: Strong. 4 patterns from HR-REMAINING log, all with concrete file paths. Pattern 1 (cleanup orphans) is the most frequent and justifies item 1 alone.

---

### 3. spec-drift-guard — GO with routing holes patched

**Mechanism**: 6 triggers (T1-T6) routing spec drift to spec_fix instead of impl fix.

**Feasible?** Yes. Operator state already tracks `spec_fix_count`.

**Routing holes found**:

| Hole | Case | Slips through? |
|------|------|----------------|
| H1 | Arch notes spec mismatch but still sets `ok=TRUE` without `fix_target=spec` | Yes — T1 catches "notes mention spec vX" but relies on string parsing notes field. If arch rephrases ("checklist outdated"), T1 misses. |
| H2 | Critic finds orphan import (T2) but operator fails to verify "real on disk" | Yes — operator verification is manual gate, not automated. False positive = wasted r1. |
| H3 | Config drift in env var / compose default (not in lookup table) | Yes — T5/T6 only cover table-based config. Env defaults vs compose values slip through. |
| H4 | Spec drift in packet README, not in `docs/specs/*.md` | Yes — executor prompt says "read docs/specs/<packet>.md", but drift could be in packet-level README. |

**Overlap with arch-critic-alignment**: SPEC_DRIFT item (item 5) in arch-critic-alignment is essentially T1/T3 detection at architect time. These two skills are complementary, not redundant: arch-critic-alignment prevents drift at source; spec-drift-guard catches what slips through. **Do not merge** — they operate at different phases (arch review vs operator dispatch).

---

### 4. operator-cleanup — REDUNDANT / MERGE

**Mechanism**: 5-item cleanup checklist (stale bind files, lock files, idle poll skip, zombies, stale backups).

**Feasible?** Yes, but mostly already exists.

**Overlap analysis**:

| Cleanup item | Already covered by | Delta |
|--------------|-------------------|-------|
| Stale `.kimi-active.PID` | `kimi-operator-tick` already does PID check before dispatch | None — this IS the existing tick behavior |
| Stale `.operator-state.*.lock` | Same — tick script handles lock lifecycle | None |
| Idle poll skip | Already in tick — `if idle_count > 3 then skip` | None |
| Zombie processes | `ps` check in tick health composite | None |
| Stale state backups | Not currently automated — only manual cleanup | **One real delta** |

**Verdict**: This skill documents existing behavior, not new behavior. The only novel item (stale backups) should be added to `kimi-operator-tick` script directly, not as a standalone skill. **Merge into operator-loop skill or drop.**

---

## Summary Table

| Skill | Verdict | Effort | Blockers |
|-------|---------|--------|----------|
| executor-commit-nudge | Go | 1 file + prompt text | Add "local commit only" clause; drop sidechannel fiction |
| arch-critic-alignment | Go | Prompt patch | Make TEST item conditional |
| spec-drift-guard | Go | State tracking + routing | Patch H1-H4 holes; add env-default coverage |
| operator-cleanup | Redundant | N/A | Merge stale-backups item into tick script; drop skill |

## Implementation effort

- **Hooks/settings**: None. All 4 are prompt/text skills, no harness changes.
- **Files to touch**:
  - `docs/skills/executor-commit-nudge.md` — add "local only", drop sidechannel
  - `docs/skills/arch-critic-alignment.md` — conditional TEST item
  - `docs/skills/spec-drift-guard.md` — expand T5/T6 to env defaults, add H1-H4 mitigations
  - `docs/skills/operator-cleanup.md` — **delete**; move stale-backups to operator tick script
- **Code changes**: Operator tick script gets `.nudge-commit` check + stale backup cleanup. ~20 lines.
