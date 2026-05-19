# Wave spec: MVP-0 (Task Companion core)

Operator-loop wave spec, дипломный `Task Companion`. Источник правды:
[02-architecture.md](../02-architecture.md), [00-scope-map.md](../00-scope-map.md),
[03-build-roadmap.md](../03-build-roadmap.md), [AGENTS.md](../../AGENTS.md).
Overlay для cron orchestration, не дубль 02-08. Формат —
[operator-loop SKILL.md](~/.claude/skills/operator-loop/SKILL.md). plan-multi-review:
CEO+ENG+ARCHITECT (DX skip — MVP-0 без public API/CLI/SDK).

---

## 1. Wave id

```
wave_id: mvp-0
state_file: .operator-state.mvp-0.json
readme_path: docs/specs/mvp-0-packets.md    # authoritative packet queue (single source of truth)
spec_path:   docs/specs/mvp-0.md            # этот файл, vision source (meta-goal, scope, risk rationale)
repo_path:   /usr/projects/Диплом
lock_file:   .operator-state.mvp-0.lock     # PID lock для cron tick race-guard
```

Packet_id convention (operator-loop init step 2): префикс `mvp-0-`, формат
`mvp-0-T<nn>-<kebab-slug>`. Напр. `mvp-0-T01-scaffold-base`.

---

## 2. Wave goal (Final Formula)

> Поставить рабочее ядро `Task Companion`: Nuxt 4 client-only scaffold +
> hexagonal core + SQLite через migration runner + memory repositories для
> browser dev + UI list/create/complete/archive + локальный профиль с XP/level,
> проверенное на Android emulator и `bunx nuxt dev`.

Одно предложение, измеримое: юзер открывает приложение, создаёт задачу за 1-2
действия, выполняет, закрывает, открывает снова — задачи и XP на месте.

