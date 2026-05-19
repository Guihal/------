# Анализ ошибок Kimi-агентов и предложения по улучшению конституции

## Источники

- `/usr/projects/subbrain/.operator-tick.HR-REMAINING.log` — операторный лог tick'ов (173KB, ~500 tick'ов)
- `/usr/projects/subbrain/docs/audit/full-code-audit-2026-05-07.md` — полный аудит кода (10 P0-P2 багов)
- `/usr/projects/subbrain/docs/audit/test-audit-2026-05-07.md` — аудит тестов (164 файла, 18 проблемных)
- `/home/guihal/.claude/skills/system-constitution/SKILL.md` — текущая системная конституция
- `/home/guihal/.claude/logs/subbrain-ping.log` — summary notes сессий

---

## 1. Паттерны ошибок агентов (из operator-tick логов)

### 1.1. Executor hangs — "no commit" (наиболее частый)

**Symptom:** Executor запущен, процесс жив (claude+ast-metrics+node tree alive), но коммита нет десятки минут.

**Evidence:**
- `HR-W12 r0 elapsed 47:41, no commit`
- `HR-W11 r1 elapsed 26:14, no commit`
- `HR-W4b exec 1007043 elapsed 16min — claude+ast-metrics running, still active`
- `HR-W12 r0 elapsed 55:42. Files refreshed ts 23:15 — executor refining during acceptance`

**Root cause hypotheses:**
1. Executor (Kimi/K2.6) застревает в цикле "почти готово" — делает мелкие правки, запускает тесты, не проходит, правит снова. Acceptance criteria висят в подвешенном состоянии.
2. Packet context слишком широкий — executor тратит время на рефайнинг вместо коммита.
3. Нет жёсткого wall-time бюджета на executor.

**Constitution gap:** Нет `MAX_EXECUTOR_WALL_TIME`. Есть `MAX_ROUNDS=5` для critic loop, но нет лимита на время жизни executor.

---

### 1.2. Critic blockers — split verdicts

**Symptom:** Critic находит blockers, architect считает ok. Расхождение между arch и critic.

**Evidence:**
- `critic ok=FALSE 3 blockers; architect still cooking` (W9 r0)
- `critic_W11-r1 verdict received ok=FALSE 1 blocker: TOOL_TIMEOUTS missing web_browser_restart entry` — Rule 3+Rule 11 violation
- `HR-W12 r0 verdicts: arch ok=TRUE (minor checklist staleness), critic ok=FALSE — 3 blockers: (a) orphan imports, (b) dangling type-import, (c) stale TRANSITIONAL_WHITELIST row`
- `HR-W10 verdicts: arch ok=true fix_target=spec, critic ok=false 1 blocker (SoC ProjectMonitorsRepository missing)`

**Pattern:**
- **Type A — Spec drift:** arch не видит что spec устарел (checklist staleness), critic ловит реальные нарушения rules.
- **Type B — Scope omission:** executor пропустил файл/тест/скрипт (orphan imports, dangling import, missing repository).
- **Type C — Rule violation:** конкретное нарушение guardrail (TOOL_TIMEOUTS, deep-import, file-size).

**Constitution gap:**
- Critic читает git diff + repo rules, НЕ spec docs. Когда spec устарел, critic ловит symptoms, не root cause.
- Нет механизма "critic signals spec drift → arch re-review spec".

---

### 1.3. Architect "still cooking" — hang

**Symptom:** Architect process жив, но вердикт не выдаётся часами.

**Evidence:**
- `architect still cooking (950213 alive)`
- `arch elapsed 3:53`
- `arch elapsed 02:58`

**Root cause:** Architect (kimi-claude-role architect -p) — read-only роль, но видимо Kimi зависает в анализе diff или ждёт ввода.

**Constitution gap:** Нет `MAX_ARCHITECT_WALL_TIME`. Architect не должен висеть бесконечно.

---

### 1.4. Stale bind file race

**Symptom:** `.kimi-active.<PID>` файл остаётся после чистого выхода critic/executor.

