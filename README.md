# Task Companion Rebuild

Дипломный проект готовится к clean rebuild как task-manager с обязательной
авторизацией, backend source of truth, XP, уровнями, наградами, маскотом,
инвентарем, visual state, настройками и админ-панелью.

Источник правды:

- [docs/10-rebuild-technical-spec.md](docs/10-rebuild-technical-spec.md)

Инженерные правила:

- [docs/RULES.md](docs/RULES.md)
- [docs/packets/README.md](docs/packets/README.md)

Текущий статус репозитория: старая Nuxt/SQLite/offline-only реализация удалена
из production entrypoints и не является архитектурной основой. Рабочая структура
для следующих пакетов:

```txt
backend/
apps/admin/
apps/mobile/
shared/contracts/
```

Пакеты после P00 должны добавлять код только в своей области ответственности.
До scaffold-пакетов здесь нет команд запуска, тестов, миграций или production
экранов.
