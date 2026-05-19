# Применение pipeline к Task Companion

## 1. Цель

Pipeline = 3 слоя автоматизации (plan-stage review → operator-loop wave
processor → gstack skill hooks). Без pipeline = ручная работа per-packet:
скопировал шаблон из [07-task-packet-template.md](07-task-packet-template.md),
открыл fresh chat, ждал, проверил diff, закоммитил, повторил × N. С pipeline =
«закрыл open decisions → прогнал plan-multi-review → init operator-loop wave +
cron → следить за strategic-review каждые 3 packets». Pipeline не пишет код за
юзера, но снимает ручной dispatch, verify-gate, doc-drift reconciliation,
health snapshot.

## 2. 3 слоя автоматизации

```txt
┌─────────────────────────────────────────────────────────────┐
│ L1: plan-multi-review (BEFORE wave init)                    │
│ 3-critic parallel (CEO + ENG + ARCHITECT) + DX conditional  │
│ Input: docs/specs/mvp-0.md (надо создать)                   │
│ Output: JSON {ok, unanimous_blockers, conflicts, routing}   │
│ Use: validate wave spec ДО CronCreate                       │
│ Skill: ~/.claude/skills/plan-multi-review/SKILL.md          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ L2: operator-loop (DURING wave, cron 1-min)                 │
│ Read state → decide phase → dispatch architect/worker/critic│
│ Phase machine: init → dispatching → awaiting-commit →       │
│   verdict-spawning → verdict-routing → [challenge-gate] →   │
│   fix-dispatching → init(next) → done                       │
│ Conditional: CSO (security/auth/db/migrations), Investigator│
│   (round≥2 + worker_fail), Codex Challenger (high-risk).    │
│ Health composite per packet (tsc 0.35 + test 0.35 + loc     │
│   0.15 + secrets 0.15) → rolling-3 trend                    │
│ Strategic review каждые 3 packets done                      │
│ Skill: ~/.claude/skills/operator-loop/SKILL.md              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ L3: gstack skill hooks (PER packet / etap, manual trigger)  │
│ /office-hours, /setup-deploy, /design-consultation,         │
│ /design-shotgun, /design-html, /design-review,              │
│ /devex-review, /health, /qa-only, /codex:rescue, /review,   │
│ /caveman-review, /ship, /land-and-deploy, /retro,           │
│ /document-release, /learn export                            │
└─────────────────────────────────────────────────────────────┘
```

L1 = plan-stage spec gate. L2 = impl-stage автономный wave processor с tick=1
min. L3 = ручные точки приложения gstack-навыков к стадиям проекта.

Все 3 слоя operate under единой constitution
(`~/.claude/skills/system-constitution/SKILL.md`): role rights table (operator
пишет только `docs/**`, architect read-only, executor только в
`allowed_write_paths`, critic read-only), 5-loop feedback (local /
architectural / documentation / operator / strategic).

## 3. Pre-wave: open decisions check

ОБЯЗАТЕЛЬНЫЙ gate ПЕРЕД `CronCreate`. Юзер закрывает каждый пункт ниже как
ADR-022..028 в [04-technical-decisions.md](04-technical-decisions.md). Иначе
operator-loop спавнит worker'ов в spec-ambiguity → architect возвращает
`fix_target=spec`, расход Opus впустую.

Список open decisions (источник:
[AGENTS.md § 10](../AGENTS.md), [02-architecture.md § 19](02-architecture.md)):

1. **Package manager** — bun / pnpm / npm. По умолчанию bun (CLAUDE.md global
   юзает `bunx tsc`, `bun test`). Решение влияет на lockfile + CI hooks.
2. **SQLite plugin Capacitor** — `@capacitor-community/sqlite` (кандидат) vs
   альтернативы. Подтвердить install + minimal CRUD smoke.
3. **Android SDK target** — min/target/compile version.
4. **Tests расположение** — co-located (`*.test.ts` рядом с source) vs `tests/`
   зеркало (default per AGENTS.md § 10).
