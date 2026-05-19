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

const taskStore = useTaskStore()
const profileStore = useProfileStore()
const { generateId } = useIdGenerator()
const { overdue, upcoming, noDeadline, completed } = useTaskList()

const showForm = ref(false)
const suggestedComplexity = ref<"tiny" | "small" | "medium" | "large" | null>(null)
const isLoading = ref(false)

const profileName = computed(() => profileStore.profile?.name ?? "User")
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
  isLoading.value = true
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
    isLoading.value = false
  }
}

async function handleComplete(taskId: string) {
  const profileId = profileStore.profile?.id
  if (!profileId) return
  isLoading.value = true
  try {
    await taskStore.completeTask({ taskId, profileId })
  } finally {
    isLoading.value = false
  }
}

async function handleArchive(taskId: string) {
  const profileId = profileStore.profile?.id
  if (!profileId) return
  isLoading.value = true
  try {
    await taskStore.archiveTask({ taskId, profileId })
  } finally {
    isLoading.value = false
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
        :disabled="isLoading"
        @click="showForm = true"
      >
        + Add Task
      </button>

      <TaskCreateForm
        v-if="showForm"
        :suggested-complexity="suggestedComplexity"
        :is-loading="isLoading"
        @submit="handleCreate"
        @cancel="showForm = false"
      />

      <TaskList title="Overdue" :tasks="overdue" empty-text="No overdue tasks" @complete="handleComplete" @archive="handleArchive" />
      <TaskList title="Upcoming" :tasks="upcoming" empty-text="No upcoming tasks" @complete="handleComplete" @archive="handleArchive" />
      <TaskList title="No Deadline" :tasks="noDeadline" empty-text="No tasks without deadline" @complete="handleComplete" @archive="handleArchive" />
      <TaskList title="Completed" :tasks="completed" empty-text="No completed tasks" @complete="handleComplete" @archive="handleArchive" />
    </main>
  </div>
</template>

<style>
html, body { margin: 0; padding: 0; background: #11111b; color: #cdd6f4; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
</style>

<style scoped>
.page { max-width: 640px; margin: 0 auto; padding: 16px; }
.btn-add { width: 100%; min-height: 44px; padding: 12px; border: 2px dashed #45475a; border-radius: 12px; background: transparent; color: #a6adc8; font-size: 14px; font-weight: 600; cursor: pointer; margin-bottom: 24px; }
.btn-add:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-add:active { border-color: #89b4fa; color: #89b4fa; }
</style>
