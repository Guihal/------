import type { Profile } from "../../../core/domain/profile/types"

export type ProfileRow = {
  id: string
  display_name: string
  created_at: string
  updated_at: string
}

export function toDomain(row: unknown): Profile {
  const r = row as ProfileRow
  return {
    id: r.id,
    name: r.display_name,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function toRow(profile: Profile): ProfileRow {
  return {
    id: profile.id,
    display_name: profile.name,
    created_at: profile.createdAt,
    updated_at: profile.updatedAt,
  }
}
