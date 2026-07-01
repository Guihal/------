<script setup lang="ts">
import { Archive, CheckCircle2, ListTodo } from "lucide-vue-next";
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
  { value: "all", label: "Все", icon: ListTodo },
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
    <div class="row">
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
  gap: 0.65rem;
}
.tabs,
.row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
}
.chip {
  min-height: 44px;
  border: 1px solid var(--stroke);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text);
  font-weight: 700;
}
.chip,
label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.chip.active {
  border-color: var(--accent);
  box-shadow: var(--ring);
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
  border: 1px solid var(--stroke);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text);
  padding: 0 0.65rem;
}
</style>
