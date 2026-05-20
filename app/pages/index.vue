<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { useTaskStore } from "../stores/useTaskStore"
import { useProfileStore } from "../stores/useProfileStore"
import { useTaskList } from "../composables/useTaskList"
import { useIdGenerator } from "../composables/useIdGenerator"
import AppHeader from "../components/ui/AppHeader.vue"
import TaskList from "../components/task/TaskList.vue"
import TaskCreateForm from "../components/task/TaskCreateForm.vue"
import type { TaskPriority } from "../../core/domain/task/types"

import { DARK_TOKENS as t } from "../../assets/tokens/dark"

const taskStore = useTaskStore()
const profileStore = useProfileStore()
const { generateId } = useIdGenerator()
const { overdue, upcoming, noDeadline, completed } = useTaskList()

const showForm = ref(false)
const suggestedComplexity = ref<"tiny" | "small" | "medium" | "large" | null>(null)
const isCreating = ref(false)
const loadingTaskIds = ref<Set<string>>(new Set())

function isTaskLoading(taskId: string): boolean {
  return loadingTaskIds.value.has(taskId)
}

const profileName = computed(() => profileStore.profile?.name ?? "Пользователь")
const totalXp = computed(() => profileStore.progression?.totalXp ?? 0)

const formDraft = ref({
  title: "",
  description: "",
  priority: "normal" as TaskPriority,
  dueAt: "",
})

function updateSuggestion() {
  const d = formDraft.value
  if (d.title.trim().length > 0) {
    suggestedComplexity.value = taskStore.suggestComplexity({
      title: d.title,
      description: d.description || null,
      priority: d.priority,
      dueAt: d.dueAt || null,
    })
  } else {
    suggestedComplexity.value = null
  }
}

watch(() => formDraft.value.title, updateSuggestion)
watch(() => formDraft.value.description, updateSuggestion)
watch(() => formDraft.value.priority, updateSuggestion)
watch(() => formDraft.value.dueAt, updateSuggestion)

async function handleCreate(data: {
  title: string
  description: string | null
  priority: TaskPriority
  dueAt: string | null
  complexity: "tiny" | "small" | "medium" | "large"
  complexitySource: "suggested" | "manual"
}) {
  const profileId = profileStore.profile?.id
  if (!profileId) return
  isCreating.value = true
  try {
    await taskStore.createTask({
      id: generateId(),
      profileId,
      title: data.title,
      description: data.description,
      priority: data.priority,
      complexity: data.complexity,
      dueAt: data.dueAt,
    })
    showForm.value = false
    suggestedComplexity.value = null
  } finally {
    isCreating.value = false
  }
}

async function handleComplete(taskId: string) {
  const profileId = profileStore.profile?.id
  if (!profileId) return
  loadingTaskIds.value.add(taskId)
  try {
    await taskStore.completeTask({ taskId, profileId })
  } finally {
    loadingTaskIds.value.delete(taskId)
  }
}

async function handleArchive(taskId: string) {
  const profileId = profileStore.profile?.id
  if (!profileId) return
  loadingTaskIds.value.add(taskId)
  try {
    await taskStore.archiveTask({ taskId, profileId })
  } finally {
    loadingTaskIds.value.delete(taskId)
  }
}
</script>

<template>
  <div class="page">
    <AppHeader :profile-name="profileName" :total-xp="totalXp" />

    <main class="content">
      <button
        v-if="!showForm"
        class="btn-add"
        data-testid="btn-add-task"
        :disabled="isCreating"
        @click="showForm = true"
      >
        + Добавить задачу
      </button>

      <TaskCreateForm
        v-if="showForm"
        :suggested-complexity="suggestedComplexity"
        :is-loading="isCreating"
        @submit="handleCreate"
        @cancel="showForm = false"
      />

      <TaskList title="Просроченные" :tasks="overdue" :loading-task-id="isTaskLoading" empty-text="Нет просроченных задач" @complete="handleComplete" @archive="handleArchive" />
      <TaskList title="Предстоящие" :tasks="upcoming" :loading-task-id="isTaskLoading" empty-text="Нет предстоящих задач" @complete="handleComplete" @archive="handleArchive" />
      <TaskList title="Без дедлайна" :tasks="noDeadline" :loading-task-id="isTaskLoading" empty-text="Нет задач без дедлайна" @complete="handleComplete" @archive="handleArchive" />
      <TaskList title="Выполненные" :tasks="completed" :loading-task-id="isTaskLoading" empty-text="Нет выполненных задач" @complete="handleComplete" @archive="handleArchive" />
    </main>
  </div>
</template>

<style scoped>
.page { max-width: 640px; margin: 0 auto; padding: v-bind("t.spacing.lg"); padding-left: max(v-bind("t.spacing.lg"), env(safe-area-inset-left)); padding-right: max(v-bind("t.spacing.lg"), env(safe-area-inset-right)); padding-top: max(v-bind("t.spacing.lg"), env(safe-area-inset-top)); padding-bottom: max(v-bind("t.spacing.lg"), env(safe-area-inset-bottom)); background: v-bind("t.color.bgBase"); min-height: 100dvh; }
@media (max-width: 360px) {
  .page { padding: v-bind("t.spacing.md"); padding-left: max(v-bind("t.spacing.md"), env(safe-area-inset-left)); padding-right: max(v-bind("t.spacing.md"), env(safe-area-inset-right)); }
}
.btn-add { width: 100%; min-height: 44px; padding: v-bind("t.spacing.md"); border: 2px dashed v-bind("t.color.borderDashed"); border-radius: v-bind("t.radius.lg"); background: transparent; color: v-bind("t.color.textSecondary"); font-size: v-bind("t.typography.size.md"); font-weight: v-bind("t.typography.weight.semibold"); cursor: pointer; margin-bottom: v-bind("t.spacing.xxl"); }
.btn-add:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-add:focus-visible { outline: 2px solid v-bind("t.color.accentBlue"); outline-offset: 2px; }
.btn-add:active { border-color: v-bind("t.color.accentBlue"); color: v-bind("t.color.accentBlue"); }
</style>
