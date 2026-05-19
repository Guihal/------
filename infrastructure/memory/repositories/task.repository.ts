import type { TaskRepositoryPort } from "../../../core/ports/task-repository.port"
import type { Task } from "../../../core/domain/task/types"

export class MemoryTaskRepository implements TaskRepositoryPort {
  private tasks = new Map<string, Task>()

  private key(profileId: string, id: string): string {
    return `${profileId}:${id}`
  }

  async findById(profileId: string, id: string): Promise<Task | null> {
    return this.tasks.get(this.key(profileId, id)) ?? null
  }

  async findAll(profileId: string): Promise<readonly Task[]> {
    return [...this.tasks.values()].filter((t) => t.profileId === profileId)
  }

  async save(task: Task): Promise<void> {
    this.tasks.set(this.key(task.profileId, task.id), task)
  }

  async delete(profileId: string, id: string): Promise<void> {
    this.tasks.delete(this.key(profileId, id))
  }
}
