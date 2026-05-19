# RLM critic pass

Дата прохода: 2026-05-19.

Статус: архитектура и видение годятся для старта MVP-0. После второго
субагентского critic pass блокирующих проблем не осталось.

## Что было исправлено

1. MVP был раздут.
   Исправлено: добавлен [00-scope-map.md](00-scope-map.md), все функции
   разложены на `MVP-0`, `MVP-1`, `MVP-2`, `Post-MVP`.

2. Маскот, инвентарь, уведомления и visual random блокировали первый релиз.
   Исправлено: MVP-0 теперь содержит только ядро задач, SQLite, XP и уровни.

3. Формула уровней смешивала total XP и XP до следующего уровня.
   Исправлено: уровни считаются линейно через фиксированный `XP_PER_LEVEL`.

4. Награды за уровни могли выдаваться повторно.
   Исправлено: добавлена сущность и таблица `level_rewards`.

5. Browser dev конфликтовал с Android SQLite.
   Исправлено: для браузера зафиксированы memory repositories, для Android -
   SQLite.

6. Dependency injection был слишком абстрактным.
   Исправлено: описан `dependencies.client.ts`, `useAppDependencies` и правило
   передачи deps в stores/use cases.

7. SQLite-схема была слабой.
   Исправлено: добавлены `schema_migrations`, foreign keys, check constraints,
   индексы и phased migrations.

8. Удаление и архивация конфликтовали.
   Исправлено: основной пользовательский flow - архивация. Hard delete не нужен
   для MVP UI.

9. Автоматическая сложность выглядела как объективная оценка усилий.
   Исправлено: она описана как suggested value с ручным override и
   `complexitySource`.

10. Главная могла превратиться в бесконечный список.
    Исправлено: добавлены группы задач: просроченные, ближайшие, без дедлайна,
    выполненные.

11. Reminder-поля преждевременно сидели в MVP-0 task model/schema.
    Исправлено: reminder-поля перенесены в MVP-2 через отдельную миграцию.

12. `completeTask` меняет несколько частей состояния без явной транзакции.
    Исправлено: добавлен `UnitOfWorkPort`, транзакционность для complete/XP/level
    и наград.

13. Roadmap ссылался на уже созданный ADR-документ как на будущий шаг.
    Исправлено: следующий шаг теперь scaffold и реализация MVP-0.

14. `UnitOfWorkPort` обещал transaction, но не передавал transaction-bound
    repositories.
    Исправлено: `run` теперь принимает callback с `UnitOfWorkContext`; внутри
    transaction используются только repositories из `ctx`, nested transactions
    запрещены.

15. Был `schema_migrations`, но не было migration runner contract.
    Исправлено: добавлен алгоритм применения миграций: ordered versions,
    transaction per migration, insert migration record only after success,
    rollback on error.

16. Browser dev repositories были неполными для MVP-1/MVP-2.
    Исправлено: добавлены memory/noop реализации по фазам для mascot,
    inventory, settings, visual state и notifications.

17. Static dark baseline и visual random смешивались.
    Исправлено: MVP-0 содержит статичную темную базу и design tokens, MVP-2
    содержит visual variants, random refresh events и persisted visual state.

18. Notification side effects не имели recovery.
    Исправлено: добавлен notification reconciliation на bootstrap MVP-2.

19. Эвристика сложности была недетерминированной.
    Исправлено: правила сложности записаны как ordered decision tree.

20. REST-обещание было сильнее модели данных.
    Исправлено: добавлен `profile_id` в пользовательские данные и смягчена
    формулировка README до новых repository-реализаций и минимальных изменений
    доменной модели.

21. После уточнения геймификации косметическая модель предметов стала неверной.
    Исправлено: предметы MVP-1 получают ролленый `xpMultiplier`, экипированные
    предметы умножают XP будущих задач, drop chance зависит от итогового XP, а
    результат task drop сохраняется в `task_reward_rolls`.

