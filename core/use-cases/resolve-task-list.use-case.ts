import type { Task } from "../domain/task/types"

export type TaskListGroups = {
  readonly overdue: readonly Task[]
  readonly upcoming: readonly Task[]
  readonly noDeadline: readonly Task[]
  readonly completed: readonly Task[]
}

function isOverdue(task: Task, now: Date): boolean {
  if (task.status !== "active" || task.dueAt === null) return false
  return new Date(task.dueAt) < now
}

function isUpcoming(task: Task): boolean {
  return task.status === "active" && task.dueAt !== null
}

function isNoDeadline(task: Task): boolean {
  return task.status === "active" && task.dueAt === null
}

function isCompleted(task: Task): boolean {
  return task.status === "completed"
}

function compareTasks(a: Task, b: Task): number {
  const priorityOrder: Record<Task["priority"], number> = { high: 0, normal: 1, low: 2 }
  const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
  if (pDiff !== 0) return pDiff

  if (a.dueAt !== null && b.dueAt !== null) {
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
  }

  if (a.dueAt !== null && b.dueAt === null) return -1
  if (a.dueAt === null && b.dueAt !== null) return 1

  if (a.dueAt === null && b.dueAt === null) {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  }

  return 0
}

export function resolveTaskList(
  tasks: readonly Task[],
  now: Date,
): TaskListGroups {
  const overdue: Task[] = []
  const upcoming: Task[] = []
  const noDeadline: Task[] = []
  const completed: Task[] = []

  for (const task of tasks) {
    if (isOverdue(task, now)) {
      overdue.push(task)
    } else if (isUpcoming(task)) {
      upcoming.push(task)
    } else if (isNoDeadline(task)) {
      noDeadline.push(task)
    } else if (isCompleted(task)) {
      completed.push(task)
    }
  }

  overdue.sort(compareTasks)
  upcoming.sort(compareTasks)
  noDeadline.sort(compareTasks)
  completed.sort(compareTasks)

  return {
    overdue,
    upcoming,
    noDeadline,
    completed,
  }
}
