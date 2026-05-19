import type { Progression } from "../../../core/domain/progression/types"

export type ProgressionRow = {
  profile_id: string
  level: number
  xp_total: number
  updated_at: string
}

export function toDomain(row: unknown): Progression {
  const r = row as ProgressionRow
  return {
    profileId: r.profile_id,
    totalXp: r.xp_total,
    updatedAt: r.updated_at,
  }
}

export function toRow(progression: Progression): ProgressionRow {
  return {
    profile_id: progression.profileId,
    level: Math.floor(progression.totalXp / 1000) + 1,
    xp_total: progression.totalXp,
    updated_at: progression.updatedAt,
  }
}
