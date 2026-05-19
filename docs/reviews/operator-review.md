# Operator Review: Skills Integration

## Integration with Tick Procedure

| Skill | Tick Phase | Integration Point | Effort |
|---|---|---|---|
| **executor-commit-nudge** | Pre-dispatch (step 5) / Runtime poll | Injected into executor prompt + operator-side nudge on hang detection | Low: one conditional check per tick, prompt injection at dispatch |
| **arch-critic-alignment** | Verdict-spawning (step 5) | Post-architect+critic, pre-routing: classify blocker category, detect `arch.ok=true && critic.ok=false` | Medium: adds classifier step to verdict routing |
| **spec-drift-guard** | Verdict-spawning / Fix-dispatching | Routes `fix_target=spec` to doc-patch instead of executor; guards `spec_fix_count` | Medium: changes routing logic, adds counter to state schema |
| **operator-cleanup** | Tick start (before step 1) | Stale `.kimi-active.PID` removal + idle-skip gate | Low: shell loop + conditional exit |

All four fit into existing phase table without new phases. `operator-cleanup` — pre-step hook; остальные — внутри step 5 dispatch logic.

## Triggers: Automatable vs Manual

**Fully automatable:**
- `operator-cleanup` stale bind files — `kill -0 $pid` check, zero judgment
- `operator-cleanup` idle poll skip — `all_done && idle_ticks > 3`, pure state gate
- `spec-drift-guard` T1/T3 (executor changes spec unilaterally) — diff scan detects
- `executor-commit-nudge` pre-dispatch injection — unconditional prompt prepend

**Requires manual / heuristic judgment:**
- `executor-commit-nudge` runtime nudge — "hang detected" = no commit in N minutes; N varies by packet complexity (hard to tune)
- `arch-critic-alignment` Option A vs B — strengthening architect prompt vs adding critic classification; operator decides per-wave
- `spec-drift-guard` T2 — operator must verify blockers are "real on disk" before extending packet-context
- `spec-drift-guard` T4 — `spec_fix_count > 0, still failing` → escalate or spec incomplete? Needs operator call

## Overhead per Tick

- **executor-commit-nudge**: +0 prompts if pre-dispatch only; +1 conditional nudge prompt if hang detected (rare)
- **arch-critic-alignment**: +0 extra agent prompts (Option A = architect prompt change; Option B = +1 JSON field in critic verdict)
- **spec-drift-guard**: +0 extra prompts (routing change only); potential +1 doc-patch commit per spec-drift event
- **operator-cleanup**: +0 prompts (shell pre-step); saves ~5.9% ticks via idle-skip

Net: near-zero prompt overhead. Main cost — state schema additions (`spec_fix_count`, `idle_ticks`).

## Conflicts with Existing Operator-Loop Behavior

1. **spec-drift-guard T4 escalation vs MAX_ROUNDS=5**: если spec-drift гоняет цикл `spec_fix → executor fail → spec_fix`, можно исчерпать раунды без прогресса. Рекомендация: `spec_fix_count` учитывать в health composite как отдельный фактор.

2. **arch-critic-alignment `would_architect_catch: no` vs bounded context**: critic не должен мутировать architect prompt. Skill предлагает "extend packet-context with missing check for next round" — это operator action, не critic action. Ok по constitution.

3. **executor-commit-nudge vs `.packet-fail.*` marker**: skill говорит "executor writes FAIL marker as last action". Commit-nudge мотивирует commit *до* fail. Нет конфликта — commit-nudge = soft, fail marker = hard boundary.

4. **operator-cleanup idle-skip vs gbrain sync**: idle-skip на tick start; gbrain sync на termination check (step 3c). Если idle-skip сработает до termination, gbrain sync откладывается до следующего tick где `all_done` всё ещё true. Ok — sync idempotent.

## Constitution Fit: 5-Loop Model and Role Rights

| Loop | Skill Coverage | Respected? |
|---|---|---|
| Local | commit-nudge → cleaner commits, fewer lost patches | Yes |
| Architectural | arch-critic-alignment → closes architect-critic gap | Yes, architect role unchanged |
| Documentation | spec-drift-guard → routes spec drift to doc-patch (operator writes docs) | Yes, executor не пишет spec |
| Operator | cleanup idle-skip → saves ticks; all skills reduce operator manual intervention | Yes |
| Strategic | spec-drift-guard T4 → escalate to strategic review | Yes, uses existing trigger |

**Role rights check:**
- Operator writes only `docs/**` + state files — spec-drift-guard doc-patch fits
- Executor writes only `allowed_write_paths` — commit-nudge не меняет пути
- Architect read-only — arch-critic-alignment Option A только prompt strengthening, не file write
- Critic read-only — Option B только classification field, не mutation

**Verdict:** все 4 skill'а совместимы с constitution. Нет contradictions. Рекомендуется adopt в порядке: `operator-cleanup` (lowest risk) → `executor-commit-nudge` → `spec-drift-guard` → `arch-critic-alignment` (highest touch on verdict routing).
