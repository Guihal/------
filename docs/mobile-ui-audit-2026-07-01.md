# Mobile UI Audit — 2026-07-01

## Баги визуала

### 1. Loading state — settings и profile

`settings.vue` и `profile.vue` используют независимые `v-if` вместо цепочки `v-else-if`. При повторном заходе на страницу Pinia сохраняет данные → loading текст И контент рендерятся одновременно.

**settings.vue строка 23:**
```html
<!-- СЕЙЧАС: -->
<template v-if="settings">

<!-- ДОЛЖНО БЫТЬ: -->
<template v-else-if="settings">
```

**profile.vue строка 36:**
```html
<!-- СЕЙЧАС: -->
<template v-if="profile.profile">

<!-- ДОЛЖНО БЫТЬ: -->
<template v-else-if="profile.profile">
```

`inventory.vue` и `tasks.vue` — нормально, там `v-if/v-else-if/v-else` цепочка.

---

### 2. Прыжок фона при клавиатуре

**Корень — main.scss строки 11-13:**
```scss
html, body, #__nuxt { height: 100% }
```
`height: 100%` = viewport. Клавиатура сжимает viewport → всё прыгает.

**Fix:** заменить на `min-height: 100dvh` или убрать height с body/html (оставить только на `#__nuxt`).

**VisualBackground.vue строка 79:** `position: fixed; inset: 0` — прыгает вместе с viewport. Acceptable если исправить body height, но лучше проверить.

**Bottom sheets используют `vh` вместо `dvh`:**
- `TaskFormSheet.vue` строка 38: `max-height: 92vh` → `92dvh`
- `TaskDetails.vue` строка 79: `max-height: 88vh` → `88dvh`

**auth.vue строка 11:** `min-height: 100%` → `min-height: 100dvh`

---

### 3. Missing ellipsis в AppHeader

`AppHeader.vue` строка 25: `"Прогресс загружается"` — нет "…". Все остальные loading'и с многоточием.

**Fix:** `"Профиль загружается…"`

---

## Тексты — дружелюбный стиль

Все пользовательские тексты должны быть неформальными, дружелюбными. Сейчас часть текстов формальная ("Проверьте email и пароль"), часть — нет ("Создаём…").

### 4. Дженерик-жаргон "P15" видят юзеры

- `pages/settings.vue` строка 29: `"Push-доставка появится в P15."`
- `components/settings/ReminderOffsetField.vue` строка 23: `"Доставка push и жизненный цикл напоминаний — отдельный этап P15."`

**Fix:** переформулировать без internal packet names.

### 5. "fallback" — английское в русском предложении

`pages/settings.vue` строка 37: `"Отключает визуальную вариативность и использует спокойный fallback."`

**Fix:** заменить "fallback" на "стандартный вариант" или "спокойный вид".

### 6. "без дедлайна" vs "не задано"

- `TaskCard.vue` строка 24: `"без дедлайна"`
- `TaskDetails.vue` строка 32: `"не задано"`

Один concept — два слова. Выбрать одно, использовать везде.

### 7. "все" vs "Все" — кавитализация

- `InventoryFilters.vue` строка 20: `<option value="all">все</option>` (с маленькой)
- `TaskFilters.vue` строки 28, 40: `Все` (с большой)

Привести к единому стилю.

---

## Дублирование кода

### 8. Rarity labels дублируются

- `composables/useInventoryLabels.ts` строки 5-10: `rarityLabels`
- `composables/useRewardText.ts` строки 5-10: `rarity` (идентичный объект)

**Fix:** `useRewardText.ts` должен импортировать из `useInventoryLabels.ts`.

### 9. Priority/complexity labels дублируются в 3 файлах

- `TaskCard.vue` строки 17-18
- `TaskDetails.vue` строки 27-28
- `TaskForm.vue` строки 46-47

**Fix:** вынести в shared composable или constants.

---

## Accessibility

### 10. Missing aria-label на кнопке "Выйти"

`pages/profile.vue` строка 38: кнопка "Выйти" без `aria-label`.

### 11. Missing aria-label на equip/unequip кнопке

`components/inventory/InventoryItemCard.vue` строки 40-46: кнопка "Снять"/"Надеть" без контекста какого предмета.

### 12. SettingsToggle description не связан через aria-describedby

`components/settings/SettingsToggle.vue`: `<small>` description не линкуется к checkbox.

---

## Стиль текстов — неформальный

Сейчас смешанный стиль. Нужно привести к дружелюбному, неформальному тону:

- "Не удалось войти. Проверьте email и пароль." → "Что-то пошло не так при входе. Попробуйте ещё раз?"
- "Не удалось загрузить задачи." → "Не удалось загрузить задачи. Проверьте соединение?"
- "Сессия истекла. Войдите снова." → "Сессия закончилась. Войдите заново"
- Все сообщения об ошибках — мягче, с вопросительным знаком
- Loading тексты — оставить как есть (они уже дружелюбные)

---

## Приоритет фиксов

1. **settings.vue / profile.vue** — loading state chain (баг)
2. **main.scss** — height: 100% → dvh (прыжок фона)
3. **TaskFormSheet / TaskDetails** — vh → dvh (bottom sheets)
4. **Тексты** — убрать P15, fallback, привести к неформальному стилю
5. **Дубли** — вынести labels в shared
6. **Accessibility** — aria-labels
