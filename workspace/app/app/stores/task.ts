import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Task, TaskPriority, TasksResponse, TaskResponse } from '~/types/api'

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
    } catch (e: any) {
      error.value = e?.data?.detail || 'Ошибка загрузки задач'
    } finally {
      loading.value = false
    }
  }

  async function createTask(payload: {
    title: string
    description?: string
    priority?: TaskPriority
    due_at?: string
  }) {
    error.value = ''
    try {
      const data = await api.fetch<TaskResponse>('/tasks', {
        method: 'POST',
        body: payload,
      })
      tasks.value.unshift(data.task)
      return data.task
    } catch (e: any) {
      error.value = e?.data?.detail || 'Ошибка создания задачи'
      throw e
    }
  }

  async function completeTask(id: number) {
    error.value = ''
    try {
      const data = await api.fetch<TaskResponse>(`/tasks/${id}/complete`, {
        method: 'PATCH',
      })
      const idx = tasks.value.findIndex((t) => t.id === id)
      if (idx !== -1) tasks.value[idx] = data.task
      return data.task
    } catch (e: any) {
      error.value = e?.data?.detail || 'Ошибка выполнения задачи'
      throw e
    }
  }

  async function archiveTask(id: number) {
    error.value = ''
    try {
      const data = await api.fetch<TaskResponse>(`/tasks/${id}/archive`, {
        method: 'PATCH',
      })
      const idx = tasks.value.findIndex((t) => t.id === id)
      if (idx !== -1) tasks.value[idx] = data.task
      return data.task
    } catch (e: any) {
      error.value = e?.data?.detail || 'Ошибка архивирования задачи'
      throw e
    }
  }

  const overdue = computed(() =>
    tasks.value.filter((t) => t.status === 'pending' && t.due_at && new Date(t.due_at) < new Date())
  )
  const upcoming = computed(() =>
    tasks.value.filter((t) => t.status === 'pending' && t.due_at && new Date(t.due_at) >= new Date())
  )
  const noDeadline = computed(() =>
    tasks.value.filter((t) => t.status === 'pending' && !t.due_at)
  )
  const completed = computed(() =>
    tasks.value.filter((t) => t.status === 'completed')
  )
  const archived = computed(() =>
    tasks.value.filter((t) => t.status === 'archived')
  )

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    completeTask,
    archiveTask,
    overdue,
    upcoming,
    noDeadline,
    completed,
    archived,
  }
})
