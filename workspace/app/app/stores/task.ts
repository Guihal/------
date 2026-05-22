import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Task,
  TaskCategory,
  TaskCompleteResponse,
  TaskDifficulty,
  TaskSize,
  TasksResponse,
} from '~/types/api'

type TaskCreatePayload = {
  title: string
  description?: string
  difficulty?: TaskDifficulty
  category?: TaskCategory
  size?: TaskSize
  deadline?: string
}

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    typeof (error as { data?: unknown }).data === 'object' &&
    (error as { data?: { detail?: unknown } }).data !== null &&
    typeof (error as { data?: { detail?: unknown } }).data?.detail === 'string'
  ) {
    return (error as { data: { detail: string } }).data.detail
  }
  return fallback
}

export const useTaskStore = defineStore('app-tasks', () => {
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const error = ref('')

  const api = useApi()

  async function fetchTasks() {
    loading.value = true
    error.value = ''
    try {
      const data = await api.fetch<TasksResponse>('/tasks')
      tasks.value = data.tasks
    } catch (e: unknown) {
      error.value = getErrorMessage(e, 'Ошибка загрузки задач')
    } finally {
      loading.value = false
    }
  }

  async function createTask(payload: TaskCreatePayload) {
    error.value = ''
    try {
      const data = await api.fetch<{ task: Task }>('/tasks', {
        method: 'POST',
        body: payload,
      })
      tasks.value.unshift(data.task)
      return data.task
    } catch (e: unknown) {
      error.value = getErrorMessage(e, 'Ошибка создания задачи')
      throw e
    }
  }

  async function completeTask(id: number) {
    error.value = ''
    try {
      const data = await api.fetch<TaskCompleteResponse>(`/tasks/${id}/complete`, {
        method: 'PATCH',
      })
      const idx = tasks.value.findIndex((t) => t.id === id)
      if (idx !== -1) tasks.value[idx] = data.task
      return data
    } catch (e: unknown) {
      error.value = getErrorMessage(e, 'Ошибка выполнения задачи')
      throw e
    }
  }

  async function archiveTask(id: number) {
    error.value = ''
    try {
      const data = await api.fetch<{ task: Task }>(`/tasks/${id}/archive`, {
        method: 'PATCH',
      })
      const idx = tasks.value.findIndex((t) => t.id === id)
      if (idx !== -1) tasks.value[idx] = data.task
      return data.task
    } catch (e: unknown) {
      error.value = getErrorMessage(e, 'Ошибка архивирования задачи')
      throw e
    }
  }

  const active = computed(() => tasks.value.filter((t) => !t.completed && !t.archived))
  const overdue = computed(() =>
    tasks.value.filter((t) => !t.completed && !t.archived && t.deadline !== null && new Date(t.deadline) < new Date()),
  )
  const upcoming = computed(() =>
    tasks.value.filter((t) => !t.completed && !t.archived && t.deadline !== null && new Date(t.deadline) >= new Date()),
  )
  const noDeadline = computed(() => tasks.value.filter((t) => !t.completed && !t.archived && t.deadline === null))
  const completed = computed(() => tasks.value.filter((t) => t.completed && !t.archived))
  const archived = computed(() => tasks.value.filter((t) => t.archived))

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    completeTask,
    archiveTask,
    active,
    overdue,
    upcoming,
    noDeadline,
    completed,
    archived,
  }
})
