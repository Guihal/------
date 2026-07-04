<script setup lang="ts">
import { AlertTriangle, Archive, CalendarClock, CheckCircle2, Flag, Gauge } from "lucide-vue-next";
import type { Task } from "~~/api";

const props = defineProps<{
  task: Task;
  categoryTitle: string;
  busy: boolean;
}>();

const emit = defineEmits<{
  open: [task: Task];
  complete: [task: Task];
  archive: [task: Task];
}>();

const priority = { low: "низкий", normal: "обычный", high: "высокий" };
const complexity = { tiny: "очень малая", small: "малая", medium: "средняя", large: "большая" };

const deadline = computed(() =>
  props.task.deadline_at
    ? new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(props.task.deadline_at))
    : "без дедлайна",
);
</script>

<template>
  <article class="card" :class="task.status">
    <button class="main tap" type="button" @click="emit('open', task)">
      <span class="topline">
        <span class="category">{{ categoryTitle }}</span>
        <span v-if="task.overdue && task.status === 'active'" class="overdue">
          <AlertTriangle :size="15" aria-hidden="true" />
          просрочено
        </span>
      </span>
      <strong>{{ task.title }}</strong>
      <span v-if="task.description" class="description">
        {{ task.description }}
      </span>
      <span class="meta">
        <span><CalendarClock :size="14" />{{ deadline }}</span>
        <span><Flag :size="14" />{{ priority[task.priority] }}</span>
        <span><Gauge :size="14" />{{ complexity[task.complexity] }}</span>
      </span>
    </button>
    <div class="actions" aria-label="Действия с задачей">
      <button
        v-if="task.status === 'active'"
        class="icon-action primary tap"
        type="button"
        aria-label="Выполнить задачу"
        title="Выполнить"
        :disabled="busy"
        @click="emit('complete', task)"
      >
        <CheckCircle2 :size="17" aria-hidden="true" />
      </button>
      <button
        v-if="task.status !== 'archived'"
        class="icon-action tap"
        type="button"
        aria-label="Переместить в архив"
        title="Архив"
        :disabled="busy"
        @click="emit('archive', task)"
      >
        <Archive :size="17" aria-hidden="true" />
      </button>
    </div>
  </article>
</template>

<style scoped lang="scss">
.card {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: stretch;
  border: 1px solid color-mix(in srgb, var(--stroke) 86%, transparent);
  border-radius: var(--radius-lg);
  background: var(--surface-card);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
}
.card.completed, .card.archived { opacity: 0.72; }
.main {
  min-width: 0;
  display: grid;
  gap: 0.42rem;
  width: 100%;
  padding: 0.9rem 0.2rem 0.9rem 0.95rem;
  border: 0;
  background: transparent;
  color: var(--text);
  text-align: left;
}
.main strong { line-height: 1.2; }
.topline, .meta, .meta span, .overdue {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.topline { justify-content: space-between; }
.category, .description, .meta { color: var(--muted); font-size: 0.82rem; }
.description { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.meta { flex-wrap: wrap; row-gap: 0.25rem; }
.overdue { color: var(--danger); font-size: 0.78rem; font-weight: 800; }
.actions {
  display: grid;
  align-content: center;
  gap: 0.35rem;
  padding: 0.55rem 0.55rem 0.55rem 0.2rem;
}
.icon-action {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--stroke) 86%, transparent);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--surface-2) 84%, transparent);
  color: var(--text);
  padding: 0;
}
.icon-action.primary {
  border-color: color-mix(in srgb, var(--accent) 60%, var(--stroke));
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, var(--surface-2));
}
.icon-action:disabled { opacity: 0.5; }
.icon-action:focus-visible, .main:focus-visible { outline: none; box-shadow: inset 0 0 0 2px var(--accent); }
</style>