**Evidence:**
- `Stale bind file .kimi-active.1363394 cleaned (critic exited cleanly but bind file left over by trap-on-exit race)`

**Root cause:** Trap-on-exit race condition в `kimi-claude-role` wrapper'е. Процесс умирает до того как trap срабатывает.

**Constitution gap:** Physical rails не покрывают cleanup race. Нужен separate cleanup process или operator-side stale detection.

---

### 1.5. Attempt-2 respawns — executor failure recovery

**Symptom:** Executor r0 не справился, запущен attempt-2.

**Evidence:**
- `W6/W8/W10 r0 attempt-2 respawns`
- `W4-aliases r0a2`
- `HR-W4-aliases r0a2 verdict route → spec_fix #2 + r1 dispatch`

**Pattern:** Некоторые пакеты требуют 2+ попыток executor'а. Это нормально для сложных задач, но:
- Нет explicit tracking "why r0 failed" — operator не записывает причину.
- Нет механизма "after 2 executor failures → split packet or escalate".

---

### 1.6. Spec-fix loop — consecutive spec patches

**Symptom:** Один и тот же пакет требует множественных spec-fix'ов.

**Evidence:**
- `spec_fix_count 0→1` (W12)
- `W4-aliases r0a2 verdict route → spec_fix #2 + r1 dispatch`

**Constitution gap:** Есть `spec-fix-guard 2 consecutive → escalate`, но в логе нет evidence escalation'а. Возможно guard не срабатывает или threshold слишком высокий.

---

### 1.7. Kimi-claude launcher failures

**Symptom:** `timeout: не удалось выполнить команду «kimi-claude»: Нет такого файла или каталога`

**Evidence:** Почти КАЖДЫЙ tick содержит эту ошибку. Но tick продолжает работать (exit=0). Значит launcher пытается запустить kimi-claude для чего-то, но команда не найдена.

**Root cause:** `kimi-claude-role` script в `~/.local/bin/kimi-claude-role` работает, но `kimi-claude` (без -role) не найден. Возможно operator loop вызывает `kimi-claude` напрямую вместо `kimi-claude-role`.

---

## 2. Системные баги найденные аудитом (не агент-специфичные)

### P0 — Race conditions
1. **Night-cycle watchdog** — overlapping DB-mutating cycles, не abort'ит старый run
2. **RAG vector search leak** — `layer="log"` не фильтрует по `agentId`/`sessionId` в векторной ветке

### P1 — Config drift / wiring bugs
3. **Chat route drops MemoryService** — `initDeps()` создаёт `ChatService` с `memoryService`, но `createApp()` его не использует
4. **Night-cycle silent skip** — archive embed failure возвращает `true`, прогресс advance'ится, raw logs не retry
5. **OpenAI-compat URL mismatch** — `cliproxy:8080` vs `cliproxy:8317`
6. **Bifrost config drift** — `MODEL_MAP` указывает `deepseek-ai/deepseek-v4-pro`, Bifrost config — `z-ai/glm-5.1`

### P2 — Test hygiene
7. **6 runner-orphaned files** — `console.assert` + `process.exit()`, zero `expect()`, silently green
8. **Mock-the-world wrappers** — `telegram-tools.test.ts`, `telegram-notify.test.ts`
9. **Broken impl tests** — `error-handler.test.ts` reimplements `onError` inline

---

## 3. Предложения по улучшению конституции

### 3.1. Добавить Executor Time Budget

```
| Limit | Symptom | Treatment |
|---|---|---|
| Executor hang | elapsed >30min, no commit | MAX_EXECUTOR_WALL_TIME=30min; after timeout: kill, capture partial diff, split packet or escalate |
```

**Why:** Executor'ы Kimi регулярно висят >30min без коммита. Сейчас operator делает "Poll only" бесконечно.

**How to apply:** Operator tick при `elapsed > MAX_EXECUTOR_WALL_TIME`:
1. Kill executor process
2. Capture whatever files changed (git diff vs base)
3. If partial progress exists → split remaining work into smaller packet
4. If zero progress → escalate to user

---

### 3.2. Добавить Architect Time Budget

