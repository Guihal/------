# Документы проекта

Рабочий источник правды:

- [10-rebuild-technical-spec.md](10-rebuild-technical-spec.md) — ТЗ clean
  rebuild.
- [RULES.md](RULES.md) — инженерные правила и ограничения слоев.
- [packets/README.md](packets/README.md) — очередь пакетов реализации.

Старые варианты MVP-0/offline-only/spec packets удалены и не должны
восстанавливаться. Текущая цель: приложение с обязательной авторизацией,
backend как source of truth, task flow, XP, наградами, маскотом, инвентарем,
visual state, админ-панелью и PostgreSQL базой минимум на 10 таблиц.

Обязательный стек:

- админ-панель: Nuxt 4, Pinia, Tailwind CSS, SCSS;
- мобильное приложение: Nuxt 4, Capacitor, Pinia, Tailwind CSS, SCSS;
- backend: простой API, рекомендуемый вариант — Go single binary + PostgreSQL.
