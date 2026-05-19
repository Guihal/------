import type { Profile } from "../../../core/domain/profile/types"

export type ProfileRow = {
  id: string
  display_name: string
  created_at: string
  updated_at: string
}

function assertString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new TypeError(`Expected ${field} to be string, got ${typeof value}`)
  }
  return value
}

export function toDomain(row: unknown): Profile {
  if (row === null || typeof row !== "object") {
    throw new TypeError("Expected row to be an object, got " + typeof row)
  }
  const r = row as Record<string, unknown>

  return {
    id: assertString(r.id, "id"),
    name: assertString(r.display_name, "display_name"),
    createdAt: assertString(r.created_at, "created_at"),
    updatedAt: assertString(r.updated_at, "updated_at"),
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
