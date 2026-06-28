# Project Rules

Статус: active. Область действия: весь новый rebuild-код.

Эти правила дополняют [10-rebuild-technical-spec.md](10-rebuild-technical-spec.md),
но не заменяют его. Если правило спорит с ТЗ, сначала править ТЗ.

## 1. Главные принципы

1. Один файл = одна ответственность. Если описание файла содержит "и", файл
   почти всегда нужно разделить.
2. Минимальная связанность: слой знает только о нижнем соседнем слое, а не обо
   всем приложении.
3. Backend является source of truth для auth, `user_id`, XP, level, rewards,
   random, audit, inventory ownership и visual state.
4. Frontend отображает данные, вызывает API и хранит UI/cache state. Он не
   принимает доменные решения за backend.
5. Чистые вычисления отделяются от framework-кода. Vue/Pinia/HTTP/SQL не должны
   протекать в pure domain functions.
6. Ошибки ловятся на границах слоев: HTTP, DB, external storage, form submit.
7. Простая композиция лучше наследования, глобальных singleton-ов и скрытой
   shared mutable state.

## 2. Лимит размера файлов

Hard cap: **150 строк на файл** для handwritten implementation-кода.

Считать нужно непустые строки без комментариев. Пока автоматической проверки нет,
агент обязан проверять размер вручную перед завершением задачи.

Ориентиры:

- Vue SFC: template + script + style вместе <= 150 строк.
- Vue `<script setup>`: <= 80 строк, остальное выносить в composable/service.
- Go/TypeScript production-файл: <= 150 строк.
- Функция: <= 60 строк.
- Компонент с template больше 100 строк разделить на подкомпоненты.

Исключения допустимы только для:

- generated files;
- lock files;
- migrations;
- schema snapshots/OpenAPI generated output;
- test fixtures или большие статические seed payloads;
- canonical docs, которые нельзя дробить без потери роли source of truth:
  `docs/10-rebuild-technical-spec.md` и крупные handoff/packet docs.

Любое temporary-исключение должно быть записано рядом с причиной и планом
удаления. `eslint-disable max-lines` и похожие локальные обходы запрещены.

## 3. Слои и зависимости

Рекомендуемая новая структура:

```txt
apps/mobile -> shared/api -> backend HTTP
apps/admin  -> shared/api -> backend HTTP
backend/http -> backend/usecase -> backend/repository -> PostgreSQL
shared/contracts -> DTO/types/OpenAPI helpers only
```

Пока clean-slate не завершен, те же правила применяются к текущим
`workspace/app`, `workspace/admin-panel` и `workspace/server`.

Запреты по слоям:

- `apps/*` и `workspace/*/app`: не импортировать SQL, DB schema, reward math,
  backend random constants или server-only modules.
- Pinia stores: не считать XP/reward/drop/equip, не валидировать ownership, не
  выполнять random roll.
- Vue components: не делать `$fetch`/API orchestration напрямую, если есть
  store/service слой; не использовать `Math.random()` для visual/reward state.
- `shared/contracts`: только типы, DTO, schemas, client helpers; без Vue, Pinia,
  DOM, SQL и runtime секретов.
- `backend/usecase`: не импортировать UI/admin/mobile код.
- `backend/repository`: SQL/DB access only; бизнес-решения остаются в usecase.

## 4. Code splitting

- Pure compute >= 10 строк вынести в domain/service/util файл.
- Composable >= 30 строк или используемый в 2+ местах вынести в отдельный файл.
- Composable > 100 строк разделить по concerns.
- Абстракция <= 5 строк и с одним call-site обычно остается inline.
- Magic number с доменным смыслом или 2+ use sites вынести в named constant.
- Общие UI primitives держать маленькими: button, field, state, modal, table
  pieces, а не один большой "page component".

## 5. Frontend rules

- Все пользовательские тексты в UI на русском.
- Tailwind отвечает за layout/spacing; SCSS за сложные локальные стили, states,
  mixins и `v-bind()` для visual state.
- Layout mobile-first: ширина 320px без horizontal scroll.
- Interactive target: минимум 44x44px там, где это практично.
- Status/rarity/priority не различаются только цветом.
- Loading, empty, error states обязательны для страниц и ключевых виджетов.
- Reward feedback и ошибки действий объявляются через `aria-live`/status region.
- Access token хранится только в memory runtime.
- Секреты не сохранять в `localStorage`/`sessionStorage`.

## 6. Backend rules

- Auth, ownership, XP, level, reward roll, drop, equip and audit выполняются на
  backend.
- Клиент не отправляет `final_xp`, `level`, `roll_value` или чужой `user_id`.
- Важные изменения идут через транзакции: complete, XP grant, reward roll,
  level reward, equip, archive/reminder lifecycle.
- Идемпотентность фиксируется constraint-ами и тестами, а не надеждой на UI.
- Пароли, raw refresh tokens и секреты не логируются и не пишутся в audit.
- SQL находится в migration/query/repository layer, не в handler/component.
- Rate limit обязателен для auth, admin mutations, refresh и upload.

## 7. Rules for weak-model packets

Слабой модели можно отдавать только закрытые задачи:

- allowed write paths перечислены явно;
- diff budget <= 200 LOC;
- file count <= 4;
- acceptance содержит runnable commands;
- нет права менять API contract, schema, visual language или architecture.

Слабой модели не отдавать:

- новые экраны с нуля;
- mobile layout;
- reward popup;
- mascot/equip placement;
- auth/session/security;
- DB schema;
- XP/reward/random/audit transactions.

## 8. Перед завершением задачи

Проверить:

- файл не превышает 150 строк или имеет разрешенное исключение;
- нет нового нарушения source-of-truth правил из ТЗ;
- frontend не получил backend business logic;
- backend не доверяет клиентскому `user_id` или reward/progression fields;
- измененные public contracts отражены в OpenAPI/shared DTO;
- тесты или smoke-команды запущены, либо явно указано почему не запускались.
