# CEO Review: 4 Proposed Skills

## Bottom Line

Executor hangs ARE the biggest bottleneck (30-55 min lost per incident, multiple waves affected). The other 3 skills address real but secondary problems. However, 4 new skills is over-investment. Two should be merged, one should be a process change, not a skill.

---

## Per-Skill Verdict

### 1. executor-commit-nudge — RECOMMEND

**Right problem?** Yes. Evidence: HR-W11 r1 hung 26 min, HR-W12 r0 hung 55 min. Analysis doc ranks this P0.

**Cost/benefit?** High. One-line skill text injection prevents 30-50 min hangs. Low friction — operator already polls, just adds a nudge trigger.

**Scope creep?** Minimal. Stays focused: "commit when tests pass." Post-hang recovery logic is slightly beyond skill scope but acceptable.

**Simpler approach?** Constitution `MAX_EXECUTOR_WALL_TIME` (already proposed P0) would solve 80% of this without a skill. Skill adds the *behavioral* nudge, constitution adds the *hard rail*. Both needed — skill for prevention, constitution for enforcement.

### 2. arch-critic-alignment — MODIFY

**Right problem?** Partially. Split verdicts happen, but the analysis doc does not quantify frequency. The 4 patterns listed (orphan imports, SoC gaps, config drift, spec drift misclassification) are real but scattered across different root causes.

**Cost/benefit?** Medium. Option A (strengthen architect prompt) is lightweight. Option B (critic classification prompt) adds complexity. The systematic bias table is excellent diagnostic work but the skill tries to fix too many things at once.

**Scope creep?** Yes. This skill bundles: (a) architect prompt strengthening, (b) critic re-classification, (c) divergence tracking. The spec-drift portion overlaps heavily with skill #3.

**Simpler approach?** Merge the spec-drift detection portion into `spec-drift-guard`. Keep this skill focused on the architect/critic *verdict divergence* problem only. Add a metric: if split_rate > 30%, auto-escalate.

### 3. spec-drift-guard — MODIFY

**Right problem?** Yes, but lower impact than executor hangs. Spec drift causes r1/r2 cycles — wasted rounds, not wasted hours.

**Cost/benefit?** Medium effort for medium gain. The routing logic (operator detects → executor stays aligned → critic signals vs code bug) is sound but requires 3-role coordination.

**Scope creep?** The "Who Catches What" table and 3 prompt templates make this heavier than needed. The anti-pattern "do NOT treat spec_drift as code_bug" is a one-line constitution rule, not a skill.

**Simpler approach?** Collapse to: (1) operator detects checklist staleness via regex diff, (2) routes to spec-fix, (3) executor gets a pre-flight checklist validation. Remove the critic-prompt portion — critic should not be in the business of spec classification.

### 4. operator-cleanup — REJECT

**Right problem?** Stale bind files and zombie processes are real (evidence: trap-on-exit race, `.kimi-active.1363394` leftover).

**Cost/benefit?** Negative. This is a cron job, not a skill. A skill implies human-in-the-loop decision-making. Cleanup is 100% automatable.

**Scope creep?** Entire skill is scope creep. 5-item checklist (bind files, lock files, idle poll skip, zombies, stale backups) should be a 20-line bash script in the operator loop, not a skill spec.

**Simpler approach?** Replace with `operator-loop` enhancement: at tick start, run `find .kimi-active.* -not -pid-alive → rm`. Done. No skill, no human decision.

---

## Strategic Recommendation

**Ship 2 skills, not 4:**

1. `executor-commit-nudge` — as-is. This is the highest-ROI fix.
2. `spec-drift-guard` — merged with the spec-drift portion of `arch-critic-alignment`, slimmed down to operator + executor only, no critic prompt.

**Convert to process/code:**
- `operator-cleanup` → 20-line operator-loop cron snippet.
- `arch-critic-alignment` verdict divergence → constitution metric rule (split_rate threshold), not a skill.

**What would make this system truly excellent (10-star):**

1. **Auto-recovery, not auto-detection.** Every skill here detects a problem and nudges a human. The 10-star version auto-recovers: executor hang → force commit + spawn critic → no human loop.
2. **Single source of truth for failure modes.** The analysis doc lists 7 Kimi failure modes. These should live in the constitution, not scattered across skills. Skills reference constitution sections; constitution owns the taxonomy.
3. **Metrics-driven thresholds.** "2 silent heartbeats" and "split_rate > 30%" are guesses. Track actual data for 2 waves, then set thresholds. A skill without calibrated thresholds is just a heuristic.
4. **Kill the skill if the constitution can own it.** The best skill is no skill. Constitution changes propagate automatically; skills require invocation discipline. Bias toward constitution rules for anything with a clear binary trigger.

---

*Reviewed 2026-05-19. Based on error-analysis doc + 4 skill specs.*