```
| Limit | Symptom | Treatment |
|---|---|---|
| Architect hang | arch elapsed >10min, no verdict | MAX_ARCHITECT_WALL_TIME=10min; after timeout: kill, mark verdict as "timeout/inconclusive", route to user review |
```

**Why:** Architect (read-only роль) висят часами. Это блокирует wave progress.

---

### 3.3. Усилить Spec-Drift Detection

**Current:** Critic читает git diff + repo rules. Не видит spec docs.

**Problem:** Когда spec устарел, critic ловит symptoms (orphan imports, missing files), а не root cause (spec не описывает reality).

**Proposal:** Добавить 5.5-loop:

```
| Loop | Question | Owner | Mechanism |
|---|---|---|---|
| Spec-drift | spec описывает reality? | critic + architect hybrid | When critic finds "rule violation that looks like spec omission" → signal `suspected_spec_drift`. Architect reviews spec vs diff. Verdict: `fix_target ∈ {impl, spec, both}` |
```

**Trigger:** Critic находит blockers типа:
- Missing file that should exist per architecture
- Orphan import suggesting deleted script
- Checklist staleness

→ Critic добавляет поле `suspected_spec_drift: true` в вердикт.
→ Operator НЕ dispatch'ит r1 fix сразу. Сначала spawn architect для spec review.

---

### 3.4. Добавить Bind-File Cleanup Protocol

**Current:** `trap-on-exit` в wrapper'е. Race condition при быстром exit.

**Proposal:** Operator-side stale detection:

```
Every tick:
  For each .kimi-active.<PID> file:
    If PID not in `ps` → delete file, log "stale bind cleaned"
    If PID exists but elapsed > MAX_ROLE_TIME → mark suspicious, log for review
```

---

### 3.5. Уточнить Spec-Fix Guard

**Current:** `spec-fix-guard 2 consecutive → escalate`

**Problem:** В логе видно `spec_fix_count 0→1`, но не видно escalation'а. Возможно:
1. Guard не срабатывает потому что spec-fix'ы разных типов (не "consecutive same-type")
2. Guard срабатывает но operator игнорирует
3. Threshold=2 слишком высокий для Kimi (K2.6 часто делает мелкие spec-правки)

**Proposal:**
```
spec-fix-guard:
  threshold: 2 consecutive spec-fix dispatches for SAME packet
  OR: 3 total spec-fix dispatches across wave (any packets)
  action: STOP wave, surface to user with evidence
```

---

### 3.6. Добавить Kimi-Specific Physical Rails

**Current:** Constitution говорит "weak/chaotic models (kimi-K2.6) need physical rails" но не описывает конкретные failure modes.

**Proposal:** Добавить раздел "Known Kimi K2.6 failure modes":

```markdown
### Known Kimi K2.6 failure modes

1. **Infinite refinement loop** — Kimi делает мелкие правки, не коммитит. 
   Treatment: MAX_EXECUTOR_WALL_TIME, force commit at timeout.

2. **Scope creep via "while I'm here"** — Kimi трогает файлы вне packet.
   Treatment: pre-commit validator checks staged paths vs .packet-context.json.

3. **Silent test failure acceptance** — Kimi видит failing test, "исправляет", но test всё ещё падает. Kimi не замечает.
   Treatment: acceptance gate MUST run tests and assert exit 0. Operator verifies test output, не trust executor self-report.

4. **Architecture rewrite under the hood** — Kimi меняет imports, создаёт новые файлы, меняет структуру вместо surgical patch.
   Treatment: diff_budget_loc enforcement; file_count_max enforcement; architect review catches structural changes.

5. **Spec justification** — Kimi редактирует spec чтобы оправдать свою реализацию.
   Treatment: executor CANNOT write docs/**. Physical rails block.
```

---

### 3.7. Добавить Post-Wave Retrospective Loop

**Current:** 5 loops cover execution. Нет structured retrospective.

