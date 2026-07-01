<script setup lang="ts">
import { AlertTriangle, Archive, CalendarClock, CheckCircle2, Eye, Flag, Gauge } from "lucide-vue-next";
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
    <div class="actions">
      <button class="ghost tap" type="button" @click="emit('open', task)">
        <Eye :size="17" aria-hidden="true" />
        Детали
      </button>
      <button
        v-if="task.status === 'active'"
        class="ghost tap"
        type="button"
        :disabled="busy"
        @click="emit('complete', task)"
      >
        <CheckCircle2 :size="17" aria-hidden="true" />
        Выполнить
      </button>
      <button
        v-if="task.status !== 'archived'"
        class="ghost tap"
        type="button"
        :disabled="busy"
        @click="emit('archive', task)"
      >
        <Archive :size="17" aria-hidden="true" />
        Архив
      </button>
    </div>
  </article>
</template>

<style scoped lang="scss">
.card { border: 1px solid var(--stroke); border-radius: var(--radius-lg); background: color-mix(in srgb, var(--surface) 88%, transparent); box-shadow: var(--shadow-soft); overflow: hidden; }
.card.completed,
.card.archived {
  opacity: 0.72;
}
.main { display: grid; gap: 0.45rem; width: 100%; padding: 0.85rem; border: 0; background: transparent; color: var(--text); text-align: left; }
.topline, .meta, .actions, .meta span, .overdue { display: flex; align-items: center; gap: 0.4rem; }
.topline,
.actions {
  justify-content: space-between;
}
.category, .description, .meta { color: var(--muted); font-size: 0.82rem; }
.description { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.meta {
  flex-wrap: wrap;
}
.overdue { color: var(--danger); font-size: 0.78rem; font-weight: 800; }
.actions {
  padding: 0 0.55rem 0.55rem;
  gap: 0.4rem;
}
.ghost { min-height: 40px; border: 1px solid var(--stroke); border-radius: var(--radius-md); background: var(--surface-2); color: var(--text); padding: 0 0.55rem; font-weight: 700; }
.ghost:disabled {
  opacity: 0.5;
}
</style>
