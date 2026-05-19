import { defineStore } from "pinia"
import { ref, computed } from "vue"
import type { Task, TaskStatus } from "../../core/domain/task/types"

export const useTaskStore = defineStore("task", () => {
  const tasks = ref<readonly Task[]>([])

  const activeTasks = computed(() =>
    tasks.value.filter((t) => t.status === "active"),
  )

  const completedTasks = computed(() =>
    tasks.value.filter((t) => t.status === "completed"),
  )

  const archivedTasks = computed(() =>
    tasks.value.filter((t) => t.status === "archived"),
  )

  function setTasks(newTasks: readonly Task[]) {
    tasks.value = newTasks
  }

  function addTask(task: Task) {
    tasks.value = [...tasks.value, task]
  }

  function updateTask(updated: Task) {
    tasks.value = tasks.value.map((t) =>
      t.id === updated.id ? updated : t,
    )
  }

  function removeTask(id: string) {
    tasks.value = tasks.value.filter((t) => t.id !== id)
  }

  function getById(id: string): Task | undefined {
    return tasks.value.find((t) => t.id === id)
  }

  return {
    tasks,
    activeTasks,
    completedTasks,
    archivedTasks,
    setTasks,
    addTask,
    updateTask,
    removeTask,
    getById,
  }
})
