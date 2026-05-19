import { defineStore } from "pinia"
import { ref, computed } from "vue"
import type { Task, TaskComplexity, TaskPriority } from "../../core/domain/task/types"
import type { CreateTaskInput } from "../../core/use-cases/tasks/create-task.use-case"
import type { CompleteTaskInput } from "../../core/use-cases/tasks/complete-task.use-case"
import type { ArchiveTaskInput } from "../../core/use-cases/tasks/archive-task.use-case"
import type { AppDependencies } from "../../infrastructure/di/app-dependencies"
import { useAppDependencies } from "../composables/useAppDependencies"

export const useTaskStore = defineStore("task", () => {
  const tasks = ref<readonly Task[]>([])

  function setTasks(newTasks: readonly Task[]) {
    tasks.value = newTasks
  }

  function _deps(): AppDependencies {
    return useAppDependencies()
  }

  async function createTask(input: Omit<CreateTaskInput, "now">): Promise<Task> {
    const now = new Date().toISOString()
    const result = await _deps().useCases.createTask({ ...input, now })
    tasks.value = [...tasks.value, result.task]
    return result.task
  }

  async function completeTask(input: Omit<CompleteTaskInput, "now">): Promise<void> {
    const now = new Date().toISOString()
    const result = await _deps().useCases.completeTask({ ...input, now })
    tasks.value = tasks.value.map((t) =>
      t.id === result.task.id ? result.task : t,
    )
  }

  async function archiveTask(input: Omit<ArchiveTaskInput, "now">): Promise<void> {
    const now = new Date().toISOString()
    const result = await _deps().useCases.archiveTask({ ...input, now })
    tasks.value = tasks.value.map((t) =>
      t.id === result.task.id ? result.task : t,
    )
  }

  function suggestComplexity(params: {
    title: string
    description: string | null
    priority: TaskPriority
    dueAt: string | null
  }): TaskComplexity {
    return _deps().useCases.suggestTaskComplexity(params)
  }

  const groups = computed(() => {
    return _deps().useCases.resolveTaskList(tasks.value)
  })

  return {
    tasks,
    setTasks,
    createTask,
    completeTask,
    archiveTask,
    suggestComplexity,
    groups,
  }
})
