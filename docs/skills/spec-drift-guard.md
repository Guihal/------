# spec-drift-guard

Detect and route spec drift — divergence between executor implementation and current spec version.

## Problem

Spec drift occurs when:
1. **Checklist staleness** — executor checklist references old tool names / file paths / patterns that changed in spec v2+
2. **Config drift** — runtime defaults (timeouts, URLs, keys) diverge from compose / config files
3. **Implicit fallback** — missing spec entry → executor guesses, critic flags as bug, but root cause = spec gap
4. **Round-trip waste** — packet cycles r1/r2 because spec mismatch, not code defect

## Triggers

Operator → spec review (not fix dispatch) when ANY of:

| Trigger | Evidence | Source |
|---------|----------|--------|
| T1: arch notes spec version mismatch | arch ok=TRUE with notes mentioning spec version mismatch | architect verdict |
| T2: critic blocker references deleted/renamed symbol | orphan imports, dangling type-imports, stale whitelist rows | critic verdict |
| T3: fix_target=spec in verdict | architect or critic explicitly routes to spec | verdict JSON |
| T4: same packet needs r2 after r1 was "spec fix" | spec_fix_count > 0 and still failing | operator state |
| T5: config parity test fails | bifrost-config-parity, MODEL_MAP mismatch, env defaults vs compose | CI / audit |
| T6: tool timeout / scope mismatch | missing web_browser_restart entry → fallback to wrong scope | critic rule violation |

### H1-H4 mitigation (routing holes patched)

| Hole | Mitigation |
|------|------------|
| H1: arch rephrases ("checklist outdated" vs "spec v2") | Fuzzy match: keywords "stale", "outdated", "drift", "mismatch" in notes → T1 trigger |
| H2: operator manual verification | Auto-verify: `git grep` deleted symbol; if 0 hits → false positive, route as code_bug |
| H3: env defaults vs compose | Extend T5/T6: compare `.env.defaults`, `docker-compose.yml`, runtime config table |
| H4: drift in packet README | Executor reads `docs/specs/<packet>.md` + `README.md` in packet dir; drift in either = spec drift |

## Routing Logic

```
IF T1 or T3:
  → route to spec_fix (executor patches spec docs, not code)
  → DO NOT dispatch r1 fix-executor; spec patch first

IF T2 and auto-verify confirms orphan is real (git grep = 0 hits):
  → extended packet-context (+paths, +round_1_extensions field)
  → THEN dispatch r1 with spec_fix_count++

IF T4 (spec_fix_count > 0, still failing):
  → escalate to strategic review (not another r1)
  → possible causes: spec patch incomplete, or spec itself wrong

IF T5 or T6:
  → config drift = spec drift subtype
  → route to spec patch + config parity test update
```

## Prompt Templates

### For Operator (detect)

```
Before dispatching r1 for packet <id>, check:
1. Did architect mention "staleness", "spec v", "checklist", "outdated" in notes?
2. Did critic flag orphan imports / dangling types / stale rows?
3. Is fix_target=spec in either verdict?
4. Has this packet already had a spec_fix round?

If ANY true → label packet "spec_drift_suspected" and route to spec-review
instead of fix-dispatching.
```

### For Executor (stay aligned)

```
Before coding, verify your checklist against CURRENT spec:
- Read docs/specs/<packet>.md (not cached / not memory)
- If packet dir has README.md — read it too
- Check tool names, file paths, config keys match spec v2+
- Cross-reference env defaults vs compose if adding config
- If spec ambiguous → STOP, ask operator for clarification
- Do NOT guess fallback values (timeouts, URLs, scopes)
```

## Who Catches What

| Role | Catch | How |
|------|-------|-----|
| **Arch** | T1, T3 | Notes field in verdict, fix_target routing |
| **Critic** | T2, T6 | Blocker text (operator parses, не critic classifies) |
| **Operator** | T4, T5 | spec_fix_count tracking, config parity CI |
| **Strategic Review** | T4 escalation | drift_score trend, cross-packet pattern |

## Anti-patterns

- Do NOT treat spec_drift as code_bug → wastes r1/r2 cycles
- Do NOT auto-patch spec without executor context — spec change may break other packets
- Do NOT ignore arch "minor" notes — checklist staleness accumulates
- Do NOT duplicate constitution content — reference link instead. See system-constitution: Док-дрифт сверху, Documentation drift, Role rights (executor never edits spec)
