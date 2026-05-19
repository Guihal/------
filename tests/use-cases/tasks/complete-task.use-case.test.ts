import { describe, expect, it } from "vitest"
import type { TaskRepositoryPort } from "../../../core/ports/task-repository.port"
import type { ProfileRepositoryPort } from "../../../core/ports/profile-repository.port"
import type { UnitOfWorkPort } from "../../../core/ports/unit-of-work.port"
import type { Task } from "../../../core/domain/task/types"
import type { Profile } from "../../../core/domain/profile/types"
import type { Progression } from "../../../core/domain/progression/types"
import { completeTask } from "../../../core/use-cases/tasks/complete-task.use-case"

function makeInMemoryUoW(initialTasks: Task[] = [], initialProgression?: Progression): UnitOfWorkPort {
  const tasks: Task[] = [...initialTasks]
  const progressions: Progression[] = initialProgression ? [initialProgression] : []

  const taskRepo: TaskRepositoryPort = {
    async findById(id: string) {
      return tasks.find((t) => t.id === id) ?? null
    },
    async findAll(profileId: string) {
      return tasks.filter((t) => t.profileId === profileId)
    },
    async save(task: Task) {
      const idx = tasks.findIndex((t) => t.id === task.id)
      if (idx >= 0) tasks[idx] = task
      else tasks.push(task)
    },
    async delete(id: string) {
      const idx = tasks.findIndex((t) => t.id === id)
      if (idx >= 0) tasks.splice(idx, 1)
    },
  }

  const profileRepo: ProfileRepositoryPort = {
    async findById(id: string) {
      return progressions.find((p) => p.profileId === id) ?? null
    },
    async save(progression: Progression) {
      const idx = progressions.findIndex((p) => p.profileId === progression.profileId)
      if (idx >= 0) progressions[idx] = progression
      else progressions.push(progression)
    },
  }

  return {
    tasks: taskRepo,
    profiles: profileRepo,
    async run<T>(callback: () => T): Promise<T> {
      return callback()
    },
  }
}

function makeTask(overrides: Partial<Task> & Pick<Task, "id" | "status">): Task {
  return {
    id: overrides.id,
    profileId: overrides.profileId ?? "p1",
    title: overrides.title ?? "Task",
    description: overrides.description ?? null,
    status: overrides.status,
    priority: overrides.priority ?? "normal",
    complexity: overrides.complexity ?? "small",
    complexitySource: "suggested",
    dueAt: overrides.dueAt ?? null,
    createdAt: overrides.createdAt ?? "2026-05-01T00:00:00Z",
    updatedAt: overrides.updatedAt ?? "2026-05-01T00:00:00Z",
    completedAt: overrides.completedAt ?? null,
    archivedAt: overrides.archivedAt ?? null,
  }
}

