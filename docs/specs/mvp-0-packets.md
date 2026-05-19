# MVP-0 packet queue

## 1. Назначение

Manifest 15 packet'ов для MVP-0 wave (Task Companion: Nuxt 4 + Capacitor +
SQLite, hexagonal). Формат каждого full packet'а — [07-task-packet-template.md
§ 3](../07-task-packet-template.md#3-шаблон-для-копипасты). Этот файл —
**только manifest**: id, goal, deps, risk_tier, file cap, gates. Юзер заполняет
full packet по шаблону ПЕРЕД dispatch'ем в fresh chat. T01/T05/T08 —
worked examples в 07 § 4-6. Operator-loop читает таблицу § 2 как
`packets[]` в state.

---

## 2. Manifest таблица

| ID | Goal (1 line) | Roadmap | Deps | Risk tier | File max | Architect | Challenge |
|----|---------------|---------|------|-----------|----------|-----------|-----------|
| mvp-0-T01-scaffold-base | Nuxt 4 + TS strict + Pinia + Vitest + folder layout | 1 | — | ordinary | 15 | нет | нет |
| mvp-0-T02-capacitor-android | Capacitor 6+ install + Android platform + sync skeleton | 1 | T01 | ordinary | 10 | нет | нет |
| mvp-0-T03-domain-task | Task type + status/priority/complexity enums + invariants tests | 2 | T01 | ordinary | 6 | нет | нет |
| mvp-0-T04-domain-profile-progression | Profile + Progression types + computeLevel + computeProgress + XP_PER_LEVEL=1000 | 2 | T01 | ordinary | 6 | нет | нет |
| mvp-0-T05-domain-xp-rules | task-xp.ts: BASE_XP, PRIORITY_BONUS, computeBaseXp, computeFinalXp (MVP-0 `finalXp = baseXp`, taskMultiplier=1, equipmentXpMultiplier=1 — explicit invariant) + Vitest | 2 | T03,T04 | strong_gate | 8 | да | нет |
| mvp-0-T06-use-cases-task-operations | suggestTaskComplexity (ordered decision tree) + resolveTaskList (группировка) + applyLevelProgress — use-case layer per [02 § 4.3](../02-architecture.md#43-use-case-layer-mvp-0) (`*.use-case.ts`), tests co-located (ADR-025) | 2 | T03,T04,T05 | strong_gate | 8 | да | нет |
| mvp-0-T07-use-cases-tasks | createTask + completeTask (через UoW → grantTaskXp → applyLevelProgress) + archiveTask | 2 | T05,T06 | strong_gate | 10 | да | **да** |
| mvp-0-T08-sqlite-migration-runner | migration-runner + 001_initial.sql + schema_migrations + PRAGMA foreign_keys=ON + transaction-per-migration (single TX wrap: SQL+schema_migrations INSERT в одной BEGIN/COMMIT, rollback on error) | 3 | T01,T02 | db_migration | 6 | да | **да** |
| mvp-0-T09-sqlite-repositories | SqliteTaskRepository + SqliteProfileRepository + SqliteProgressionRepository + SqliteUnitOfWork (Capacitor SQLite) | 3 | T07,T08 | db_migration | 10 | да | **да** |
| mvp-0-T10-memory-repositories | Memory* analogues для browser dev + MemoryUnitOfWork | 3 | T07 | ordinary | 8 | нет | нет |
| mvp-0-T11-dependency-container | AppDependencies + plugins/dependencies.client.ts + useAppDependencies + runtime detection (Capacitor vs browser) | 3 | T09,T10 | strong_gate | 6 | да | **да** |
| mvp-0-T12-bootstrap-flow | Bootstrap: detect runtime → open DB → run migrations → create profile/progression если нет → load initial state | 3 | T11 | strong_gate | 6 | да | нет |
| mvp-0-T13-ui-task-flow | TaskCard + TaskList (группы overdue/upcoming/no-deadline/completed) + create form + complete button + archive action | 4 | T12 | ordinary | 14 | нет | нет |
| mvp-0-T14-ui-profile-level | Profile screen: имя + уровень + xp progress bar | 4 | T12 | ordinary | 4 | нет | нет |
| mvp-0-T15-design-tokens-polish | Static dark baseline: цвета, отступы, типография, радиусы, empty/loading/error states | 5 | T13,T14 | ordinary | 10 | нет | нет |

**Итого:** 15 packets, **5 strong_gate** (T05/T06/T07/T11/T12), 2 db_migration
(T08/T09), **8 ordinary** (T01/T02/T03/T04/T10/T13/T14/T15). **4 challenge-gate**
(T07/T08/T09/T11) — explicit manual override [wave spec § 7](mvp-0.md#7-critic-dispatch-triggers)
переопределяет default operator-loop trigger (`file_count_max > 5` clause не
применяется к ordinary tier — иначе 13 packets fire). **7 architect-skill
вызовов** через operator-loop verdict-spawning (T05/T06/T07/T08/T09/T11/T12).
Worker model dispatch: **8 Sonnet** (ordinary) + **7 Opus** (5 strong_gate + 2 db_migration).

---

## 3. Critical-path DAG

```txt
T01 ──┬── T02 ── T08 ──┐
      │                │
      ├── T03 ──┐      │
      │         ├── T05 ──┐
      ├── T04 ──┤         │
      │         └─────────┤
      │                   ├── T06 ──┐
      │                   │         ├── T07 ──┬── T09 ──┐
      │                   │         │         │         │
      │                   │         │         │         ├── T11 ── T12 ──┬── T13 ──┐
      │                   │         │         │         │                │         ├── T15
      │                   │         │         └── T10 ──┘                ├── T14 ──┘
```

**Critical path (longest):** T01 → T02 → T08 → T09 → T11 → T12 → T13 → T15 =
**8 packet hops** (T09 ждёт T07+T08 — T08 path длиннее после введения T02 dep).
Также параллельная ветка T01→T03/T04→T05→T06→T07 (7 hops) сходится в T09.

**Bottleneck — T09** (требует T07 domain-готовности + T08 миграции). T08 теперь
deps T02 (per [ADR-027](../04-technical-decisions.md#adr-027-capacitor-sqlite-plugin--capacitor-communitysqlite)
T08 blocked на T02 verify — plugin install + CRUD smoke). Любой simp в T07/T08
→ T09 заходит раньше.

---

## 4. Parallel execution opportunities

Operator-loop cap = 3 параллельных subagent'а. Расклады:

- **Волна 1 (после T01 done):** T02 + T03 + T04 parallel (3 slots, full cap).
  T02 независим, T03/T04 независимы друг от друга. T08 ждёт T02 (deps T01,T02
  per ADR-027 plugin install) — стартует после T02 done.
- **Волна 2 (после T03/T04 done):** T05 (need T03+T04) + T08 (если T02 done) +
  T06 не может — ждёт T05. Если T08 уже в работе → T05 solo (cap=3 не нарушен).
- **Волна 3 (после T05 done):** T06 single (need T03+T04+T05).
- **Волна 4 (после T06 done):** T07 single (need T05+T06).
- **Волна 5 (после T07 done):** T09 (need T07+T08, ждёт T08 если ещё идёт) +
  T10 (need T07) parallel.
- **Волна 6 (после T09+T10 done):** T11 single (need T09+T10).
- **Волна 7 (после T11 done):** T12 single (need T11).
- **Волна 8 (после T12 done):** T13 + T14 parallel.
- **Волна 9 (после T13+T14 done):** T15 single (need T13+T14).

**Realistic минимум:** 9 волн при идеальном scheduling'е. Если T08 затянется
(db_migration + challenge-gate) — T09 wall, остальные не помогут.

---

## 5. Strategic-review checkpoints

`STRATEGIC_REVIEW_EVERY=3` — operator-loop спавнит strategic subagent после
каждого **3-го completed packet'а** (counter `packets_done_since_review` reset
на каждом spawn, не привязан к ID). Checkpoints fire на **3-м / 6-м / 9-м /
12-м** packet'е completed (зависит от parallel waves § 4 — конкретные IDs
варьируются по scheduling).

Expected focus per checkpoint:

- **Checkpoint 1 (~3-й packet, typically scaffold + 2 domain)**: drift / scope
  check domain layer setup. Типы соответствуют 02-architecture § 7, no MVP-1
  утечек (mascot/inventory).
- **Checkpoint 2 (~6-й packet, typically domain complete + first use cases)**:
  domain → use case переход. UoW abstraction правильная? Tests для T05/T06/T07?
- **Checkpoint 3 (~9-й packet, typically infra done)**: infrastructure review.
  Memory + SQLite паритет (один use case test проходит на обоих repo set'ах)?
  T08 + T09 challenge-gate verdict'ы учтены?
- **Checkpoint 4 (~12-й packet, typically bootstrap + UI start)**: UI layer
  review. Mobile viewport, нет business logic в store, use case → store → UI.

Strategic findings → patch packet'ам ещё в очереди либо новый `<ID>-fix` packet
после соответствующего terminal hop.

---

## 6. Challenge-gate packets

Operator-loop trigger: `risk_tier ∈ {db_migration, security} OR file_count_max > 5`.
Codex challenger spawn'ится ПОСЛЕ implementer'а, ДО merge. Для MVP-0:

- **mvp-0-T07 — use-cases-tasks** (`strong_gate`, `file_count_max=10`). Trigger
  `file_count_max > 5`. Challenge target: nested `unitOfWork.run` запрет;
  idempotency `completeTask` (status guard); use case не импортирует
  infrastructure.
- **mvp-0-T08 — migration runner** (`db_migration`, `file_count_max=6`).
  High-risk DB. Challenge target: CHECK constraints дословно из 02-architecture § 11,
  PRAGMA foreign_keys=ON в каждом connection, transaction-per-migration с
  ROLLBACK на failure, idempotent re-run, smoke from empty DB.
- **mvp-0-T09 — SqliteRepositories** (`db_migration`, `file_count_max=10`).
  Production-runtime persistence. Challenge target: same-profile ownership
  (composite `(profile_id, id)`), UoW atomicity для `completeTask` chain,
  mapper'ы camelCase ↔ snake_case без потерь, no `Math.random()`/`new Date()`.
- **mvp-0-T11 — dependency-container** (`strong_gate`, `file_count_max=6`).
  Trigger `file_count_max > 5`. Challenge target: DI race на bootstrap;
  runtime detection Capacitor vs browser; AppDependencies type completeness.

Challenge verdict'ы:
- `pass` → merge ok, `challenge_done_for_sha = current_impl_sha`.
- `fail (severity < critical)` → blocker `challenge_broke`, round++, fix-dispatch.
- `severity = critical` → forced escalate (constitution rule).

Остальные packets (T01-T06, T10, T12-T15) — ordinary worker + critic, без
Codex challenge (не блокирующий, опционально через `/codex:rescue` post-impl
если diff >100 LOC).

---

## 7. gstack skill hooks

Расширенный набор vs wave spec:

| Packet | gstack skill | Когда / зачем |
|--------|--------------|---------------|
| T01 | `/setup-deploy` (опционально) | После acceptance, если планируется APK release post-MVP-0 |
| T05 | `/codex:rescue` review | Diff >100 LOC strong_gate → second-opinion на XP формулы |
| T08 | `/architect` (встроено в operator) + `/codex:rescue` (post-impl) | DB безопасность, CHECK constraints |
| T09 | `/architect` + `/codex:rescue` | UoW atomicity, mapper correctness |
| T11 | `/architect` | DI правильность критична для всего проекта |
| T13 | `/design-consultation` (перед) → `/design-shotgun` (3 варианта TaskCard) → `/design-html` (финал) → `/design-review` (eye QA) | UI этап, mobile viewport polish |
| T14 | `/design-shotgun` (XP progress bar варианты) | Lightweight UI, опционально |
| T15 | `/devex-review` (через `/browse` Capacitor preview) + `/qa-only` | Pre-ship QA, empty/loading/error states |
| После T15 | `/ship` или `/land-and-deploy` | Release MVP-0 |
| После wave done | `/retro` + `/document-release` + `gbrain extract` | Capture learnings, update docs, sync subbrain |

---

## 8. DoD per packet

Каждый packet status=done в state file требует (поверх packet acceptance из
07 § 3):

- [ ] architect verdict = `ok` (если risk_tier ≥ strong_gate)
- [ ] critic verdict = `ok` (RLM cycle min 3 / max 10 iter)
- [ ] challenge verdict = `pass` (если challenge-gate включён — T08/T09)
- [ ] health composite ≥ 7 (tsc + vitest + lint + dead-code)
- [ ] `bun test` зелёный, `tsc --noEmit` чистый
- [ ] commit с осмысленным message (caveman ru ok, императив)
- [ ] state file `.operator-state.mvp-0.json` updated atomically (no
      half-write)
- [ ] daily note (`~/vault/RLM/Daily/YYYY-MM-DD.md`) содержит запись
      packet → result

Если хоть один пункт fail → packet status = `worker_fail`, operator-loop
решает: retry либо investigator subagent.

---

## 9. Open decisions — closed by ADR-022..028 (2026-05-19)

Все pre-init decisions закрыты в [04-technical-decisions.md](../04-technical-decisions.md).
См [mvp-0.md § 12](mvp-0.md#12-open-decisions--closed-by-adr-022028) полную
таблицу с ADR ссылками. Wave init unblocked.

Резюме:
- bun (ADR-022), `@capacitor-community/sqlite` (ADR-027, T08 deps T02 для install verify),
  minSdk 22 / targetSdk 34 (ADR-023), memory-only browser dev (ADR-028), ручной
  Result (ADR-024), co-located use case + `tests/domain/` (ADR-025), flat layout
  (ADR-026).

---

## 10. Полные packet'ы — где живут

- **T01, T05, T08** — готовые worked examples в [07 § 4-6](../07-task-packet-template.md#4-worked-example-mvp-0-scaffold).
  Копипастом в fresh chat без правок.
- **T02, T03, T04, T06, T07, T09, T10, T11, T12, T13, T14, T15** — юзер
  заполняет по [07 § 3 шаблону](../07-task-packet-template.md#3-шаблон-для-копипасты)
  ПЕРЕД dispatch'ем в fresh chat. Шаблон self-contained — fresh chat имеет
  всё для работы (goal, scope_in/out, acceptance, deps, read_first,
  risk_tier, file_count_max, notes).
- **Anti-patterns checklist** для каждого packet'а — [AGENTS § 9](../../AGENTS.md#9-anti-patterns-hard)
  + [05-critic-pass.md](../05-critic-pass.md) watchlist. read_first каждого
  packet'а ссылается на релевантные пункты.

---

## 11. Cross-refs

- [03-build-roadmap.md](../03-build-roadmap.md) — этапы 1-5 MVP-0
- [02-architecture.md](../02-architecture.md) — типы, ports, схема (canon)
- [04-technical-decisions.md](../04-technical-decisions.md) — ADR-001..021
- [07-task-packet-template.md](../07-task-packet-template.md) — packet формат
  + worked examples T01/T05/T08
- [05-critic-pass.md](../05-critic-pass.md) — watchlist для critic round'ов
- [AGENTS.md](../../AGENTS.md) — folder layout, anti-patterns, DoD
- [08-glossary.md](../08-glossary.md) — словарь терминов

---

Конец manifest'а. Любое расширение/правка очереди — patch этого файла +
обновление `.operator-state.mvp-0.json` (если wave уже стартовал).
