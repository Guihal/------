export type TaskStatus = "active" | "completed" | "archived"
export type TaskPriority = "low" | "normal" | "high"
export type TaskComplexity = "tiny" | "small" | "medium" | "large"
export type TaskComplexitySource = "suggested" | "manual"

export type Task = {
  readonly id: string
  readonly profileId: string
  readonly title: string
  readonly description: string | null
  readonly status: TaskStatus
  readonly priority: TaskPriority
  readonly complexity: TaskComplexity
  readonly complexitySource: TaskComplexitySource
  readonly dueAt: string | null
  readonly createdAt: string
  readonly updatedAt: string
  readonly completedAt: string | null
  readonly archivedAt: string | null
}
