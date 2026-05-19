<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { useTaskStore } from "../stores/useTaskStore"
import { useProfileStore } from "../stores/useProfileStore"
import { useTaskList } from "../composables/useTaskList"
import TaskList from "../components/task/TaskList.vue"
import TaskCreateForm from "../components/task/TaskCreateForm.vue"
import type { TaskPriority } from "../../core/domain/task/types"

const taskStore = useTaskStore()
const profileStore = useProfileStore()
const { overdue, upcoming, noDeadline, completed } = useTaskList()

const showForm = ref(false)
const suggestedComplexity = ref<"tiny" | "small" | "medium" | "large" | null>(null)

const profileName = computed(() => profileStore.profile?.name ?? "User")
const totalXp = computed(() => profileStore.progression?.totalXp ?? 0)

const formDraft = ref({
  title: "",
  description: "",
  priority: "normal" as TaskPriority,
  dueAt: "",
})

watch(() => formDraft.value.title, (newTitle) => {
  if (newTitle.trim().length > 0) {
    suggestedComplexity.value = taskStore.suggestComplexity({
      title: newTitle,
      description: formDraft.value.description || null,
      priority: formDraft.value.priority,
      dueAt: formDraft.value.dueAt || null,
    })
  } else {
    suggestedComplexity.value = null
  }
})

watch(() => formDraft.value.description, (newDesc) => {
  if (formDraft.value.title.trim().length > 0) {
    suggestedComplexity.value = taskStore.suggestComplexity({
      title: formDraft.value.title,
      description: newDesc || null,
      priority: formDraft.value.priority,
      dueAt: formDraft.value.dueAt || null,
    })
  }
})

watch(() => formDraft.value.priority, (newPriority) => {
  if (formDraft.value.title.trim().length > 0) {
    suggestedComplexity.value = taskStore.suggestComplexity({
      title: formDraft.value.title,
      description: formDraft.value.description || null,
      priority: newPriority,
      dueAt: formDraft.value.dueAt || null,
    })
  }
})

watch(() => formDraft.value.dueAt, (newDueAt) => {
  if (formDraft.value.title.trim().length > 0) {
    suggestedComplexity.value = taskStore.suggestComplexity({
      title: formDraft.value.title,
      description: formDraft.value.description || null,
      priority: formDraft.value.priority,
      dueAt: newDueAt || null,
    })
  }
})

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

  await taskStore.createTask({
    id: crypto.randomUUID(),
    profileId,
    title: data.title,
    description: data.description,
    priority: data.priority,
    complexity: data.complexity,
    dueAt: data.dueAt,
  })
  showForm.value = false
  suggestedComplexity.value = null
}

async function handleComplete(taskId: string) {
  const profileId = profileStore.profile?.id
  if (!profileId) return
  await taskStore.completeTask({ taskId, profileId })
}

async function handleArchive(taskId: string) {
  const profileId = profileStore.profile?.id
  if (!profileId) return
  await taskStore.archiveTask({ taskId, profileId })
}
</script>

<template>
  <div class="page">
    <header class="app-header">
      <h1>Task Companion</h1>
      <div class="profile-badge">
        <span class="profile-name">{{ profileName }}</span>
        <span class="profile-xp">{{ totalXp }} XP</span>
      </div>
    </header>

    <main class="content">
      <button
        v-if="!showForm"
        class="btn-add"
        data-testid="btn-add-task"
        @click="showForm = true"
      >
        + Add Task
      </button>

      <TaskCreateForm
        v-if="showForm"
        :suggested-complexity="suggestedComplexity"
        @submit="handleCreate"
        @cancel="showForm = false"
      />

      <TaskList
        title="Overdue"
        :tasks="overdue"
        empty-text="No overdue tasks"
        @complete="handleComplete"
        @archive="handleArchive"
      />

      <TaskList
        title="Upcoming"
        :tasks="upcoming"
        empty-text="No upcoming tasks"
        @complete="handleComplete"
        @archive="handleArchive"
      />

      <TaskList
        title="No Deadline"
        :tasks="noDeadline"
        empty-text="No tasks without deadline"
        @complete="handleComplete"
        @archive="handleArchive"
      />

      <TaskList
        title="Completed"
        :tasks="completed"
        empty-text="No completed tasks"
        @complete="handleComplete"
        @archive="handleArchive"
      />
    </main>
  </div>
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  background: #11111b;
  color: #cdd6f4;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
}
</style>

<style scoped>
.page {
  max-width: 640px;
  margin: 0 auto;
  padding: 16px;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.app-header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.profile-badge {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.profile-name {
  font-size: 14px;
  font-weight: 600;
  color: #cdd6f4;
}

.profile-xp {
  font-size: 12px;
  color: #a6adc8;
}

.btn-add {
  width: 100%;
  min-height: 44px;
  padding: 12px;
  border: 2px dashed #45475a;
  border-radius: 12px;
  background: transparent;
  color: #a6adc8;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 24px;
}

.btn-add:active {
  border-color: #89b4fa;
  color: #89b4fa;
}
</style>
