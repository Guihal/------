# UI Polish Loop — Диплом

**Создано:** 2026-05-20 03:05  
**Цель:** 100 циклов идеальной полировки UI.  
**Правило:** Каждый цикл = скрин → анализ → орда агентов → фикс → скрин проверка.  
**Счётчик:** 1/100 (cycle #1 завершён: i18n-ru + Inter font + visual polish + bootstrap guard)

## Loop Protocol

```
[START] → build → start prod server → screenshots (mobile/desktop) 
    → image analysis → identify issues 
    → spawn parallel agents (visual, a11y, i18n, performance, mobile)
    → fixes → commit 
    → build → screenshots 
    → compare before/after 
    → if improved: counter++ → [START] 
    → if no improvement: stop, notify user
```

## Agent Roles per Cycle

| Agent | Task |
|-------|------|
| **screenshot** | Делает скрины 320/375/768/1280 |
| **vision-analyzer** | Анализирует скрины, ищет косяки |
| **visual-fix** | Фиксит CSS/layout/colors |
| **a11y-check** | WCAG contrast, tap targets, focus |
| **i18n-check** | Проверяет русский текст, непереведённое |
| **mobile-check** | 320px-768px responsive |
| **performance-check** | Bundle size, font loading, render |

## Checklist per Cycle

- [ ] Все страницы dark background (не white)
- [ ] Шрифт Inter Variable загружается (не system fallback)
- [ ] Текст на русском (не английский)
- [ ] Контраст WCAG AA (>=4.5:1 для normal, >=3:1 для large)
- [ ] Tap targets >= 44x44px
- [ ] Нет горизонтального скролла на 320px
- [ ] Loading state показывается при bootstrap
- [ ] Empty states с иконками/иллюстрациями
- [ ] Profile page не пустая
- [ ] Нет 500 ошибок в production
- [ ] Playwright e2e проходят
- [ ] Скриншоты сохраняются в `docs/polish-cycles/cycle-N/`

## Stop Conditions

- 100 циклов достигнуто
- 3 цикла подряд без улучшений
- Критичный баг сломал билд
- Пользователь сказал стоп

## Artifacts

- `docs/polish-cycles/cycle-{N}/` — скриншоты, diff, notes
- `docs/polish-cycles/CHANGELOG.md` — что менялось в каждом цикле
- `docs/polish-cycles/ISSUES.md` — открытые проблемы

## Current State (Cycle #1)

- Bootstrap guard: ✅ (production stable)
- Russian i18n: ✅
- Inter font: ✅
- Dark baseline: ✅ (но профиль может иметь белые пробелы)
- Missing: маскот Ники (картинки в корне не используются)
- Missing: полноценный task create form на главной
- Missing: task interactions (complete/archive) — нет кнопок в UI?

## Next Priority Areas

1. **Главная страница** — должна показывать форму создания задачи + список
2. **Маскот Ники** — добавить в профиль или empty states
3. **Анимации** — transition для XP bar, page transitions
4. **Task interactions** — кнопки выполнить/в архив должны работать
5. **Form UX** — валидация, ошибки, loading states
6. **Мобильный viewport** — проверить 320px

## Automated Execution

Cron job запущен. Каждые 30 минут:
1. Build + screenshot
2. Spawn analysis agents
3. Apply fixes if issues found
4. Commit with cycle number
5. Log results

## User Notes

- Дима спит, работаем автономно
- При критичном баге — сообщить через Telegram (но не спамить)
- Маскот Ники — приоритет #1 после стабильности
- Готовый продукт = можно показать человеку без объяснений
