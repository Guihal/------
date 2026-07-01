<script setup lang="ts">
import { Archive, CalendarClock, CheckCircle2, Edit3, Flag, Gauge, X } from "lucide-vue-next";
import type { Task } from "~~/api";

const props = defineProps<{
  task: Task | null;
  categoryTitle: string;
  busy: boolean;
}>();

const emit = defineEmits<{
  close: [];
  edit: [task: Task];
  complete: [task: Task];
  archive: [task: Task];
}>();

const priority = { low: "низкий", normal: "обычный", high: "высокий" };
const complexity = { tiny: "очень малая", small: "малая", medium: "средняя", large: "большая" };
const status = { active: "активная", completed: "выполнена", archived: "в архиве" };

function formatDate(value?: string | null) {
  if (!value) return "не задано";
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
</script>

<template>
  <Teleport to="body">
    <div v-if="task" class="backdrop" role="presentation">
      <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="task-details-title">
        <header>
          <div>
            <p class="eyebrow">{{ categoryTitle }} · {{ status[task.status] }}</p>
            <h2 id="task-details-title">{{ task.title }}</h2>
          </div>
          <button class="icon tap" type="button" aria-label="Закрыть детали" @click="emit('close')">
            <X :size="20" aria-hidden="true" />
          </button>
        </header>
        <p v-if="task.description" class="description">{{ task.description }}</p>
        <dl>
          <div><dt><CalendarClock :size="16" />Дедлайн</dt><dd>{{ formatDate(task.deadline_at) }}</dd></div>
          <div><dt><Flag :size="16" />Приоритет</dt><dd>{{ priority[task.priority] }}</dd></div>
          <div><dt><Gauge :size="16" />Сложность</dt><dd>{{ complexity[task.complexity] }}</dd></div>
        </dl>
        <p v-if="task.overdue && task.status === 'active'" class="overdue">
          Просрочено: задача активна, дедлайн уже прошел.
        </p>
        <div class="actions">
          <button class="ghost tap" type="button" @click="emit('edit', task)">
            <Edit3 :size="17" aria-hidden="true" />Изменить
          </button>
          <button
            v-if="task.status === 'active'"
            class="ghost tap"
            type="button"
            :disabled="busy"
            @click="emit('complete', task)"
          >
            <CheckCircle2 :size="17" aria-hidden="true" />Выполнить
          </button>
          <button
            v-if="task.status !== 'archived'"
            class="ghost tap"
            type="button"
            :disabled="busy"
            @click="emit('archive', task)"
          >
            <Archive :size="17" aria-hidden="true" />Архив
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.backdrop { position: fixed; inset: 0; z-index: 30; display: grid; align-items: end; background: color-mix(in srgb, var(--bg) 70%, transparent); }
.sheet {
  max-height: 88vh;
  overflow: auto;
  padding: 1rem;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  border: 1px solid var(--stroke);
  background: var(--surface);
}
header, dt, .actions, .ghost { display: flex; align-items: center; gap: 0.5rem; }
header {
  justify-content: space-between;
}
h2, .eyebrow, .description, dl { margin: 0; }
.eyebrow, dd, .description { color: var(--muted); }
.icon, .ghost { border: 1px solid var(--stroke); background: var(--surface-2); color: var(--text); }
.icon { border-radius: var(--radius-md); padding: 0.6rem; }
dl {
  display: grid;
  gap: 0.65rem;
  padding: 0.85rem 0;
}
dt {
  font-weight: 800;
}
dd {
  margin: 0.15rem 0 0 1.6rem;
}
.overdue {
  color: var(--danger);
  font-weight: 800;
}
.actions {
  flex-wrap: wrap;
}
.ghost { min-height: 44px; border-radius: var(--radius-md); padding: 0 0.75rem; font-weight: 800; }
</style>
