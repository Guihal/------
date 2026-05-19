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

  private readonly taskRepo: MemoryTaskRepository
  private readonly profileRepo: MemoryProfileRepository
  private readonly progressionRepo: MemoryProgressionRepository
  private inTransaction = false

  constructor() {
    this.taskRepo = new MemoryTaskRepository()
    this.profileRepo = new MemoryProfileRepository()
    this.progressionRepo = new MemoryProgressionRepository()
    this.tasks = this.taskRepo
    this.profiles = this.profileRepo
    this.progressions = this.progressionRepo
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

  private snapshot() {
    return {
      tasks: this.taskRepo.snapshot(),
      profiles: this.profileRepo.snapshot(),
      progressions: this.progressionRepo.snapshot(),
    }
  }

  private restore(s: ReturnType<typeof this.snapshot>): void {
    this.taskRepo.restore(s.tasks)
    this.profileRepo.restore(s.profiles)
    this.progressionRepo.restore(s.progressions)
  }
}
