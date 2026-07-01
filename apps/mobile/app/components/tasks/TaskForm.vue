<script setup lang="ts">
import type { Task, TaskCategory, TaskComplexity, TaskCreateRequest, TaskPriority } from "~~/api";

const props = defineProps<{
  task: Task | null;
  categories: TaskCategory[];
  saving: boolean;
  error: string | null;
  submitText: string;
}>();

const emit = defineEmits<{
  submit: [body: TaskCreateRequest];
  cancel: [];
}>();

const form = reactive({ title: "", description: "", category_id: "", priority: "normal" as TaskPriority, complexity: "medium" as TaskComplexity, deadline_at: "", reminder_at: "" });
const titleError = ref<string | null>(null);

watch(
  () => [props.task, props.categories] as const,
  () => resetForm(),
  { immediate: true },
);

function resetForm() {
  const common = props.categories.find((c) => c.title.toLowerCase() === "общее");
  form.title = props.task?.title ?? "";
  form.description = props.task?.description ?? "";
  form.category_id = props.task?.category_id ?? common?.id ?? "";
  form.priority = props.task?.priority ?? "normal";
  form.complexity = props.task?.complexity ?? "medium";
  form.deadline_at = toLocalInput(props.task?.deadline_at);
  form.reminder_at = "";
  titleError.value = null;
}

function submit() {
  titleError.value = form.title.trim() ? null : "Введите название задачи.";
  if (titleError.value) return;
  emit("submit", {
    title: form.title.trim(),
    description: form.description.trim(),
    category_id: form.category_id || null,
    priority: form.priority,
    complexity: form.complexity,
    deadline_at: form.deadline_at ? new Date(form.deadline_at).toISOString() : null,
  });
}

function toLocalInput(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
</script>

<template>
  <form class="task-form" novalidate @submit.prevent="submit">
    <FormField id="task-title" v-model="form.title" label="Название" :error="titleError" />
    <label class="field" for="task-description">
      <span>Описание</span>
      <textarea id="task-description" v-model="form.description" rows="3" />
    </label>
    <div class="grid">
      <label class="field" for="task-category">
        <span>Категория</span>
        <select id="task-category" v-model="form.category_id">
          <option value="">общее</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.title }}
          </option>
        </select>
      </label>
      <label class="field" for="task-deadline">
        <span>Дедлайн</span>
        <input id="task-deadline" v-model="form.deadline_at" type="datetime-local" />
      </label>
      <label class="field" for="task-priority">
        <span>Приоритет</span>
        <select id="task-priority" v-model="form.priority">
          <option value="low">низкий</option>
          <option value="normal">обычный</option>
          <option value="high">высокий</option>
        </select>
      </label>
      <label class="field" for="task-complexity">
        <span>Сложность</span>
        <select id="task-complexity" v-model="form.complexity">
          <option value="tiny">очень малая</option>
          <option value="small">малая</option>
          <option value="medium">средняя</option>
          <option value="large">большая</option>
        </select>
      </label>
    </div>
    <label class="field" for="task-reminder">
      <span>Напоминание</span>
      <input id="task-reminder" v-model="form.reminder_at" type="datetime-local" />
      <small>Будет подключено после серверной модели напоминаний.</small>
    </label>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <div class="actions">
      <button type="button" class="secondary tap" @click="emit('cancel')">
        Отмена
      </button>
      <AppButton type="submit" :loading="saving">{{ submitText }}</AppButton>
    </div>
  </form>
</template>

<style scoped lang="scss">
.task-form, .field { display: grid; gap: 0.7rem; }
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
}
.field { gap: 0.3rem; color: var(--muted); font-size: 0.85rem; }
input, select, textarea { width: 100%; border: 1px solid var(--stroke); border-radius: var(--radius-md); background: var(--surface); color: var(--text); padding: 0.75rem; }
textarea {
  resize: vertical;
}
small, .error { color: var(--muted); }
.error {
  margin: 0;
  color: var(--danger);
}
.actions {
  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  gap: 0.65rem;
}
.secondary { min-height: 44px; border: 1px solid var(--stroke); border-radius: var(--radius-md); background: var(--surface-2); color: var(--text); font-weight: 800; }
</style>
