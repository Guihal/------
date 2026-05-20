<script setup lang="ts">
import { ref, watch } from "vue"
import { useTaskValidation } from "../../composables/useTaskValidation"
import type { TaskPriority } from "../../../core/domain/task/types"
import { DARK_TOKENS as t } from "../../../assets/tokens/dark"

const emit = defineEmits<{
  submit: [data: {
    title: string
    description: string | null
    priority: TaskPriority
    dueAt: string | null
    complexity: "tiny" | "small" | "medium" | "large"
    complexitySource: "suggested" | "manual"
  }]
  cancel: []
}>()

const props = defineProps<{
  suggestedComplexity?: "tiny" | "small" | "medium" | "large" | null
  isLoading?: boolean
}>()

const title = ref("")
const description = ref("")
const priority = ref<TaskPriority>("normal")
const dueAt = ref("")
const complexity = ref<"tiny" | "small" | "medium" | "large">("small")
const complexitySource = ref<"suggested" | "manual">("manual")
const error = ref("")

const { validateTitle, validateDescription } = useTaskValidation()

watch(() => props.suggestedComplexity, (val) => {
  if (val) {
    complexity.value = val
    complexitySource.value = "suggested"
  }
})

function handleSubmit() {
  error.value = ""
  const titleRes = validateTitle(title.value)
  if (!titleRes.ok) { error.value = titleRes.error; return }
  const descRes = validateDescription(description.value || null)
  if (!descRes.ok) { error.value = descRes.error; return }

  emit("submit", {
    title: title.value.trim(),
    description: description.value.trim() || null,
    priority: priority.value,
    dueAt: dueAt.value || null,
    complexity: complexity.value,
    complexitySource: complexitySource.value,
  })
  title.value = ""
  description.value = ""
  priority.value = "normal"
  dueAt.value = ""
  complexity.value = "small"
  complexitySource.value = "manual"
}
</script>

<template>
  <form class="create-form" data-testid="create-task-form" @submit.prevent="handleSubmit">
    <h2 class="form-title">Новая задача</h2>
    <div class="field">
      <label for="task-title">Название *</label>
      <input id="task-title" v-model="title" type="text" placeholder="Что нужно сделать?" data-testid="input-title" maxlength="100" :disabled="isLoading" />
      <span v-if="error" class="error" role="alert" aria-live="assertive">{{ error }}</span>
    </div>
    <div class="field">
      <label for="task-desc">Описание</label>
      <textarea id="task-desc" v-model="description" rows="3" placeholder="Дополнительные детали…" data-testid="input-description" maxlength="2000" :disabled="isLoading" />
    </div>
    <div class="field-row">
      <div class="field">
        <label for="task-priority">Приоритет</label>
        <select id="task-priority" v-model="priority" data-testid="input-priority" :disabled="isLoading">
          <option value="low">Низкий</option>
          <option value="normal">Обычный</option>
          <option value="high">Высокий</option>
        </select>
      </div>
      <div class="field">
        <label for="task-due">Дедлайн</label>
        <input id="task-due" v-model="dueAt" type="date" data-testid="input-due" :disabled="isLoading" />
      </div>
    </div>
    <div class="field">
      <label for="task-complexity">Сложность</label>
      <select id="task-complexity" v-model="complexity" data-testid="input-complexity" :disabled="isLoading">
        <option value="tiny">Крошечная</option>
        <option value="small">Маленькая</option>
        <option value="medium">Средняя</option>
        <option value="large">Большая</option>
      </select>
      <span v-if="complexitySource === 'suggested'" class="badge-suggested">Подобрано автоматически</span>
    </div>
    <div class="form-actions">
      <button type="submit" class="btn-primary" data-testid="btn-submit" :disabled="isLoading">Создать</button>
      <button type="button" class="btn-secondary" data-testid="btn-cancel" :disabled="isLoading" @click="emit('cancel')">Отмена</button>
    </div>
  </form>
</template>

<style scoped>
.create-form { background: v-bind("t.color.bgCard"); border: 1px solid v-bind("t.color.borderSubtle"); border-radius: v-bind("t.radius.lg"); padding: v-bind("t.spacing.lg"); margin-bottom: v-bind("t.spacing.xxl"); color: v-bind("t.color.textPrimary"); }
.form-title { margin: 0 0 v-bind("t.spacing.lg") 0; font-size: v-bind("t.typography.size.xxl"); font-weight: v-bind("t.typography.weight.bold"); color: v-bind("t.color.textPrimary"); letter-spacing: -0.02em; line-height: 1.2; text-wrap: balance; }
.field { display: flex; flex-direction: column; gap: v-bind("t.spacing.xs"); margin-bottom: v-bind("t.spacing.lg"); }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: v-bind("t.spacing.md"); align-items: start; }
@media (max-width: 480px) {
  .field-row { grid-template-columns: 1fr; gap: v-bind("t.spacing.sm"); }
  .form-actions { flex-direction: column; }
  .btn-primary, .btn-secondary { width: 100%; }
}
label { font-size: v-bind("t.typography.size.sm"); font-weight: v-bind("t.typography.weight.medium"); color: v-bind("t.color.textSecondary"); }
input, textarea, select { width: 100%; background: v-bind("t.color.bgOverlay"); border: 1px solid v-bind("t.color.borderSubtle"); border-radius: v-bind("t.radius.md"); padding: v-bind("t.spacing.sm") v-bind("t.spacing.md"); color: v-bind("t.color.textPrimary"); font-size: v-bind("t.typography.size.md"); min-height: 44px; touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
input:focus, textarea:focus, select:focus { outline: 2px solid v-bind("t.color.accentBlue"); outline-offset: 2px; border-color: v-bind("t.color.accentBlue"); }
input:disabled, textarea:disabled, select:disabled { opacity: 0.5; cursor: not-allowed; }
.error { font-size: v-bind("t.typography.size.xs"); color: v-bind("t.color.statusError"); }
.badge-suggested { font-size: v-bind("t.typography.size.xs"); color: v-bind("t.color.statusSuccess"); margin-top: v-bind("t.spacing.xs"); }
.form-actions { display: flex; gap: v-bind("t.spacing.sm"); margin-top: v-bind("t.spacing.lg"); }
.btn-primary, .btn-secondary { min-height: 44px; min-width: 44px; padding: v-bind("t.spacing.sm") v-bind("t.spacing.lg"); border-radius: v-bind("t.radius.md"); font-size: v-bind("t.typography.size.md"); font-weight: v-bind("t.typography.weight.semibold"); letter-spacing: 0.01em; cursor: pointer; flex: 1; touch-action: manipulation; -webkit-tap-highlight-color: transparent; will-change: transform; transition: all 0.15s ease; }
.btn-primary:active, .btn-secondary:active { transform: scale(0.98); }
@media (prefers-reduced-motion: reduce) {
  .btn-primary:active, .btn-secondary:active { transform: none; }
}
.btn-primary:focus-visible, .btn-secondary:focus-visible { outline: 2px solid v-bind("t.color.accentBlue"); outline-offset: 2px; }
.btn-primary { background: v-bind("t.color.accentBlue"); color: v-bind("t.color.textInverse"); border: none; }
.btn-primary:hover:not(:disabled) { filter: brightness(1.1); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary { background: transparent; color: v-bind("t.color.textSecondary"); border: 1px solid v-bind("t.color.borderSubtle"); }
.btn-secondary:hover:not(:disabled) { background: v-bind("t.color.bgOverlay"); color: v-bind("t.color.textPrimary"); }
.btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
