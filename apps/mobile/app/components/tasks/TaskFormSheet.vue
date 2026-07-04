<script setup lang="ts">
import type { Task, TaskCategory, TaskCreateRequest } from "~~/api";

defineProps<{
  open: boolean;
  task: Task | null;
  categories: TaskCategory[];
  saving: boolean;
  error: string | null;
}>();

const emit = defineEmits<{
  submit: [body: TaskCreateRequest];
  close: [];
}>();
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="backdrop">
      <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="task-form-title">
        <h2 id="task-form-title">{{ task ? "Изменить задачу" : "Новая задача" }}</h2>
        <TaskForm
          :task="task"
          :categories="categories"
          :saving="saving"
          :error="error"
          :submit-text="task ? 'Сохранить' : 'Создать'"
          @submit="emit('submit', $event)"
          @cancel="emit('close')"
        />
      </section>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.backdrop { position: fixed; inset: 0; z-index: 25; display: grid; align-items: end; background: color-mix(in srgb, var(--bg) 70%, transparent); }
.sheet {
  max-height: 92dvh;
  overflow: auto;
  padding: 1rem;
  border: 1px solid var(--stroke);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  background: var(--surface-card);
  backdrop-filter: blur(14px);
}
.sheet h2 {
  margin: 0 0 0.85rem;
}
</style>
