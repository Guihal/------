import type { UnitOfWorkPort } from "../../../core/ports/unit-of-work.port"
import type { TaskRepositoryPort } from "../../../core/ports/task-repository.port"
import type { ProfileRepositoryPort } from "../../../core/ports/profile-repository.port"
import type { ProgressionRepositoryPort } from "../../../core/ports/progression-repository.port"
import { MemoryTaskRepository } from "../repositories/task.repository"
import { MemoryProfileRepository } from "../repositories/profile.repository"
import { MemoryProgressionRepository } from "../repositories/progression.repository"

export class MemoryUnitOfWork implements UnitOfWorkPort {
  readonly tasks: TaskRepositoryPort
  readonly profiles: ProfileRepositoryPort
  readonly progressions: ProgressionRepositoryPort

  private inTransaction = false

  constructor() {
    this.tasks = new MemoryTaskRepository()
    this.profiles = new MemoryProfileRepository()
    this.progressions = new MemoryProgressionRepository()
  }

  async run<T>(callback: () => Promise<T>): Promise<T> {
    if (this.inTransaction) {
      throw new Error("Nested transactions are not supported")
    }

    const snapshot = this.snapshot()
    this.inTransaction = true

    try {
      const result = await callback()
      return result
    } catch (err) {
      this.restore(snapshot)
      throw err
    } finally {
      this.inTransaction = false
    }
  }

  private snapshot(): {
    tasks: Map<string, unknown>
    profiles: Map<string, unknown>
    progressions: Map<string, unknown>
  } {
    return {
      tasks: structuredClone((this.tasks as { tasks: Map<string, unknown> }).tasks),
      profiles: structuredClone((this.profiles as { profiles: Map<string, unknown> }).profiles),
      progressions: structuredClone((this.progressions as { progressions: Map<string, unknown> }).progressions),
    }
  }

  private restore(snapshot: ReturnType<typeof this.snapshot>): void {
    ;(this.tasks as { tasks: Map<string, unknown> }).tasks = snapshot.tasks
    ;(this.profiles as { profiles: Map<string, unknown> }).profiles = snapshot.profiles
    ;(this.progressions as { progressions: Map<string, unknown> }).progressions = snapshot.progressions
  }
}