5. **`src/` vs flat layout** — по умолчанию плоская (`app/`, `core/`,
   `infrastructure/`, `plugins/`) из [02-architecture.md § 5](02-architecture.md#5-предлагаемая-структура-проекта).
6. **Result lib** — ручной discriminated union `{ok: true, value}|{ok: false,
   error}` vs `neverthrow`. Default — ручной (нет dependency).
7. **Ассеты маскота** — формат + источник. MVP-1, можно отложить, но
   зафиксировать в Backlog.
8. **Web SQLite** — отдельный plugin или memory-only для browser dev. По
   умолчанию memory-only.

Команда проверки наличия pending decisions:

```bash
cd /usr/projects/Диплом
grep -nE "(Открытые решения|Open decisions|TBD|TODO|подтвердить)" AGENTS.md docs/02-architecture.md docs/04-technical-decisions.md
```

Закрытие через ADR-row:

```markdown
## ADR-022. Package manager — bun

Дата: 2026-05-19
Статус: принято

Контекст: open decision AGENTS.md § 10.
Решение: bun ≥ 1.1.x. Lockfile `bun.lock`.
Последствия: CI hooks → `bun install --frozen-lockfile`; CLAUDE.md
команды `bun test`, `bunx tsc --noEmit` без изменений.
```

Без закрытых open decisions plan-multi-review будет возвращать `routing=fix` с
unanimous-blocker «package manager not specified», цикл будет крутиться без
прогресса.

## 4. Шаг 1 — plan-multi-review pass on wave spec

**Split source-of-truth**:
- `docs/specs/mvp-0.md` — wave **spec** (meta-goal, success criteria, risk
  rationale, dispatch triggers, state schema). Vision Lead source.
- `docs/specs/mvp-0-packets.md` — packet **queue** (T01..T15 manifest table
  с deps + risk_tier + file_count_max + challenge-gate flags). Authoritative
  для operator-loop init `readme_path`.

Plan-multi-review прогоняется на ОБА файла (spec + packets) перед wave init.
Spec MUST содержать:
- Final Formula / Коротко (источник: [00-scope-map.md § «MVP-0»](00-scope-map.md#mvp-0-рабочее-ядро)).
- Success criteria (источник: [03-build-roadmap.md § 7](03-build-roadmap.md#7-definition-of-done)).
- Risk tiering rationale per packet group.
- Dispatch trigger overrides (CSO / Challenger / Investigator / Strategic).

Packets файл MUST содержать full `id` / `goal` / `deps` / `risk_tier` /
`file_count_max` / `architect` / `challenge` columns. Полные `acceptance` +
`allowed_write_paths` + `read_first` — в [07-task-packet-template.md § 3](07-task-packet-template.md)
worked examples (T01/T05/T08) либо юзер заполняет per packet при dispatch.

**DX trigger** — wave spec файл живёт в `docs/specs/`, что соответствует
plan-multi-review regex `^(api|cli|sdk|docs|examples|openapi)/` → DX critic
WILL spawn unless caller передаёт `--no-dx`. Для MVP-0 (нет public API/CLI/SDK
surface change) рекомендуется `--no-dx` явный флаг.

Открыть Claude Code в `/usr/projects/Диплом`, дать команду:

```txt
Прогони plan-multi-review на docs/specs/mvp-0.md
```

Claude (как parent) сделает:

1. ONE Agent-batch message со 3 параллельными invocations (cap=3): CEO + ENG +
   ARCHITECT, все на Opus, read-only.
2. Проверит DX trigger (regex из
   [plan-multi-review SKILL.md § «DX trigger»](file:///home/guihal/.claude/skills/plan-multi-review/SKILL.md)):
   spec touches `api/ | cli/ | sdk/ | docs/ | examples/ | openapi/`? Для MVP-0
   → нет (touch только `app/`, `core/`, `infrastructure/`, `plugins/`), DX
   skip. Если spec упомянет «public API surface» / «onboarding» — DX
   sequential spawn.
3. Merge: `ok = all critics.ok==true`, `unanimous_blockers ≥ 2 critics`,
   `conflicts` через opposite-verb table (expand vs reduce, add vs drop, etc).
4. Routing:
   - `routing=ok` → proceed к Шагу 2.
   - `routing=fix` → юзер фиксит `docs/specs/mvp-0.md` (или прилегающий
     [02-architecture.md](02-architecture.md) / [04-technical-decisions.md](04-technical-decisions.md))
     по `unanimous_blockers`, повтор pass.
   - `routing=escalate` → conflict critic'ов (e.g. CEO «expand scope»
     vs ENG «reduce file_count_max»). Юзер делает taste decision,
     записывает в ADR, повтор pass.

Output JSON (sample shape):

```json
{
  "ok": true,
  "unanimous_blockers": [],
  "conflicts": [],
  "per_critic": {
    "ceo": {"ok": true, "ambition_score": 7, "blockers": []},
    "eng": {"ok": true, "arch_concerns": [], "blockers": []},
    "architect": {"ok": true, "missing": [], "fix_target": "impl"},
    "dx": null
  },
  "routing": "ok"
}
```

После `routing=ok` → можно init operator-loop wave.

## 5. Шаг 2 — operator-loop wave init

Команда юзера в Claude Code:

```txt
Init operator-loop wave для mvp-0. Cron 1-min.
```

Skill execute init-lifecycle (`~/.claude/skills/operator-loop/SKILL.md`
§ «Lifecycle / Init»):

1. Pre-check: `.operator-state.mvp-0.json` уже exists? → ABORT
   («wave already initialised; wipe first»). Wipe команда: см. § 12.
2. Parse packets из `docs/specs/mvp-0-packets.md § 2` (manifest table, per
   wave spec § 1 `readme_path`). Convention: packet_id MUST start с
   `mvp-0-` (wipe-glob correctness). Format: `mvp-0-T<nn>-<kebab-slug>`
   lowercase.
3. Abort если 0 packets parsed.
3a. **PID lock**: write `.operator-state.mvp-0.lock` с PID + ctime. Cron tick
    проверяет lock fresh (ctime < 120s + PID alive) → exit early. Race-guard
    для overlapping 1-min ticks при sync health (cap 90s) overlap.
4. Write `.packet-context.<packet_id>.json` per packet (templates с
   `allowed_write_paths` / `diff_budget_loc` / `file_count_max` из packet
   block).
5. **CronCreate FIRST** (race-safe):
   ```
   CronCreate(
     schedule="* * * * *",
     prompt="Use operator-loop skill: perform tick for wave_id=mvp-0 repo_path=/usr/projects/Диплом"
   )
   → returns cron_id
   ```
6. Write `.operator-state.mvp-0.json` ОДИН раз с populated `cron_id`,
   `phase=init`, packets[].

Структура state file (см полную в operator-loop SKILL.md § «State schema»):

```json
{
  "wave_id": "mvp-0",
  "readme_path": "docs/specs/mvp-0-packets.md",
  "spec_path": "docs/specs/mvp-0.md",
  "repo_path": "/usr/projects/Диплом",
  "packets": [
    {
      "id": "mvp-0-T01-scaffold-base",
      "status": "pending",
      "round": 0,
      "commits": [],
      "blockers": [],
      "spec_fix_count": 0,
      "investigate_count": 0,
      "challenge_done_for_sha": null,
      "health_score": null,
      "health_breakdown": {"tsc": null, "test": null, "loc": null, "secrets": null}
    }
  ],
  "current_packet_idx": 0,
  "phase": "init",
  "tick_count": 0,
  "max_rounds_per_packet": 5,
  "strategic_review_every": 3,
  "packets_done_since_review": 0,
  "last_strategic_sha": null,
  "strategic_review_results": [],
  "strategic_parse_fail_count": 0,
  "cron_id": "<id from CronCreate>",
  "lock_file": ".operator-state.mvp-0.lock",
  "last_doc_patch_sha": null,
  "health_history": [],
  "gbrain_synced": false,
  "dry_run": false,
  "history": []
}
```

**Критичные поля** (если пропущены — pipeline ломается):
- `challenge_done_for_sha`: per-packet guard, чтобы challenger НЕ re-run на тот
  же impl-sha (idempotency Opus burn).
- `investigate_count`: cap 2 на packet, иначе escalate "investigate_cap_hit".
- `lock_file`: PID lock для cron race-guard (см § 5 шаг 3a).
- `strategic_parse_fail_count`: 2 consecutive parse fails → escalate "architect
  role broken".

Cron fires каждую минуту → fresh CC session → invoke
`Skill operator-loop tick wave_id=mvp-0 repo_path=/usr/projects/Диплом` →
один phase advance → exit.

Требования env:

- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` (см
  [~/.claude/CLAUDE.md § «Agent Teams»](file:///home/guihal/.claude/CLAUDE.md))
  для `CronCreate` / `Agent` batching.
- `CronCreate` built-in tool доступен.
- `Agent` tool доступен (subagent_type=general-purpose, model override
  opus|sonnet|haiku).

## 6. Шаг 3 — per-packet flow внутри operator-loop

Каждый packet проходит через phase machine. ASCII diagram:

```txt
[phase=init: read packet block, BASE_SHA = git rev-parse HEAD]
       │
       ▼
[phase=dispatching: spawn worker Agent (model per dispatch table)]
       │  Model dispatch (operator-loop § «Model dispatch table»):
       │    risk_tier ∈ {security, db} → Opus
       │    dispatch=strong_gate → Opus
       │    diff_budget_loc > 200 → Opus
       │    file_count_max > 3 → Opus
       │    docs-only ≤30 LOC ×1 file → Haiku
       │    docs-only иначе → Sonnet
       │    иначе weak_ok → Sonnet
       ▼
[phase=awaiting-commit: poll]
       │  (a) FAIL marker .packet-fail.<id>.r<round> exists → read reason,
       │      blocker `worker_fail: <reason>`, round++, investigate sub-step,
       │      → phase=fix-dispatching.
       │  (b) anchored git log grep packet_id → found → append commits[].
       │  (c) elapsed > 30 min без commit/marker → blocker `worker_timeout`,
       │      round++, investigate sub-step.
       ▼
[phase=verdict-spawning: parallel batch (cap=3)]
       │  Default: architect + worker-critic = 2 children.
       │  CSO trigger (risk_tier ∈ {security, auth, db, migrations} OR path
       │    regex `(^|/)(auth|migrations|secrets)/`) → CSO 3rd child.
       │  Никогда 4 children.
       ▼
[phase=verdict-routing: parse JSON verdicts, apply route]
       │  Route table (operator-loop § «Verdict routing»):
       │    architect.ok=true AND critic.ok=true → done OR challenge-gate
       │    fix_target=escalate → escalated
       │    fix_target=spec → operator doc-patch + re-gate (round 0)
       │    fix_target=both → doc-patch + merge blockers (round++)
       │    fix_target=impl → merge blockers (round++)
       │
       ├── ok AND (CSO trigger met OR file_count_max > 5)
       │   AND challenge_done_for_sha != current_impl_sha
       │   → phase=challenge-gate
       │
       ├── ok иначе → packet status=done
       │
       └── any blocker → phase=fix-dispatching
                          │
                          ├── round >= 2 AND prior worker_fail
                          │   AND investigate_count < 2
                          │   → SPAWN Investigator (Opus, read-only)
                          │     → root_cause appended to blockers
                          │     → fix-dispatch with insight
                          │     → investigate_count++
                          │   (cap=2 → escalated «investigate_cap_hit»)
                          └── retry worker round++
       ▼
[phase=challenge-gate (conditional)]
       │  Sequential Codex Challenger (Opus, read-only).
       │  break_scenarios=[] AND severity ∈ {none, low}
       │    → challenge_done_for_sha = current_impl_sha, packet status=done
       │  break_scenarios non-empty AND severity < critical
       │    → blocker `challenge_broke: <scenarios>`, round++,
       │      phase=fix-dispatching
       │  severity=critical → escalated
       ▼
[packet status=done → health composite compute inline]
       │  Health command set (operator-loop § «Health computation»):
       │    HEALTH_TSC: bunx tsc --noEmit → 10 если 0 errors
       │    HEALTH_TEST: bun test → 10 если pass
       │    HEALTH_LOC: diff vs DIFF_BUDGET_LOC, penalty pro rata
       │    HEALTH_SECRETS: grep secret patterns → 10 если clean
       │    composite = TSC*0.35 + TEST*0.35 + LOC*0.15 + SECRETS*0.15
       │  Bail-out timeout 90s суммарно → health_score=null (не gate).
       │  Append state.health_history (trim oldest if length > 10).
       ▼
[strategic-review check inline]
       │  packets_done_since_review++.
       │  >= strategic_review_every (=3) → spawn Strategic Architect.
       ▼
[atomic state write → tick exit]
```

Per-packet anti-patterns (см полный список operator-loop SKILL.md
§ «Anti-patterns»):

- multi-phase per tick — one tick = one phase advance.
- in-memory state между ticks — fresh CC process per tick (cron спавнит новую
  сессию).
- sync worker wait — tick timeout. Worker async, next tick polls `git log`.
- nested `/task` в worker subagent — silently skipped в 8/14 measured cases.
  Worker = raw impl; critic-loop делает operator parent.

## 7. Шаг 4 — strategic-review каждые 3 packets

Триггер: `packets_done_since_review >= 3` (после T03, T06, T09, T12 done).
Inline check в tick step 7, ДО state write.

Operator спавнит Strategic Architect Agent (Opus, read-only) с input:

- Meta-goal: `cat docs/specs/mvp-0.md § «Final Formula»|«Коротко»`.
- Last 3 packet commits: `git log --oneline -3 $last_strategic_sha..HEAD`.
- Per packet brief (id, stated goal).
- Health history rolling-3: `state.health_history.slice(-3)` (non-null filter).
- Gbrain context (если MCP available, omit иначе).

Strategic Architect возвращает JSON с 6 принципами (каждый 0-10 + evidence):

```json
{
  "drift_score": <int 0-10>,
  "evidence": ["..."],
  "principle_breakdown": {
    "scope":         {"score": 8, "evidence": ["packet T03 implements suggest-task-complexity per 02 § 8.2"]},
    "taste":         {"score": 7, "evidence": ["matches port/use-case naming convention из 02 § 4.5"]},
    "debt":          {"score": 6, "evidence": ["no new debt; LOC budget honored"]},
    "impact":        {"score": 9, "evidence": ["core task flow operational"]},
    "reversibility": {"score": 8, "evidence": ["no migration applied; safe revert"]},
    "blast_radius":  {"score": 5, "evidence": ["domain module touched by 3 commits"]}
  },
  "recommendation": "continue"
}
```

6 principles — описание:

- **scope**: reality vs original wave goal (10 = exactly on goal, 0 =
  unrelated work).
- **taste**: coherence с prior decisions (matches 02 / 04 patterns).
- **debt**: technical debt accumulation (no new debt = 10).
- **impact**: user-visible benefit (для MVP-0 — рабочий task flow).
- **reversibility**: трудность revert recent commits. Migration applied →
  низкий score.
- **blast_radius**: failure mode scope (isolated module = 10, wave-wide
  breakage = 0).

Route (operator derives if absent, priority order — top wins):

| # | Условие | recommendation | operator action |
|---|---|---|---|
| 1 | any `principle_breakdown[*].score == 0` | `escalate` | phase=escalated, surface к юзеру (taste decision required) |
| 2 | `drift_score >= 5` OR explicit escalate | `escalate` | phase=escalated |
| 3 | health trend `falling` (slice[-1].score < slice[-3].score - 1) AND drift_score < 5 | `adjust_wave` | юзер ревью, possibly patch packets[] |
| 4 | any `principle_breakdown[*].score <= 3` | `adjust_wave` | юзер ревью |
| 5 | иначе | `continue` | next packet |

После strategic-review:

- `last_strategic_sha = HEAD`.
- `packets_done_since_review = 0`.
- На any successful parse → `strategic_parse_fail_count = 0` (reset).
- Parse fail → log warning, treat as `continue`, increment
  `strategic_parse_fail_count`. ≥ 2 consecutive parse fails → escalate
  («architect role broken»).

Для Task Companion MVP-0 strategic-review будет триггериться:

- После T03 (этап «Core domain без UI» complete) — scope check на доменную
  чистоту.
- После T06 (этап «Infrastructure MVP-0» complete) — taste check на
  SQLite/memory parity, blast_radius на migration applied.
- После T09 (этап «Task flow UI» complete) — impact + debt check.
- После T12 (этап «MVP-0 polish» complete) — финальный pass перед terminal.

## 8. Шаг 5 — terminal phase

Wave done когда:

- все packets `status=done`,
- last strategic recommendation `continue` (или wave завершён до strategic
  trigger),
- health composite avg ≥ 7 (рекомендуемая планка для дипломного MVP, не
  hard-enforced operator-loop, но юзер decision).

Tick step 3 (termination check) последовательно:

1. log «wave complete».
2. `state.cron_id != null` → `CronDelete(state.cron_id)`. `cron_id=null`
   → log warning, skip cleanup.
3. **Gbrain sync** (fail-soft, idempotent): если `state.gbrain_synced ==
   false` AND `command -v gbrain` exit 0:
   ```bash
   timeout 60s gbrain import docs/specs/mvp-0.md docs/tasks/mvp-0/
   timeout 60s gbrain extract all
   ```
   Set `state.gbrain_synced = true` (даже при partial fail —
   best-effort).
   `gbrain` не installed → log `gbrain_not_available`, skip. Без
   `OPENAI_API_KEY` env var gbrain skip embeddings, knowledge graph
   imperfect но не критично для wave done.
4. state file mark wave_done timestamp.
5. exit.

После terminal — wave файлы остаются (audit). Wipe через юзер shell (см § 12).

## 9. gstack skill integration table

Расширенная per packet/etap. Все skills вызываются юзером manually (не
operator-loop), вне cron tick'ов.

| Стадия | gstack skill | Конкретная команда | Когда |
|---|---|---|---|
| Pre-wave (open decisions) | `/office-hours` (startup mode) | `/office-hours` в Claude Code | Перед commit scope MVP-0 — 6 forcing questions (demand reality, status quo, desperate specificity, narrowest wedge, observation, future-fit) |
| Pre-wave (deploy plan) | `/setup-deploy` | `/setup-deploy` | ТОЛЬКО если планируется APK release post-MVP-0 (для дипломной защиты — не обязательно) |
| Per packet T05/T07/T11 (strong_gate) | `/architect` (встроен operator-loop) | автомат через operator-loop verdict-spawning | architect+critic verdict-spawning batch |
| Per packet T08/T09 (db_migration) | `/architect` + `/codex` rescue mode | автомат + manual `/codex:rescue diff` post-impl | challenge-gate (file_count_max > 5 OR risk_tier=db_migration) + extra second-opinion |
| Etap 4 UI (T13 — главный экран + TaskCard) | `/design-consultation` | `/design-consultation TaskCard layout` | Перед UI код — варианты дизайн-системы |
| Etap 4 UI (T13) | `/design-shotgun` | `/design-shotgun 3 варианта TaskCard` | Генерация дизайн-вариантов AI |
| Etap 4 UI (T13) | `/design-html` | `/design-html` | Финал HTML/CSS реализация из выбранного варианта |
| Etap 4 UI (T13 done) | `/design-review` | `/design-review` | Designer's eye QA, fix visual inconsistency |
| Etap 4 UI (T13 done) | `/devex-review` | `/devex-review` через `/browse` Capacitor preview | Onboarding flow юзера (создание первой задачи, выполнение) |
| Etap 5 polish (T15) | `/health` | `/health` | Snapshot health metrics перед ship (weighted composite vs operator-loop health) |
| Etap 5 polish (T15) | `/qa-only` | `/qa-only` через `/browse` | Pre-ship QA pass без auto-fix (юзер сам решает что фиксить) |
| Pre-commit each packet (manual) | `/review` | `/review` | Diff review против main (если работаешь руками вне operator-loop) |
| Pre-commit each | `/caveman-review` | `/caveman-review` | Compact review для small diff'а |
| Post-wave done (MVP-0 → main) | `/ship` | `/ship` | Tag + release + bump VERSION |
| Post-ship deploy verify | `/land-and-deploy` | `/land-and-deploy` | Merge PR + wait CI + canary verify |
| Post-wave done | `/document-release` | `/document-release` | Sync `docs/*` + README + CHANGELOG voice |
| Post-wave done | `/retro` | `/retro` | Engineering retrospective wave'а |
| Post-wave done | `/learn export` | `/learn export` | Capture learnings → gbrain knowledge |
| Long-term (cross-wave) | gbrain MCP | автомат через operator-loop terminal | Knowledge graph для следующих wave (MVP-1 inherits patterns) |

Mapping etapов из [03-build-roadmap.md](03-build-roadmap.md) к packet
diapазонам:

| Roadmap etap | Packet range | Skill focus |
|---|---|---|
| Этап 0 (стартовые решения) | — | `/office-hours` only, pre-wave |
| Этап 1 (Scaffold) | T01-T02 | weak_ok, Sonnet worker, no design skills yet |
| Этап 2 (Core domain) | T03-T05 | strong_gate на use cases, Vitest coverage |
| Этап 3 (Infrastructure) | T06-T08 | db_migration на T08 → challenge-gate + `/codex:rescue` |
| Этап 4 (Task flow UI) | T09-T13 | design-* skills, devex-review, browse |
| Этап 5 (Polish) | T14-T15 | health, qa-only, ship |

## 10. Зачем НЕ применять (anti-patterns pipeline)

Когда конкретные gstack/skill НЕ юзать в pipeline для Task Companion:

- **`/qa` (auto-fix mode)** для MVP-0 финального ship → слишком агрессивно,
  итеративно фиксит код, ломает дипломный код через AI-вмешательство в
  pre-defense код. Юзать `/qa-only` (report-only).
- **`/cso` (security audit)** для MVP-0 → нет surface для security audit:
  нет network calls, нет auth, нет secrets, нет user-facing endpoint. Включить
  с MVP-2 (notification permissions, settings storage) или Post-MVP (REST
  API).
- **`/canary` (post-deploy monitoring)** для дипломного проекта → нет live
  deploy для мониторинга (Capacitor APK не live web service). Skip.
- **`/setup-deploy`** для MVP-0 если защита дипломной не требует deploy →
  отложить до post-MVP. Capacitor Android build достаточно через `npx cap
  build android` ручную.
- **`/cso` встроенный в operator-loop** для ordinary MVP-0 packets → CSO
  trigger conditional ТОЛЬКО на `risk_tier ∈ {security, auth, db, migrations}`
  ИЛИ paths matching `(^|/)(auth|migrations|secrets)/`. Для MVP-0 CSO
  spawns ТОЛЬКО на T08 (миграция `001_initial.sql`). На остальных packets
  spawn = Opus burn без security signal.
- **`/codex` challenge-gate** для small packets (`file_count_max ≤ 3`) →
  adversarial Opus burn без break-risk signal. Trigger conditional only
  (CSO trigger met OR file_count_max > 5).
- **`gbrain` import** без `OPENAI_API_KEY` env var → skip embeddings,
  imperfect knowledge graph. Не критично, но в продакшен pipeline стоит
  export key.
- **plan-multi-review на каждый packet** → plan-stage tool, НЕ impl-stage.
  Use only at wave init / spec revisions. На каждый packet = wasted 3×Opus.
- **operator-loop без open decisions** → infinite spec-fix loop. Operator
  возвращает `fix_target=spec`, doc-patch, re-gate, опять `fix_target=spec`
  → `spec_fix_count >= 2` → escalate. Pipeline стоит, юзер в шоке.
- **mid-wave constitution mutation** (`/constitution-patch` while wave
  active) → determinism break. Завершить wave с одной constitution версии,
  потом patch.
- **`/ultrareview` для single packet** → overkill. Применять только перед
  merge MVP-0 → main branch (если такой workflow есть).

## 11. Quickstart команды для юзера

```bash
# 0. Текущая директория
cd /usr/projects/Диплом

# 1. Pre-wave open decisions check
grep -nE "(Открытые решения|Open decisions|TBD|TODO|подтвердить)" \
  AGENTS.md docs/02-architecture.md docs/04-technical-decisions.md
# → закрыть каждый decision как ADR-022+ в docs/04-technical-decisions.md
# Пример (быстрый append):
echo -e "\n## ADR-022. Package manager — bun\n\nДата: $(date +%Y-%m-%d)\nСтатус: принято\nРешение: bun ≥ 1.1.x." \
  >> docs/04-technical-decisions.md

# 2. Создать spec файл из 00-scope-map.md + 03-build-roadmap.md + 07-task-packet-template.md
mkdir -p docs/specs
# → ручное наполнение docs/specs/mvp-0.md (Final Formula + T01..T15 packets)
# → MUST include packet_id с префиксом mvp-0- для wipe-glob correctness

# 3. Plan-multi-review (через Claude Code chat в /usr/projects/Диплом)
# Сообщение:
#   "Прогони plan-multi-review на docs/specs/mvp-0.md"
# Ожидать: JSON verdict с routing=ok|fix|escalate.
# routing != ok → юзер фиксит spec, повтор.

# 4. После routing=ok → init operator-loop wave
# Сообщение в Claude Code:
#   "Init operator-loop wave для mvp-0. Cron 1-min."
# Создаст: .operator-state.mvp-0.json + .packet-context.mvp-0-T01.json ...
# Зарегистрирует cron entry (CronCreate built-in tool).

# 5. Мониторить state каждые N минут (юзер shell)
jq '{phase, current_packet_idx, packets: [.packets[] | {id, status, round}], health_history}' \
  .operator-state.mvp-0.json

# Inspect cron
# В Claude Code: "CronList"

# 6. Watch git log за wave commits
git log --oneline --grep="mvp-0-" -20

# 7. После strategic-review каждые 3 packets → юзер ревью verdict в chat
# Если recommendation=adjust_wave → patch docs/specs/mvp-0.md по
# principle_breakdown с score <= 3, перезагрузить state (см pause/resume).

# 8. Pause wave (если нужно вмешательство)
# Сообщение: "Skill operator-loop pause wave_id=mvp-0"

# Resume
# Сообщение: "Skill operator-loop resume wave_id=mvp-0"

# 9. Post-wave done sequence (manual gstack chain)
# Сообщения по очереди:
#   "Прогони /health"
#   "Прогони /qa-only"
#   "Прогони /ship"
#   "Прогони /document-release"
#   "Прогони /retro"
#   "Прогони /learn export"

# 10. Wipe wave files после verify (если хочешь чистый repo)
rm .operator-state.mvp-0.json{,.bak,.tmp} \
   .packet-context.mvp-0-*.json \
   .packet-fail.mvp-0-*.r* 2>/dev/null || true
```

## 12. Troubleshooting / FAQ

**Q: «Operator завис на packet X»**
A: Проверь state:
```bash
jq '{phase, current_packet: .packets[.current_packet_idx]}' .operator-state.mvp-0.json
```
Если `round_count_per_packet[X] >= 5` (MAX_ROUNDS) → юзер должен либо
расscope'ить packet (split T_x на T_x-a + T_x-b в spec, restart wave) либо
explicit escalate через manual edit `state.phase = "escalated"`. Если
`investigate_count >= 2` → cap hit, тоже escalated.

**Q: «Cron не триггерится»**
A:
1. Проверь `CronList` (через Claude Code chat: `CronList`).
2. Проверь `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` в settings.json.
3. Проверь session running (cron нужен живой Claude Code session
   subscription).
4. Проверь state.cron_id != null (если null — init не дошёл до step 5
   CronCreate).

**Q: «architect / critic verdict пустой / malformed»**
A: Fallback parsing описан в operator-loop SKILL.md
§ «Strategic review / Parse fallback». На any successful parse counter
reset; 2 consecutive parse fails → escalate с message «architect role
broken». Юзер должен увидеть entry в `state.history[]` с
`strategic_parse_fail: <first 200 chars>`. Может быть Opus quota /
network issue.

**Q: «gbrain extract fails в terminal phase»**
A: `OPENAI_API_KEY` env var нужен для embeddings. Без него gbrain skip
embeddings, knowledge graph imperfect. Не критично — wave всё равно
помечается done, state.gbrain_synced = true (best-effort). Manual retry:
```bash
gbrain import docs/specs/mvp-0.md docs/tasks/mvp-0/ && gbrain extract all
```

**Q: «Strategic-review recommendation=adjust_wave но не ясно что менять»**
A: Открыть `principle_breakdown`, фокус на принципы со score ≤ 4. Evidence
array per principle подскажет конкретные commits / specs. Например:
- `taste: {score: 3, evidence: ["use-case T07 placed under app/ instead of core/use-cases/"]}` → правка в spec packet T08+ чтобы избежать повтора + ADR на correction.
- `debt: {score: 2, evidence: ["new dep 'lodash' added without ADR"]}` → откатить dep, ADR.

**Q: «Doc-patch fail в operator»**
A: rollback автоматический (operator-loop § «Doc-patch discipline»):
`git checkout -- <MODIFIED_PATHS>` + `rm -f <CREATED_PATHS>`. Blocker
`doc_patch_edit_fail` или `doc_patch_commit_fail` в state.history.
spec_fix_count не инкрементится при fail.

**Q: «`.operator-state.mvp-0.json` уже exists, init abort»**
A: Это design (`init на existing state` anti-pattern, см
operator-loop § «Anti-patterns»). Wipe команда:
```bash
rm .operator-state.mvp-0.json{,.bak,.tmp} \
   .packet-context.mvp-0-*.json \
   .packet-fail.mvp-0-*.r* 2>/dev/null || true
```
Потом re-init.

**Q: «Worker создал > 1 commit с packet_id в subject»**
A: Multi-commit guard (operator-loop § «Commit detection»). Architect
diff использует range `$BASE_SHA..HEAD` (covers all), но добавляется
blocker `worker_multicommit_violation: <COUNT> commits matched`. Worker
должен squash в next round или operator escalates.

**Q: «Health composite = null»**
A: Bail-out timeout 90s превышен (sum of tsc 30s + test 60s). Не блокирует
packet status=done — health = diagnostic, не gate. Юзер может вручную
запустить health командой `/health` (gstack skill) пост-фактум.

**Q: «Cap=3 violation при verdict-spawning»**
A: По design max 3 children (architect + critic + optional CSO). Если в
state видишь `verdict_batch_size > 3` — баг operator-loop. Reproducible →
report через `/constitution-patch` candidate.

**Q: «MVP-1 wave init: что нового vs MVP-0»**
A: Создать `docs/specs/mvp-1.md` с packets для inventory/mascot/equipment
этапов. Те же шаги pipeline. risk_tier `db_migration` на T_xx-mascot-tables
+ T_xx-inventory-tables, challenge-gate автоматом сработает. Дополнительно
до plan-multi-review: `/design-consultation` для маскот UI + mascot slots
визуального дизайна.

## 13. Cross-refs

- Scope границы wave: [00-scope-map.md § «MVP-0»](00-scope-map.md#mvp-0-рабочее-ядро).
- Vision / product context: [01-product-vision.md](01-product-vision.md).
- Архитектурные инварианты, layering, ports: [02-architecture.md § 4, § 18](02-architecture.md).
- Roadmap этапы → packet diapазоны: [03-build-roadmap.md § «MVP-0»](03-build-roadmap.md#2-mvp-0-рабочее-ядро).
- ADR conventions, open decisions ADR-022+: [04-technical-decisions.md](04-technical-decisions.md).
- Watchlist рисков: [05-critic-pass.md](05-critic-pass.md).
- Onboarding fresh chat: [06-onboarding-brief.md](06-onboarding-brief.md).
- Packet template (формат spec packets): [07-task-packet-template.md § 3](07-task-packet-template.md#3-шаблон-для-копипасты).
- Glossary terms (packet, wave, risk_tier): [08-glossary.md](08-glossary.md).
- Operator-loop skill: `~/.claude/skills/operator-loop/SKILL.md`.
- Plan-multi-review skill: `~/.claude/skills/plan-multi-review/SKILL.md`.
- Architect skill (impl-stage spec critic): `~/.claude/skills/architect/SKILL.md`.
- System constitution (role rights, 5-loop): `~/.claude/skills/system-constitution/SKILL.md`.
- AGENTS.md (cross-tool baseline + delegation triggers): [../AGENTS.md](../AGENTS.md).
- Global CLAUDE.md (CC-specific behavior): `~/.claude/CLAUDE.md`.
