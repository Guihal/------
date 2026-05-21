# Workspace layout

Каноничная структура новой client-server версии:

```txt
workspace/
  workspace/server/       # Bun + PostgreSQL backend, source of truth
  workspace/admin-panel/  # separate admin web app
  workspace/app/          # mobile/client app
```

Root проекта хранит `AGENTS.md`, `docs/`, orchestration state и общие specs.
Исполнители работают только в путях, разрешённых packet'ом.
