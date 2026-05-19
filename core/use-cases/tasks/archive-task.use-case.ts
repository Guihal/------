import { canTransitionTo } from "../../domain/task/invariants"
import type { Task } from "../../domain/task/types"
import type { TaskRepositoryPort } from "../../ports/task-repository.port"

export type ArchiveTaskInput = {
  readonly taskId: string
  readonly profileId: string
  readonly now: string
}

export type ArchiveTaskResult = {
  readonly task: Task
}

export async function archiveTask(
  repo: TaskRepositoryPort,
  input: ArchiveTaskInput,
): Promise<ArchiveTaskResult> {
  const task = await repo.findById(input.profileId, input.taskId)
  if (task === null) {
    throw new Error(`task not found: ${input.taskId}`)
  }

  if (task.profileId !== input.profileId) {
    throw new Error("task does not belong to profile")
  }

  const transition = canTransitionTo(task, "archived")
  if (!transition.ok) {
    throw new Error(`invalid transition: ${transition.error.kind}`)
  }

  const archivedTask: Task = {
    ...task,
    status: "archived",
    updatedAt: input.now,
    archivedAt: input.now,
  }

  await repo.save(archivedTask)

  return { task: archivedTask }
}
