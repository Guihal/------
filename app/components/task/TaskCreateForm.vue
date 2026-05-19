<script setup lang="ts">
import { ref, watch } from "vue"
import { useTaskValidation } from "../../composables/useTaskValidation"
import type { TaskPriority } from "../../../core/domain/task/types"

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
    <h2 class="form-title">New Task</h2>
    <div class="field">
      <label for="task-title">Title *</label>
      <input id="task-title" v-model="title" type="text" placeholder="What needs to be done?" data-testid="input-title" maxlength="100" :disabled="isLoading" />
      <span v-if="error" class="error">{{ error }}</span>
    </div>
    <div class="field">
      <label for="task-desc">Description</label>
      <textarea id="task-desc" v-model="description" rows="3" placeholder="Optional details..." data-testid="input-description" maxlength="2000" :disabled="isLoading" />
    </div>
    <div class="field-row">
      <div class="field">
        <label for="task-priority">Priority</label>
        <select id="task-priority" v-model="priority" data-testid="input-priority" :disabled="isLoading">
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
        </select>
      </div>
      <div class="field">
        <label for="task-due">Due date</label>
        <input id="task-due" v-model="dueAt" type="date" data-testid="input-due" :disabled="isLoading" />
      </div>
    </div>
    <div class="field">
      <label for="task-complexity">Complexity</label>
      <select id="task-complexity" v-model="complexity" data-testid="input-complexity" :disabled="isLoading">
        <option value="tiny">Tiny</option>
        <option value="small">Small</option>
        <option value="medium">Medium</option>
        <option value="large">Large</option>
      </select>
      <span v-if="complexitySource === 'suggested'" class="badge-suggested">Suggested</span>
    </div>
    <div class="form-actions">
      <button type="submit" class="btn-primary" data-testid="btn-submit" :disabled="isLoading">Create</button>
      <button type="button" class="btn-secondary" data-testid="btn-cancel" :disabled="isLoading" @click="emit('cancel')">Cancel</button>
    </div>
  </form>
</template>

<style scoped>
.create-form { background: #1e1e2e; border: 1px solid #313244; border-radius: 12px; padding: 16px; margin-bottom: 24px; color: #cdd6f4; }
.form-title { margin: 0 0 16px 0; font-size: 16px; font-weight: 600; }
.field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.field-row { display: flex; gap: 12px; }
.field-row .field { flex: 1; }
label { font-size: 13px; font-weight: 500; color: #a6adc8; }
input, textarea, select { background: #181825; border: 1px solid #313244; border-radius: 8px; padding: 10px 12px; color: #cdd6f4; font-size: 14px; min-height: 44px; }
input:focus, textarea:focus, select:focus { outline: none; border-color: #89b4fa; }
input:disabled, textarea:disabled, select:disabled { opacity: 0.5; cursor: not-allowed; }
.error { font-size: 12px; color: #f38ba8; }
.badge-suggested { font-size: 11px; color: #a6e3a1; margin-top: 2px; }
.form-actions { display: flex; gap: 8px; margin-top: 8px; }
.btn-primary, .btn-secondary { min-height: 44px; min-width: 44px; padding: 8px 16px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; flex: 1; }
.btn-primary { background: #89b4fa; color: #1e1e2e; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary { background: #45475a; color: #cdd6f4; }
.btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