22. Critic pass 1 нашел, что XP-множители были описаны как общий flow, хотя они
    относятся к MVP-1.
    Исправлено: в продуктовых сценариях и архитектуре явно указано, что в MVP-0
    `finalXp = baseXp`, а task/equipment multipliers применяются с MVP-1.

23. Critic pass 1 нашел риск cross-profile ссылок в inventory/reward/drop
    таблицах.
    Исправлено: добавлены composite unique indexes/FKs для обязательных связей и
    repository ownership checks для optional-ссылок, а audit-связи переведены на
    `ON DELETE RESTRICT`, чтобы физическое удаление не разрушало историю наград.

24. Critic pass 1 нашел неполную запись `TaskRewardRoll` в псевдокоде.
    Исправлено: pseudocode теперь создает полный audit record с `baseXp`,
    `taskMultiplier`, `equipmentXpMultiplier`, `finalXp`, `dropMultiplier`,
    `roll`, `droppedRarity` и `userInventoryItemId`.

25. Critic pass 1 нашел, что БД не ограничивает верхнюю границу XP-множителя.
    Исправлено: `xp_multiplier` получил CHECK `>= 1.0 AND <= 1.45`.

26. Critic pass 2 нашел отсутствие source invariants для `user_inventory_items`.
    Исправлено: добавлен CHECK, который требует ровно один источник:
    `source_level` для `level` или `source_task_id` для `task-drop`.

27. Critic pass 2 нашел отсутствие связи между `dropped_rarity` и
    `user_inventory_item_id`.
    Исправлено: добавлен CHECK, запрещающий состояние “есть редкость без
    предмета” и “есть предмет без редкости”.

28. Critic pass 2 нашел недостаточно явную проверку slot compatibility.
    Исправлено: `equipItem` теперь обязан загрузить owned item, base item,
    active mascot и mascot slots до вызова repository write.

29. Critic pass 2 расширил требования к тестам MVP-1.
    Исправлено: roadmap требует тесты на drop audit, source invariants,
    ownership checks и slot compatibility.

30. Critic pass 3 нашел, что `task_reward_rolls` удаляется каскадом вместе с
    задачей, хотя audit должен запрещать reroll.
    Исправлено: связь `(profile_id, task_id)` переведена на `ON DELETE RESTRICT`.

31. Critic pass 3 нашел, что `source_level` может быть нулевым или
    отрицательным.
    Исправлено: добавлен CHECK `source_level IS NULL OR source_level >= 1`.

32. Critic pass 3 нашел, что audit может ссылаться на предмет другой редкости.
    Исправлено: `createTaskRewardRoll` обязан проверять
    `item.rarity === droppedRarity`.

33. Critic pass 3 нашел отсутствующий контракт `ProfileRepository`.
    Исправлено: добавлен минимальный контракт `getDefault/create/save`.

34. Critic pass 3 нашел несогласованность product text с округлением XP.
    Исправлено: product vision использует `round(...)`.

## Повторная критика

### Blockers

Нет.

### Major risks

Нет после текущих правок.

### Watchlist

1. SQLite-плагин `@capacitor-community/sqlite` нужно подтвердить на scaffold
   этапе фактической установкой и минимальным CRUD.
2. Memory repositories в browser dev не дают персистентность после reload. Это
   осознанный компромисс, но его нельзя путать с production behavior.
3. Для MVP-1 заранее понадобятся реальные ассеты маскота и предметов. Сейчас
   архитектура описывает формат, но не каталог конкретных изображений.
4. UI еще не имеет wireframes. Для MVP-0 достаточно текущих экранов и правил, но
   перед polish стоит сделать быстрый layout pass.
5. Приложение все еще рассчитано на один локальный профиль в MVP, но данные уже
   имеют `profile_id` там, где это важно для будущей синхронизации.

## Итог

Можно начинать MVP-0. Текущий порядок:

```txt
scaffold -> core domain -> SQLite/memory infrastructure -> task flow -> MVP-0 polish
```

Маскот, инвентарь, уведомления и visual random остаются в документах, но больше
не мешают старту рабочего ядра.
