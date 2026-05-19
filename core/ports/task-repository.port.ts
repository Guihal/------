import type { Task } from "../domain/task/types"

export interface TaskRepositoryPort {
  findById(id: string): Promise<Task | null>
  findAll(profileId: string): Promise<readonly Task[]>
  save(task: Task): Promise<void>
  delete(id: string): Promise<void>
}
