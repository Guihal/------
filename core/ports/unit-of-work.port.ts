import type { TaskRepositoryPort } from "./task-repository.port"
import type { ProfileRepositoryPort } from "./profile-repository.port"

export interface UnitOfWorkPort {
  readonly tasks: TaskRepositoryPort
  readonly profiles: ProfileRepositoryPort
  run<T>(callback: () => T): Promise<T>
}
