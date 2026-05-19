import type { Task, TaskStatus, TaskPriority, TaskComplexity, TaskComplexitySource } from "../../../core/domain/task/types"

export type TaskRow = {
  id: string
  profile_id: string
  title: string
  description: string | null
  status: string
  priority: string
  complexity: string
  complexity_source: string
  due_at: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  archived_at: string | null
}

const TASK_STATUS_VALUES: readonly TaskStatus[] = ["active", "completed", "archived"]
const TASK_PRIORITY_VALUES: readonly TaskPriority[] = ["low", "normal", "high"]
const TASK_COMPLEXITY_VALUES: readonly TaskComplexity[] = ["tiny", "small", "medium", "large"]
const TASK_COMPLEXITY_SOURCE_VALUES: readonly TaskComplexitySource[] = ["suggested", "manual"]

function assertString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new TypeError(`Expected ${field} to be string, got ${typeof value}`)
  }
  return value
}

function assertStringOrNull(value: unknown, field: string): string | null {
  if (value === null || value === undefined) return null
  if (typeof value !== "string") {
    throw new TypeError(`Expected ${field} to be string or null, got ${typeof value}`)
  }
  return value
}

function assertEnum<T extends string>(value: unknown, field: string, allowed: readonly T[]): T {
  const s = assertString(value, field)
  if (!allowed.includes(s as T)) {
    throw new TypeError(`Invalid ${field}: "${s}". Allowed: ${allowed.join(", ")}`)
  }
  return s as T
}

export function toDomain(row: unknown): Task {
  if (row === null || typeof row !== "object") {
    throw new TypeError("Expected row to be an object, got " + typeof row)
  }
  const r = row as Record<string, unknown>

  return {
    id: assertString(r.id, "id"),
    profileId: assertString(r.profile_id, "profile_id"),
    title: assertString(r.title, "title"),
    description: assertStringOrNull(r.description, "description"),
    status: assertEnum(r.status, "status", TASK_STATUS_VALUES),
    priority: assertEnum(r.priority, "priority", TASK_PRIORITY_VALUES),
    complexity: assertEnum(r.complexity, "complexity", TASK_COMPLEXITY_VALUES),
    complexitySource: assertEnum(r.complexity_source, "complexity_source", TASK_COMPLEXITY_SOURCE_VALUES),
    dueAt: assertStringOrNull(r.due_at, "due_at"),
    createdAt: assertString(r.created_at, "created_at"),
    updatedAt: assertString(r.updated_at, "updated_at"),
    completedAt: assertStringOrNull(r.completed_at, "completed_at"),
    archivedAt: assertStringOrNull(r.archived_at, "archived_at"),
  }
}

export function toRow(task: Task): TaskRow {
  return {
    id: task.id,
    profile_id: task.profileId,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    complexity: task.complexity,
    complexity_source: task.complexitySource,
    due_at: task.dueAt,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
    completed_at: task.completedAt,
    archived_at: task.archivedAt,
  }
}
