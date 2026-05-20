import type { TaskRepositoryPort } from "../../core/ports/task-repository.port"
import type { ProfileRepositoryPort } from "../../core/ports/profile-repository.port"
import type { ProgressionRepositoryPort } from "../../core/ports/progression-repository.port"
import type { UnitOfWorkPort } from "../../core/ports/unit-of-work.port"
import type { CreateTaskResult, CreateTaskInput } from "../../core/use-cases/tasks/create-task.use-case"
import type { CompleteTaskResult, CompleteTaskInput } from "../../core/use-cases/tasks/complete-task.use-case"
import type { ArchiveTaskResult, ArchiveTaskInput } from "../../core/use-cases/tasks/archive-task.use-case"
import type { GrantTaskXpResult, GrantTaskXpInput } from "../../core/use-cases/tasks/grant-task-xp.use-case"
import type { LevelProgressResult } from "../../core/use-cases/apply-level-progress.use-case"
import type { TaskListGroups } from "../../core/use-cases/resolve-task-list.use-case"
import type { SuggestTaskComplexityInput } from "../../core/use-cases/suggest-task-complexity.use-case"
import type { TaskComplexity } from "../../core/domain/task/types"
import type { Task } from "../../core/domain/task/types"
import type { Progression } from "../../core/domain/progression/types"

export type AppDependencies = {
  readonly ports: {
    readonly taskRepository: TaskRepositoryPort
    readonly profileRepository: ProfileRepositoryPort
    readonly progressionRepository: ProgressionRepositoryPort
    readonly unitOfWork: UnitOfWorkPort
  }
  readonly useCases: {
    readonly createTask: (input: CreateTaskInput) => Promise<CreateTaskResult>
    readonly completeTask: (input: CompleteTaskInput) => Promise<CompleteTaskResult>
    readonly archiveTask: (input: ArchiveTaskInput) => Promise<ArchiveTaskResult>
    readonly grantTaskXp: (input: GrantTaskXpInput) => Promise<GrantTaskXpResult>
    readonly applyLevelProgress: (current: Progression, xpDelta: number, now: string) => LevelProgressResult
    readonly resolveTaskList: (tasks: readonly Task[], now: Date) => TaskListGroups
    readonly suggestTaskComplexity: (input: SuggestTaskComplexityInput) => TaskComplexity
  }
}