Цель совпадает с [03 § 5 Первый технический milestone](../03-build-roadmap.md#5-первый-технический-milestone)
и [01 § 16 Критерии успеха MVP-0](../01-product-vision.md#mvp-0-готов-если-пользователь-может).

---

## 3. Success criteria

Объединение [01 § 16](../01-product-vision.md#16-критерии-успеха) +
[03 § 7 DoD MVP-0](../03-build-roadmap.md#7-definition-of-done). Каждый пункт —
проверяемый командой/runtime сценарием.

### 3.1 Runtime

- [ ] `bun install` → `bunx nuxt dev` → пустой shell открывается без ошибок консоли;
- [ ] `bunx cap sync android && bunx cap run android` → приложение стартует на emulator;
- [ ] bootstrap создаёт локальный профиль и progression если их нет (idempotent на повторный запуск);
- [ ] миграция `001_initial` применяется из пустой БД, повторный запуск runner = no-op;
- [ ] `PRAGMA foreign_keys = ON` выполняется в каждом open connection.

### 3.2 Task flow

- [ ] юзер создаёт задачу с одним обязательным `title`;
- [ ] suggested complexity вычисляется по ordered decision tree [02 § 8](../02-architecture.md#автоматическое-предположение-сложности);
- [ ] юзер меняет complexity вручную → `complexitySource = "manual"`;
- [ ] активные задачи видны на главной;
- [ ] просроченные задачи (status=active AND dueAt < now) поднимаются выше — derived state, не БД-статус [ADR-010](../04-technical-decisions.md#adr-010-просрочка-не-является-статусом);
- [ ] группы списка: просроченные / ближайший дедлайн / без дедлайна / completed (свёрнутый блок) [02 § 8 Сортировка](../02-architecture.md#сортировка-и-группировка-задач);
- [ ] выполнение задачи → status=completed, completedAt, XP начислен, level пересчитан — всё через `unitOfWork.run(ctx => ...)` [ADR-017](../04-technical-decisions.md#adr-017-многошаговые-use-cases-выполняются-транзакционно);
- [ ] повторный `completeTask` НЕ начисляет XP второй раз (идемпотентность);
- [ ] архивация задачи → status=archived, archivedAt, исчезает с главной (НЕ hard delete) [ADR-011](../04-technical-decisions.md#adr-011-архивация-вместо-удаления-в-основном-flow);
- [ ] XP формула MVP-0: `finalXp = baseXp = complexityXp + priorityBonus` (taskMultiplier=1, equipmentXpMultiplier=1) [02 § 9](../02-architecture.md#9-правила-xp-и-уровней);
- [ ] level = `floor(xpTotal / XP_PER_LEVEL) + 1`, XP_PER_LEVEL=1000;
- [ ] закрыть приложение → открыть → задачи и XP на месте (SQLite персистентность).

### 3.3 Architectural invariants

- [ ] `core/` не импортирует `app/`, `infrastructure/`, vue, pinia, nuxt, capacitor [AGENTS § 2](../../AGENTS.md#2-layering-rule-hard);
- [ ] нет `Math.random()` / `new Date()` / `crypto.randomUUID()` в domain и use case (через ports);
- [ ] нет `any` в TS, `tsc --noEmit` чистый [AGENTS § 5](../../AGENTS.md#5-typescript-strict-mode);
- [ ] Pinia stores без бизнес-логики (XP/сортировка/drop в use case);
- [ ] `infrastructure/sqlite/*` не попадает в browser bundle (memory fallback через DI);
- [ ] Vitest зелёный: domain + use case tier 1+2 (см [AGENTS § 6](../../AGENTS.md#6-test-strategy)).

### 3.4 Polish

- [ ] empty / loading / error states на главной;
- [ ] статичная тёмная базовая тема [ADR-019](../04-technical-decisions.md#adr-019-mvp-0-имеет-static-dark-baseline-mvp-2-имеет-visual-random);
- [ ] базовые design tokens (цвета, отступы, радиусы, типографика) — CSS variables, БЕЗ visual random;
- [ ] адаптивность под мобильный viewport;
- [ ] Android APK собирается без ошибок (debug build OK, release вне scope MVP-0).

---

## 4. Out-of-scope (explicit)

Дословно из [00-scope-map.md](../00-scope-map.md). Operator НЕ должен ускользать
сюда через "удобно сделать заодно".

**MVP-1 (НЕ сейчас)**: маскот; инвентарь; экипировка; каталог предметов; выдача
за уровни; random drop после задачи; ролл XP-множителя; XP-множители надетых
предметов; `mascot_slots`, `inventory_items`, `user_inventory_items`,
`equipped_items`, `level_rewards`, `task_reward_rolls` таблицы;
`InventoryRepository`, `MascotRepository` ports.

**MVP-2 (НЕ сейчас)**: локальные уведомления; request permissions;
cancel/recreate notification; notification reconciliation; visual random;
visual variants; варианты текста кнопки / заголовка / фона; экран настроек;
`reducedMotion`, `disableVisualRandomness`; `visual_state`, `settings` таблицы;
reminder поля в tasks ([критика #11](../05-critic-pass.md#что-было-исправлено)).

**Post-MVP (НЕ сейчас)**: регистрация; авторизация; сервер; REST API; sync;
командные; комментарии; вложения; календарь модуль; канбан; привычки; Pomodoro;
повторяющиеся; магазин; донат; социальные; ИИ; не-XP бонусы предметов; штрафы
за просрочку; медицинские рекомендации.

**Mechanical запреты wave**:
- НЕ `tasks.reminder_*` колонки в `001_initial` (MVP-2);
- НЕ `core/domain/{mascot,inventory}.ts` (MVP-1);
- НЕ `core/domain/{visual,settings}.ts` (MVP-2);
- `RandomPort`, `NotificationPort` — optional `?` в `AppDependencies` либо отсутствуют (фактические реализации MVP-1 / MVP-2).

---

## 5. Packets manifest

**Authoritative source** — [docs/specs/mvp-0-packets.md § 2](mvp-0-packets.md#2-manifest-таблица).
Этот файл (wave spec) НЕ дублирует packet manifest — даёт meta-goal,
success criteria, risk rationale, dispatch triggers. Operator-loop init parse'ит
`readme_path` (см § 1) → `docs/specs/mvp-0-packets.md`.

Overview:
- 15 packets `mvp-0-T01-...` через `mvp-0-T15-...` (lowercase prefix matches wipe-glob).
- Этапы 1-5 [03-build-roadmap.md MVP-0](../03-build-roadmap.md#2-mvp-0-рабочее-ядро).
- Risk distribution: 8 ordinary / 5 strong_gate / 2 db_migration (= 8 Sonnet worker calls + 7 Opus = 5 strong_gate + 2 db_migration).
- 4 challenge-gate (T07 use-cases, T08 migration runner, T09 SQLite repositories, T11 dependency-container) — explicit list § 7.
- 7 architect-skill вызовов через operator-loop verdict-spawning (T05, T06, T07, T08, T09, T11, T12).

Risk_tier rationale per group — § 6 ниже. Полные packet definitions
(`allowed_write_paths`, `diff_budget_loc`, `file_count_max`, `acceptance`
checklist) — в [mvp-0-packets.md](mvp-0-packets.md). Bootstrap placement:
T11=DI container, T12=bootstrap-flow (отдельные packets per
[03-roadmap § 3](../03-build-roadmap.md), не объединять в один use-cases batch).

---

## 6. Risk tiering rationale

Per group, обоснование risk_tier для model dispatch + critic gating:

**Scaffold (T01-T02) — `ordinary`**. Boilerplate: конфиги, package.json,
структура. Sonnet справится. Challenge-gate explicit override § 7 (file_count_max>5
не fires автоматически — manual list).

**Domain (T03-T04, T06) — `ordinary`**. T03/T04: diff <100 LOC, файлов <8,
pure functions. T06 = use-case-layer task-operations (`suggestTaskComplexity` /
`resolveTaskList` / `applyLevelProgress` per [02 § 4.3](../02-architecture.md#43-use-case-layer-mvp-0))
— назван `mvp-0-T06-use-cases-task-operations`, `strong_gate` т.к. ordered decision
tree + группировка boundary-sensitive.

**T05 = `strong_gate`**: ширина числовых констант + формул + границы
(`XP_PER_LEVEL`, `BASE_XP`, `PRIORITY_BONUS`, `round()` для совместимости с
MVP-1, boundary tests xpTotal=0/999/1000). Off-by-one корраптит progression на
весь lifecycle. Opus + architect + critic.

**Infrastructure (T08-T09) — `db_migration`**. T08 runner: CHECK constraints
**дословно** из [02 § 11](../02-architecture.md#11-sqlite-схема),
`PRAGMA foreign_keys = ON` каждый open, watchlist
[05 #14](../05-critic-pass.md#что-было-исправлено) `UnitOfWorkContext` invariant.
**Codex Challenger обязателен** для T08 (см § 7). T09 SQLite repos: composite FK
+ ownership checks ([02 § 11 Same-profile](../02-architecture.md#11-sqlite-схема)),
`ON DELETE RESTRICT` audit links (MVP-1 prep, но invariant archive-vs-hard-delete
актуален сейчас). T10 memory repos: `ordinary` — Map в memory.

**Use cases (T07) — `strong_gate` + challenge-gate**. `createTask` /
`completeTask` / `archiveTask`. `completeTask` идемпотентность + transactional
`unitOfWork.run(ctx)` + nested ban. Watchlist
[05 #14](../05-critic-pass.md#что-было-исправлено) +
[AGENTS § 9 #15, #17](../../AGENTS.md#9-anti-patterns-hard). Opus + Codex
challenger.

**DI (T11) — `strong_gate` + challenge-gate**. `AppDependencies` + runtime
detection Capacitor vs browser + Nuxt plugin. Challenge target: DI race на
bootstrap async plugin resolve, runtime detection корректность. Opus + Codex
challenger.

**Bootstrap (T12) — `strong_gate`**. Detect runtime → open DB → run migrations
→ create profile/progression если нет → load initial state. Migration runner
invocation owned by T12 bootstrap-use-case ([02 § 4.3](../02-architecture.md#43-use-case-layer-mvp-0)
`bootstrap-app.use-case.ts`), не T11 DI container. Opus.

**UI (T12-T13) — `ordinary`**. Components + thin Pinia stores, бизнес-логика в
T11. Sonnet OK.

**Polish (T14-T15) — `ordinary` с design нюансом**. T14 требует
`/design-consultation` ДО spawning (см § 8) — после consultation worker создаёт
CSS variables как чистый artefact. T15 cap sync + build; gradle quirks → patch +
retry.

---

## 7. Critic dispatch triggers

Conditional роли operator-loop, spawning rules для MVP-0:

**CSO Critic — fires автоматически на T08/T09 (db_migration tier)**. Operator-loop
skill trigger ([dispatch table](~/.claude/skills/operator-loop/SKILL.md#dispatch-triggers-conditional-roles))
spawns CSO на `risk_tier ∈ {security, auth, db, migrations}` — wave spec НЕ может
override skill rule. Для MVP-0 это T08 (migration runner) + T09 (SqliteRepositories).

CSO prompt должен быть **minimal** (нет auth/network/secrets surface) — фокус на:
- SQL injection защита (parameterized queries everywhere)
- PRAGMA foreign_keys = ON каждый connection
- secrets grep в diff (api_key / token / password)
- migration applied/rolled-back invariant

CSO verdict `severity != critical` → operator продолжает; `severity = critical` →
forced escalate (constitution rule). Юзер review.

На T01-T07, T10-T15 — CSO НЕ spawn'ится (risk_tier ∉ db/security). Re-enable
с MVP-2 (notification permissions) — wave spec MVP-2 явно укажет CSO trigger.

**Investigator** — стандартный trigger
`round>=2 AND blockers~/^worker_fail:/ AND investigate_count<2`
([operator-loop § Dispatch triggers](~/.claude/skills/operator-loop/SKILL.md#dispatch-triggers-conditional-roles)).
Cap 2 → escalate "investigate_cap_hit". Ожидаемые triggers: T08 Capacitor SQLite
API edge (open/close, async transaction), T11 completeTask idempotency.

**Codex Challenger** — operator-loop default trigger:
`risk_tier ∈ {db_migration, security} OR file_count_max > 5`. Применение
буквально → 13/15 MVP-0 packets fire challenge (T01 file=15, T02 file=10, T13
file=14 и т.д.) → wasteful spawn на UI/scaffold packets без security/db surface.

**Wave-level override для MVP-0** (manual explicit list, переопределяет default
trigger): challenge-gate fires ТОЛЬКО для:

- **T07** use-cases-tasks (strong_gate, file=10) — UoW orchestration + idempotency.
- **T08** migration runner (db_migration, file=6) — CHECK constraints + TX atomicity.
- **T09** SqliteRepositories (db_migration, file=10) — composite FK + UoW chain.
- **T11** dependency-container (strong_gate, file=6) — DI race + runtime detection.

**Rationale override**: T05/T06/T12 strong_gate + architect-skill verdict +
critic RLM cycle уже cover correctness; T01/T02/T13/T15 ordinary без db/security
surface — Codex challenger noise > signal. T05 XP формула — pure functions
boundary tests Vitest sufficient. T06 use-case-task-operations — domain-deterministic
функции. T12 bootstrap — read-only orchestration. Если wave-rerun reveals
challenge gap на этих packets → patch override list + ADR.

Operator-loop читает wave spec § 7 explicit list как override (не default trigger).
Packets вне списка → challenge skipped.

T08 challenge scenarios:
- migration partial-apply + crash mid-transaction (`schema_migrations` row vs SQL rollback consistency);
- duplicate apply existing migration → no-op invariant;
- `PRAGMA foreign_keys = ON` race на re-open;
- concurrent open двух Capacitor контекстов;
- attempt edit applied migration → fail.

T09 challenge scenarios:
- composite FK ownership check skip → cross-profile leak;
- mapper camelCase ↔ snake_case дроп полей;
- UoW atomicity для `completeTask` chain (XP + level + status один rollback);
- `Math.random()` / `new Date()` утечка в repo.

T07 / T11 challenge scenarios: nested `unitOfWork.run`; DI race на bootstrap;
импорт infrastructure из use case.

**Strategic Architect** — `STRATEGIC_REVIEW_EVERY=3`, срабатывает после packets
3, 6, 9, 12 (4 раза за wave из 15). 6 principles: scope/taste/debt/impact/
reversibility/blast_radius, 0-10 each с evidence. Route:
- `drift_score >= 5` ИЛИ principle score==0 → escalate;
- health trend falling (slice(-3) drop ≥1) AND drift<5 → adjust_wave;
- иначе continue. Health input: `state.health_history.slice(-3)`, filter null.

**Health check** (operator-internal, не subagent): `timeout 30s bunx tsc --noEmit`
+ `timeout 60s bun test` + LOC vs `diff_budget_loc` + secrets grep. Composite
weights tsc 0.35 / test 0.35 / loc 0.15 / secrets 0.15. Sum cap 90s, bail-out →
score=null (не block done). Trim history > 10. См
[operator-loop § Health computation](~/.claude/skills/operator-loop/SKILL.md#health-computation-operator-internal-not-subagent).

---

## 8. gstack skills integration

Таблица: где какой gstack skill включается в wave. Operator вызывает их
**вручную** (Я как operator решаю когда), не cron-driven:

| Packet / этап | gstack skill | Когда | Зачем |
|---|---|---|---|
| T01 (scaffold готов) | `/setup-deploy` | опционально, если планируем Android APK release pipeline | предсетап CI/CD — НЕ блокирует MVP-0, можно отложить |
| T05 (domain XP) | `/architect` (встроен в operator-loop verdict-spawning) | автоматически при `strong_gate` packet | архитектурная сверка с [02 § 9](../02-architecture.md#9-правила-xp-и-уровней) |
| T08 (migration runner) | `/architect` + Codex Challenger | автоматически + challenge-gate обязательный | CHECK constraints + transaction atomicity |
| T11 (use cases) | `/architect` | автоматически при `strong_gate` | `unitOfWork.run` invariant + idempotency |
| T13 (UI готов первая итерация) | `/design-consultation` → `/design-shotgun` → `/design-html` → `/design-review` | **ДО** T14 polish | design system, 3 варианта TaskCard, финальный HTML/CSS, designer's eye QA |
| T13 (UI complete) | `/devex-review` | после dispatch T13 | TTHW onboarding flow юзера (создал задачу, выполнил, увидел XP) — для дипломной демонстрации |
| T14 polish | `/health` snapshot | до dispatch T14 | baseline качества кода перед polish |
| T15 (Android smoke) | `/qa-only` через `/browse` | после T15 dispatch | тестирование сценариев из [01 § 12 Пользовательские сценарии](../01-product-vision.md#12-основные-пользовательские-сценарии) |
| После wave done | `/ship` + `/document-release` + `/retro` | terminal phase | merge, доки sync, ретроспектива |
| После wave done | `gbrain import docs/specs/mvp-0.md docs/tasks/mvp-0/ && gbrain extract all` | terminal step 3c (operator делает сам) | дополняет паттерны для future waves; operator-loop step 3c делает это автоматически если gbrain доступен |

**Design system note**: T13 UI dispatch ДО `/design-consultation` = workable
minimum-viable layout. `/design-consultation` запускается параллельно с T13
(дизайн исследуется пока UI scaffold собирается); финальный design system
applied в T14. Worker T14 получает результат `/design-consultation` как input в
packet README.

---

## 9. State schema (MVP-0 extension)

Базовая schema — [operator-loop § State schema](~/.claude/skills/operator-loop/SKILL.md#state-schema-operator-statewave-idjson).
MVP-0 specific:

```yaml
wave_id: mvp-0
readme_path: docs/specs/mvp-0-packets.md
spec_path:   docs/specs/mvp-0.md            # vision lead source для strategic
repo_path:   /usr/projects/Диплом
phase: <init|dispatching|awaiting-commit|verdict-spawning|verdict-routing|challenge-gate|fix-dispatching|done|escalated>
packets:                                    # 15 packets из § 5
  - id: mvp-0-T01-scaffold-base
    status: pending
    round: 0
    commits: []
    blockers: []
    spec_fix_count: 0
    investigate_count: 0
    challenge_done_for_sha: null            # T08, T11 single-impl-sha guard
    health_score: null
    health_breakdown: {tsc: null, test: null, loc: null, secrets: null}
  # 14 more
current_packet_idx: 0
tick_count: 0
max_rounds_per_packet: 5
strategic_review_every: 3                   # checks после 3, 6, 9, 12
packets_done_since_review: 0
last_strategic_sha: null
strategic_review_results: []                # MVP-0 ext: JSON verdicts для retro
cron_id: <set at init step 5>
last_doc_patch_sha: null
strategic_parse_fail_count: 0
health_history: []                          # rolling 10, slice(-3) → strategic
gbrain_synced: false
dry_run: false
history: []
```

**MVP-0 extension `strategic_review_results: []`** — массив JSON verdicts с 4
checkpoints. Operator-loop spawns strategic после **3-го, 6-го, 9-го, 12-го
completed packet** (counter `packets_done_since_review` reset на каждом spawn).
Конкретные packet IDs зависят от scheduling order (T01-T15 sequential vs
parallel waves § 4 packets manifest), не hardcoded. Counter-based, не ID-based.
Нужен для `/retro` (§ 11 terminal): читает strategic history → pattern drift по
wave. Operator append в § 7 strategic check.

---

## 10. Cron schedule

```
schedule: "* * * * *"           # 1-minute tick
MAX_ROUNDS_PER_PACKET: 5         # operator-loop default
STRATEGIC_REVIEW_EVERY: 3        # 4 strategic checks за wave из 15 packets
HEALTH_TIMEOUT_CAP: 90s          # operator-loop default
INVESTIGATE_CAP_PER_PACKET: 2    # operator-loop default
CSO_TRIGGER: risk_tier ∈ {db_migration, security}   # T08, T09 для MVP-0
CHALLENGE_TRIGGER: risk_tier ∈ {db_migration, security} OR file_count_max > 5   # T07, T08, T09, T11
```

Init flow ([operator-loop § Lifecycle Init](~/.claude/skills/operator-loop/SKILL.md#init-manual-one-shot--user-invokes-операtor-через-skill-tool)):
1. Pre-check `.operator-state.mvp-0.json` не существует;
2. Parse 15 packets из `docs/specs/mvp-0-packets.md` (после написания Writer L2);
3. Abort если 0 packets;
4. Write `.packet-context.mvp-0-T<nn>-*.json` per packet;
5. `CronCreate(schedule="* * * * *", prompt="Use operator-loop skill: perform tick for wave_id=mvp-0 repo_path=/usr/projects/Диплом")` → capture `cron_id`;
6. Write `.operator-state.mvp-0.json` ОДИН раз с `cron_id`.

---

## 11. Termination conditions

Wave `phase=done`, когда **все** условия выполнены:

- [ ] все 15 packets `status=done` (15/15);
- [ ] последний strategic review `recommendation=continue` (не adjust_wave, не escalate);
- [ ] health rolling trend на `state.health_history.slice(-3)`:
  - все entries non-null;
  - средний score >= 7;
  - тренд НЕ falling (slice[-1] >= slice[-3] - 1);
- [ ] `gbrain_synced = true` ИЛИ `gbrain_not_available` логгировано (best-effort, fail-soft);
- [ ] manual review § 3 success criteria юзером (operator surface финальный summary).

Terminal step actions ([operator-loop § Tick algorithm step 3](~/.claude/skills/operator-loop/SKILL.md#tick-algorithm-one-tick--one-phase-advance)):
- `CronDelete(state.cron_id)`;
- `gbrain import docs/specs/mvp-0.md docs/specs/mvp-0-packets.md && gbrain extract all` (timeout 60s каждая);
- log "mvp-0 wave complete";
- exit.

После wave done — manual juзер actions:
- `/ship` skill → merge feature branch в main;
- `/document-release` skill → sync docs с тем что shipped (CHANGELOG, README);
- `/retro` skill → читает `state.strategic_review_results` + `state.health_history` → pattern analysis для MVP-1 планирования.

Escalation paths:
- `drift_score >= 5` на любой strategic review → wave стоп, юзер решает;
- `investigate_count == 2` на packet → escalate "investigate_cap_hit";
- `round >= 5` на packet без convergence → escalate;
- `strategic_parse_fail_count >= 2` → escalate "architect role broken";
- challenge `severity=critical` → forced escalate.

---

## 12. Open decisions — closed by ADR-022..028

Все pre-init decisions закрыты в [04-technical-decisions.md](../04-technical-decisions.md)
(2026-05-19). Wave init unblocked.

| # | Decision | Verdict | ADR |
|---|---|---|---|
| 12.1 | Package manager | bun | [ADR-022](../04-technical-decisions.md#adr-022-менеджер-пакетов--bun) |
| 12.2 | SQLite-плагин Capacitor | `@capacitor-community/sqlite` | [ADR-027](../04-technical-decisions.md#adr-027-capacitor-sqlite-plugin--capacitor-communitysqlite) |
| 12.3 | Android SDK | minSdk 22, targetSdk 34 | [ADR-023](../04-technical-decisions.md#adr-023-android-sdk-target--minsdk-22-targetsdk-34) |
| 12.4 | Web SQLite vs memory | memory-only | [ADR-028](../04-technical-decisions.md#adr-028-web-sqlite--отложено-browser-dev-на-memory-only) |
| 12.5 | Ассеты маскота | skip MVP-0 | [ADR-013](../04-technical-decisions.md#adr-013-ассеты-маскота) (reopen MVP-1) |
| 12.6 | Result lib | ручной discriminated union | [ADR-024](../04-technical-decisions.md#adr-024-result-style-либа--ручной-discriminated-union) |
| 12.7 | Tests расположение | co-located use case + `tests/domain/` | [ADR-025](../04-technical-decisions.md#adr-025-tests-расположение--co-located-use-case--testsdomain) |
| 12.8 | Folder layout | flat (без `src/`) | [ADR-026](../04-technical-decisions.md#adr-026-folder-layout--плоская-раскладка-без-src) |

**Pre-init checklist остался**:

1. Trigger Writer L2 → `docs/specs/mvp-0-packets.md` (выполнено, § 5 references).
2. `Skill operator-loop init wave_id=mvp-0 readme=docs/specs/mvp-0-packets.md repo=/usr/projects/Диплом`.

ADR-027 содержит conditional: «T08 blocked на T02 verify» — packets manifest § 2
T08 deps включают T02 для plugin install + CRUD smoke. См [mvp-0-packets.md § 2](mvp-0-packets.md#2-manifest-таблица).

---

## 13. Watchlist references

Закрытые пункты [05-critic-pass.md](../05-critic-pass.md), которые НЕ должны
повторяться в MVP-0 wave. Каждый relevant packet в `read_first` должен иметь
ссылку на свой watchlist item.

### Hard MVP-0 watchlist

- **#3 формула уровней (T05)**: `level = floor(xpTotal / XP_PER_LEVEL) + 1`, без
  смешения totalXP и xpInCurrentLevel. Boundary tests xpTotal=0/999/1000/1001.
- **#7 SQLite-схема (T08, T09)**: CHECK constraints **дословно** из
  [02 § 11](../02-architecture.md#11-sqlite-схема) в `001_initial.sql`. MVP-0 only
  tasks+profile+progression:
  - `tasks.status CHECK IN ('active','completed','archived')`
  - `tasks.priority CHECK IN ('low','normal','high')`
  - `tasks.complexity CHECK IN ('tiny','small','medium','large')`
  - `tasks.complexity_source CHECK IN ('suggested','manual')`
  - `progression.level CHECK >= 1`, `xp_total CHECK >= 0`
  - composite `idx_tasks_profile_id ON tasks(profile_id, id)`
  - `PRAGMA foreign_keys = ON` **каждый** open [AGENTS § 9 #24](../../AGENTS.md#9-anti-patterns-hard).
- **#10 группы задач (T07)**: `resolveTaskList` группирует: просроченные /
  ближайшие / без дедлайна / completed; внутри — high priority → earlier dueAt →
  newer createdAt.
- **#11 reminder-поля НЕ в MVP-0 (T08)**: `001_initial.sql` БЕЗ `reminder_at`,
  `reminder_enabled`, `reminder_notification_id` (ALTER в MVP-2).
- **#12 + #14 completeTask transactional (T07)**: `complete-task.use-case.ts`
  оборачивает status+XP+level в `unitOfWork.run(ctx)`. Repositories — `ctx.*`,
  не `deps.*` ([AGENTS § 9 #17](../../AGENTS.md#9-anti-patterns-hard)). Use case
  тесты verify это.
- **#15 migration runner contract (T08)**: algorithm
  [02 § 12](../02-architecture.md#12-migration-runner-contract). Insert
  `schema_migrations` только после SQL success, rollback на ошибке.
- **#19 ordered decision tree (T06)**: правила сверху вниз, первое match
  возвращает. Tests на каждое + fallback `tiny`.
- **completeTask idempotency (T07)** [AGENTS § 9 #4, #5 prep](../../AGENTS.md#9-anti-patterns-hard):
  повторный complete на completed task — БЕЗ повторного XP. Проверка
  `task.status === 'active'` перед grant ИЛИ no-op Result / domain error.

### MVP-1 prep (НЕ implement, НЕ сломать дизайн)

- **#23 composite index сохранить (T09)**: `idx_tasks_profile_id` остаётся даже
  если MVP-0 запросам не нужен — future MVP-1 FKs `REFERENCES tasks(profile_id, id)`
  на него опираются ([AGENTS § 9 #14](../../AGENTS.md#9-anti-patterns-hard)).
- **equipItem 5-step (MVP-1)**: НЕ implement. Не выкидывать `MascotRepository.findSlots`
  из ports overview ([AGENTS § 9 #27](../../AGENTS.md#9-anti-patterns-hard)).
- **completeTask extensibility (T07)**: signature принимает optional hooks
  `onLevelUp(ctx, newLevel)` для будущего `grantLevelRewards` MVP-1 — не
  переписывать use case целиком потом ([05 #4, #21, #30](../05-critic-pass.md#что-было-исправлено)).
  Hook signature формально не в 02 § 13 — добавить ADR-029 либо patch 02 § 8
  до T07 dispatch (worker не угадывает signature).

---

## 14. Vision lead source (для strategic review)

Strategic Architect cron prompt берёт meta-goal из этого файла, секция § 2
"Wave goal (Final Formula)". Operator extract:

```bash
sed -n '/^## 2. Wave goal/,/^## 3\./p' docs/specs/mvp-0.md
```

Передаёт architect'у как `<cat docs/specs/<wave>.md § "Final Formula" | "Коротко">`.
Architect сравнивает с git log -3 + health slice(-3) → 6 principles JSON verdict.

Юзер при `recommendation=adjust_wave` patch'ит **этот** файл (§ 2 / § 3 success
criteria), не packet README. Wave drift фиксится в spec'е, не в задачах.

---

## 15. Связанные документы

- [01-product-vision.md § 8 MVP-0](../01-product-vision.md#8-mvp-0) — продуктовое определение MVP-0
- [02-architecture.md](../02-architecture.md) — canon архитектура (типы, слои, ports, SQLite схема, migration runner)
- [03-build-roadmap.md § 2, § 7](../03-build-roadmap.md) — этапы 1-5 и DoD
- [04-technical-decisions.md](../04-technical-decisions.md) — ADR-001..021 (база) + ADR-022..026 (нужно создать перед wave init, § 12)
- [05-critic-pass.md](../05-critic-pass.md) — watchlist (§ 13 references)
- [07-task-packet-template.md](../07-task-packet-template.md) — packet anatomy + worked examples T01/T05/T08
- [AGENTS.md](../../AGENTS.md) — layering / naming / tests / anti-patterns
- `~/.claude/skills/operator-loop/SKILL.md` — wave orchestration mechanics
- `~/.claude/skills/plan-multi-review/SKILL.md` — 3-critic gauntlet для этого spec'а ДО wave init
- `docs/specs/mvp-0-packets.md` — packet queue (Writer L2 output, ожидает этот spec)

---

Конец wave spec mvp-0. Любое изменение целей / scope / risk tier — через patch
этого файла + увеличение версии в git commit message. Mid-wave mutation
запрещён ([operator-loop § Anti-patterns "Mid-wave constitution mutation"](~/.claude/skills/operator-loop/SKILL.md#anti-patterns)).
