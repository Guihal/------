<script setup lang="ts">
import { Archive, CheckCircle2, ListChecks, ListTodo } from "lucide-vue-next";
import type { TaskCategory, TaskListQuery, TaskStatus } from "~~/api";

const props = defineProps<{
  status: TaskStatus | "all";
  sort: NonNullable<TaskListQuery["sort"]>;
  categoryId: string;
  categories: TaskCategory[];
}>();

const emit = defineEmits<{
  "update:status": [value: TaskStatus | "all"];
  "update:sort": [value: NonNullable<TaskListQuery["sort"]>];
  "update:categoryId": [value: string];
}>();

const statuses = [
  { value: "active", label: "Активные", icon: ListTodo },
  { value: "completed", label: "Готовые", icon: CheckCircle2 },
  { value: "archived", label: "Архив", icon: Archive },
  { value: "all", label: "Все", icon: ListChecks },
] as const;
</script>

<template>
  <section class="filters" aria-label="Фильтры задач">
    <div class="tabs" role="group" aria-label="Статус">
      <button
        v-for="s in statuses"
        :key="s.value"
        type="button"
        class="chip tap"
        :class="{ active: status === s.value }"
        :aria-pressed="status === s.value"
        @click="emit('update:status', s.value)"
      >
        <component :is="s.icon" :size="15" aria-hidden="true" />
        {{ s.label }}
      </button>
    </div>
    <div class="select-row">
      <label>
        <span>Сортировка</span>
        <select :value="sort" @change="emit('update:sort', ($event.target as HTMLSelectElement).value as NonNullable<TaskListQuery['sort']>)">
          <option value="overdue">Просрочка выше</option>
          <option value="deadline">По дедлайну</option>
          <option value="created_at">По созданию</option>
        </select>
      </label>
      <label>
        <span>Категория</span>
        <select :value="categoryId" @change="emit('update:categoryId', ($event.target as HTMLSelectElement).value)">
          <option value="">Все</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.title }}
          </option>
        </select>
      </label>
    </div>
  </section>
</template>

<style scoped lang="scss">
.filters {
  display: grid;
  gap: 0.6rem;
}
.tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem;
  padding: 0.2rem;
  border: 1px solid color-mix(in srgb, var(--stroke) 82%, transparent);
  border-radius: var(--radius-lg);
  background: var(--surface-card);
}
.select-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.55rem;
}
@media (min-width: 390px) {
  .select-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.chip {
  min-height: 42px;
  justify-content: flex-start;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text);
  font-weight: 700;
  padding: 0 0.6rem;
  transition: border-color var(--motion-fast), background var(--motion-fast);
}
.chip,
label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.chip.active {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 16%, var(--surface-2));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 42%, transparent);
}
label {
  min-width: 0;
  flex-direction: column;
  align-items: stretch;
  color: var(--muted);
  font-size: 0.78rem;
}
select {
  min-height: 44px;
  width: 100%;
  border: 1px solid color-mix(in srgb, var(--stroke) 82%, transparent);
  border-radius: var(--radius-md);
  background: var(--surface-card);
  color: var(--text);
  padding: 0 0.65rem;
}
@media (max-width: 340px) {
  .chip { padding: 0 0.5rem; font-size: 0.9rem; }
}
</style>
