import type { Progression } from "../domain/progression/types"

export interface ProgressionRepositoryPort {
  findById(profileId: string): Promise<Progression | null>
  save(progression: Progression): Promise<void>
}
