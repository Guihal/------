<template>
  <div>
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-xl font-bold">Задачи</h1>
      <button
        class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        @click="showCreate = true"
      >
        + Добавить задачу
      </button>
    </div>

    <LoadingState v-if="taskStore.loading && !taskStore.tasks.length" />
    <ErrorState
      v-else-if="taskStore.error && !taskStore.tasks.length"
      :message="taskStore.error"
      :on-retry="taskStore.fetchTasks"
    />

    <template v-else>
      <div v-if="taskStore.overdue.length" class="mb-6">
        <h2 class="mb-2 text-sm font-bold text-red-600">Просроченные</h2>
        <TaskList
          :tasks="taskStore.overdue"
          @complete="handleComplete"
          @archive="handleArchive"
        />
      </div>

      <div v-if="taskStore.upcoming.length" class="mb-6">
        <h2 class="mb-2 text-sm font-bold text-blue-600">Предстоящие</h2>
        <TaskList
          :tasks="taskStore.upcoming"
          @complete="handleComplete"
          @archive="handleArchive"
        />
      </div>

      <div v-if="taskStore.noDeadline.length" class="mb-6">
        <h2 class="mb-2 text-sm font-bold text-gray-600">Без дедлайна</h2>
        <TaskList
          :tasks="taskStore.noDeadline"
          @complete="handleComplete"
          @archive="handleArchive"
        />
      </div>

      <div v-if="taskStore.completed.length" class="mb-6">
        <h2 class="mb-2 text-sm font-bold text-green-600">Выполненные</h2>
        <TaskList
          :tasks="taskStore.completed"
          @complete="handleComplete"
          @archive="handleArchive"
        />
      </div>

      <EmptyState
        v-if="!taskStore.tasks.length"
        message="Нет задач. Добавь первую!"
      />
    </template>

    <TaskCreateForm
      v-if="showCreate"
      @close="showCreate = false"
      @submit="handleCreate"
    />
  </div>
</template>

<script setup lang="ts">
import type { TaskPriority } from '~/types/api'

definePageMeta({ middleware: 'auth' })

const taskStore = useTaskStore()
const showCreate = ref(false)

async function fetchTasks() {
  await taskStore.fetchTasks()
}

async function handleCreate(payload: {
  title: string
  description?: string
  priority: TaskPriority
  due_at?: string
}) {
  try {
    await taskStore.createTask(payload)
    showCreate.value = false
  } catch {
    // error в store
  }
}

async function handleComplete(id: number) {
  try {
    await taskStore.completeTask(id)
  } catch {
    // error в store
  }
}

async function handleArchive(id: number) {
  try {
    await taskStore.archiveTask(id)
  } catch {
    // error в store
  }
}

onMounted(fetchTasks)
</script>
