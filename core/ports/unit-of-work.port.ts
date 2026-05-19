import type { TaskRepositoryPort } from "./task-repository.port"
import type { ProfileRepositoryPort } from "./profile-repository.port"
import type { ProgressionRepositoryPort } from "./progression-repository.port"

export interface UnitOfWorkPort {
  readonly tasks: TaskRepositoryPort
  readonly profiles: ProfileRepositoryPort
  readonly progressions: ProgressionRepositoryPort
  run<T>(callback: () => Promise<T>): Promise<T>
}
