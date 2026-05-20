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

  function _deps(): AppDependencies | undefined {
    return useAppDependencies()
  }

  async function createTask(input: CreateTaskInput): Promise<Task> {
    const deps = _deps()
    if (!deps) throw new Error("AppDependencies not ready")
    const result = await deps.useCases.createTask(input)
    tasks.value = [...tasks.value, result.task]
    return result.task
  }

  async function completeTask(input: CompleteTaskInput): Promise<void> {
    const deps = _deps()
    if (!deps) throw new Error("AppDependencies not ready")
    const result = await deps.useCases.completeTask(input)
    tasks.value = tasks.value.map((t) =>
      t.id === result.task.id ? result.task : t,
    )
  }

  async function archiveTask(input: ArchiveTaskInput): Promise<void> {
    const deps = _deps()
    if (!deps) throw new Error("AppDependencies not ready")
    const result = await deps.useCases.archiveTask(input)
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
    const deps = _deps()
    if (!deps) throw new Error("AppDependencies not ready")
    return deps.useCases.suggestTaskComplexity(params)
  }

  const groups = computed(() => {
    const deps = _deps()
    if (!deps) return { overdue: [], upcoming: [], noDeadline: [], completed: [] }
    return deps.useCases.resolveTaskList(tasks.value)
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