**Proposal:** Loop #6 — Retrospective:
```
| Loop | Question | Owner | Mechanism |
|---|---|---|---|
| Retrospective | что сломало агентов? | operator (post-wave) | Analyze: (1) which packets needed r1/r2, (2) why, (3) pattern, (4) skill/rule update needed |
```

**Output:** Автоматическое обновление `.operator-state` с `agent_failure_patterns` — feed into next wave planning.

---

### 3.8. Улучшить Split Verdict Handling

**Current:** `arch ok=TRUE, critic ok=FALSE → dispatch r1 fix`

**Problem:** Если arch систематически мягче чем critic, получаем infinite r1 loop.

**Proposal:** Добавить "verdict divergence tracking":
```
Track per-wave: count of split verdicts (arch≠critic).
If split_rate > 30% → signal "verdict calibration needed".
Options:
  a) Tighten architect criteria (architect becomes stricter)
  b) Add third opinion (second critic)
  c) Escalate to Opus (spawn-opus-critic)
```

---

## 4. Предложения по новым скиллам

### 4.1. `kimi-executor-recovery`

Skill для operator'а: что делать когда executor hang/no-commit.

```
Trigger: executor elapsed > MAX_EXECUTOR_WALL_TIME
Actions:
  1. git diff vs base → capture partial
  2. If partial progress > 50% packet → commit partial, spawn new packet for remainder
  3. If partial progress < 50% → kill, log failure pattern, respawn with narrower scope
  4. If 0 progress after 2 attempts → escalate to Opus executor
```

---

### 4.2. `spec-drift-detector`

Skill для critic'а: как определить что rule violation — symptom spec drift.

```
When critic finds blockers, classify each:
  - Type A: code bug (executor forgot import, wrong logic) → fix_target=impl
  - Type B: spec omission (spec doesn't mention file that should exist) → suspected_spec_drift=true
  - Type C: rule violation (file too big, deep import) → fix_target=impl

If any Type B → critic verdict includes `suspected_spec_drift: [blocker_ids]`.
```

---

### 4.3. `operator-cleanup-stale`

Skill для operator'а: cleanup stale resources.

```
Every tick, before dispatch:
  1. Clean stale .kimi-active.* files (PID check)
  2. Clean stale .operator-state.*.lock files
  3. Check for zombie claude processes (ast-metrics, node tree without parent)
  4. Log cleanup actions
```

---

### 4.4. `verdict-calibration`

Skill для operator'а: track and fix arch/critic divergence.

```
Per wave metrics:
  - unanimous_verdicts: count
  - split_verdicts: count
  - arch_false_positive: arch ok=true but r1 found real bug
  - critic_false_positive: critic ok=false but r1 found no bug

If split_rate > threshold → spawn calibration review.
```

---

## 5. Сводка приоритетов

| Priority | Item | Impact | Effort |
|---|---|---|---|
| P0 | MAX_EXECUTOR_WALL_TIME + recovery | Stops 30-50min hangs | Low (constitution edit + operator script) |
| P0 | MAX_ARCHITECT_WALL_TIME | Stops arch hangs | Low |
| P1 | Spec-drift detection loop | Reduces r1/r2 cycles | Medium (critic skill + architect trigger) |
| P1 | Bind-file cleanup protocol | Reduces resource leaks | Low |
| P1 | Strengthen spec-fix guard | Prevents infinite spec loops | Low (constitution edit) |
| P2 | Kimi failure modes doc | Prevents known mistakes | Low (constitution section) |
| P2 | Verdict calibration tracking | Improves arch/critic quality | Medium |
| P2 | Post-wave retrospective loop | Continuous improvement | Medium |
| P3 | New skills (recovery, detector, cleanup, calibration) | Automation | High |

---

## 6. Кросс-ссылки

- system-constitution: `~/.claude/skills/system-constitution/SKILL.md`
- operator-loop: `~/.claude/skills/operator-loop/SKILL.md`
- kimi-operator-loop: `~/.claude/skills/kimi-operator-loop/SKILL.md`
- operator-orchestrator: `~/.claude/skills/operator-orchestrator/SKILL.md`
- kimi-rails: `~/.claude/skills/kimi-rails/SKILL.md`
