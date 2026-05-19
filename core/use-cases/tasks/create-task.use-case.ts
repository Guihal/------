import type { Task, TaskComplexity, TaskPriority, TaskStatus } from "../../domain/task/types"
import type { TaskRepositoryPort } from "../../ports/task-repository.port"

export type CreateTaskInput = {
  readonly id: string
  readonly profileId: string
  readonly title: string
  readonly description: string | null
  readonly priority: TaskPriority
  readonly complexity: TaskComplexity
  readonly dueAt: string | null
  readonly now: string
}

export type CreateTaskResult = {
  readonly task: Task
}

export async function createTask(
  repo: TaskRepositoryPort,
  input: CreateTaskInput,
): Promise<CreateTaskResult> {
  if (input.title.trim().length === 0) {
    throw new Error("title must not be empty")
  }

  const task: Task = {
    id: input.id,
    profileId: input.profileId,
    title: input.title.trim(),
    description: input.description,
    status: "active" as TaskStatus,
    priority: input.priority,
    complexity: input.complexity,
    complexitySource: "manual",
    dueAt: input.dueAt,
    createdAt: input.now,
    updatedAt: input.now,
    completedAt: null,
    archivedAt: null,
  }

  await repo.save(task)

  return { task }
}
