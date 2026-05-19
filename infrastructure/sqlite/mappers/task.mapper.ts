import type { Task } from "../../../core/domain/task/types"

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

export function toDomain(row: unknown): Task {
  const r = row as TaskRow
  return {
    id: r.id,
    profileId: r.profile_id,
    title: r.title,
    description: r.description,
    status: r.status as Task["status"],
    priority: r.priority as Task["priority"],
    complexity: r.complexity as Task["complexity"],
    complexitySource: r.complexity_source as Task["complexitySource"],
    dueAt: r.due_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    completedAt: r.completed_at,
    archivedAt: r.archived_at,
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
