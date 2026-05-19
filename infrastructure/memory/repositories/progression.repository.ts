import type { ProgressionRepositoryPort } from "../../../core/ports/progression-repository.port"
import type { Progression } from "../../../core/domain/progression/types"

export class MemoryProgressionRepository implements ProgressionRepositoryPort {
  private progressions = new Map<string, Progression>()

  async findById(profileId: string): Promise<Progression | null> {
    return this.progressions.get(profileId) ?? null
  }

  async save(progression: Progression): Promise<void> {
    this.progressions.set(progression.profileId, progression)
  }
}