describe("completeTask", () => {
  it("happy path: marks done, grants XP, applies level progress", async () => {
    const task = makeTask({ id: "t1", status: "active", complexity: "medium", priority: "normal" })
    const progression: Progression = { profileId: "p1", totalXp: 500, updatedAt: "2026-05-01T00:00:00Z" }
    const uow = makeInMemoryUoW([task], progression)

    const result = await completeTask(uow, { taskId: "t1", profileId: "p1", now: "2026-05-10T00:00:00Z" })

    expect(result.task.status).toBe("completed")
    expect(result.task.completedAt).toBe("2026-05-10T00:00:00Z")
    expect(result.xpGranted).toBe(55)
    expect(result.previousLevel).toBe(0)
    expect(result.newLevel).toBe(0)
    expect(result.didLevelUp).toBe(false)
    expect(result.xpToNextLevel).toBe(445)

    const savedTask = await uow.tasks.findById("t1")
    expect(savedTask?.status).toBe("completed")

    const savedProgression = await uow.profiles.findById("p1")
    expect(savedProgression?.totalXp).toBe(555)
  })

  it("grants priority bonus XP", async () => {
    const task = makeTask({ id: "t1", status: "active", complexity: "medium", priority: "high" })
    const progression: Progression = { profileId: "p1", totalXp: 0, updatedAt: "2026-05-01T00:00:00Z" }
    const uow = makeInMemoryUoW([task], progression)

    const result = await completeTask(uow, { taskId: "t1", profileId: "p1", now: "2026-05-10T00:00:00Z" })

    expect(result.xpGranted).toBe(63) // 50 * 1.25 = 62.5 → 63
  })

  it("triggers level up when crossing threshold", async () => {
    const task = makeTask({ id: "t1", status: "active", complexity: "large", priority: "normal" })
    const progression: Progression = { profileId: "p1", totalXp: 950, updatedAt: "2026-05-01T00:00:00Z" }
    const uow = makeInMemoryUoW([task], progression)

    const result = await completeTask(uow, { taskId: "t1", profileId: "p1", now: "2026-05-10T00:00:00Z" })

    expect(result.xpGranted).toBe(110)
    expect(result.previousLevel).toBe(0)
    expect(result.newLevel).toBe(1)
    expect(result.didLevelUp).toBe(true)
    expect(result.xpToNextLevel).toBe(940)
  })

  it("idempotent: second call on completed task does not grant XP", async () => {
    const task = makeTask({ id: "t1", status: "active", complexity: "small", priority: "normal" })
    const progression: Progression = { profileId: "p1", totalXp: 100, updatedAt: "2026-05-01T00:00:00Z" }
    const uow = makeInMemoryUoW([task], progression)

    const first = await completeTask(uow, { taskId: "t1", profileId: "p1", now: "2026-05-10T00:00:00Z" })
    expect(first.xpGranted).toBe(28)
    expect(first.newLevel).toBe(0)

    const second = await completeTask(uow, { taskId: "t1", profileId: "p1", now: "2026-05-11T00:00:00Z" })
    expect(second.xpGranted).toBe(0)
    expect(second.previousLevel).toBe(0)
    expect(second.newLevel).toBe(0)
    expect(second.didLevelUp).toBe(false)

    const savedProgression = await uow.profiles.findById("p1")
    expect(savedProgression?.totalXp).toBe(128)
  })

  it("throws when task not found", async () => {
    const uow = makeInMemoryUoW([], { profileId: "p1", totalXp: 0, updatedAt: "2026-05-01T00:00:00Z" })

    await expect(
      completeTask(uow, { taskId: "missing", profileId: "p1", now: "2026-05-10T00:00:00Z" }),
    ).rejects.toThrow("task not found: missing")
  })

  it("throws when task belongs to different profile", async () => {
    const task = makeTask({ id: "t1", status: "active", profileId: "p1" })
    const progression: Progression = { profileId: "p1", totalXp: 0, updatedAt: "2026-05-01T00:00:00Z" }
    const uow = makeInMemoryUoW([task], progression)

    await expect(
      completeTask(uow, { taskId: "t1", profileId: "p2", now: "2026-05-10T00:00:00Z" }),
    ).rejects.toThrow("task does not belong to profile")
  })

  it("throws when progression not found", async () => {
    const task = makeTask({ id: "t1", status: "active" })
    const uow = makeInMemoryUoW([task])

    await expect(
      completeTask(uow, { taskId: "t1", profileId: "p1", now: "2026-05-10T00:00:00Z" }),
    ).rejects.toThrow("progression not found for profile: p1")
  })

  it("UoW rollback: throws on failure inside transaction", async () => {
    const task = makeTask({ id: "t1", status: "active" })
    const progression: Progression = { profileId: "p1", totalXp: 100, updatedAt: "2026-05-01T00:00:00Z" }

    const uow: UnitOfWorkPort = {
      tasks: {
        async findById() { return task },
        async findAll() { return [task] },
        async save() { /* no-op */ },
        async delete() { /* no-op */ },
      },
      profiles: {
        async findById() { return progression },
        async save() { throw new Error("db failure") },
      },
      async run<T>(callback: () => T): Promise<T> {
        return callback()
      },
    }

    await expect(
      completeTask(uow, { taskId: "t1", profileId: "p1", now: "2026-05-10T00:00:00Z" }),
    ).rejects.toThrow("db failure")
  })
})
