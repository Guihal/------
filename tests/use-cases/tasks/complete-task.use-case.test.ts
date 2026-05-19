import { describe, expect, it } from "vitest"
import type { UnitOfWorkPort } from "../../../core/ports/unit-of-work.port"
import type { Task } from "../../../core/domain/task/types"
import type { Progression } from "../../../core/domain/progression/types"
import { completeTask } from "../../../core/use-cases/tasks/complete-task.use-case"

function makeUoW(initialTasks: Task[] = [], initialProgression?: Progression): UnitOfWorkPort {
  const tasks: Task[] = [...initialTasks]
  const progressions: Progression[] = initialProgression ? [initialProgression] : []
  return {
    tasks: {
      async findById(_profileId: string, id: string) { return tasks.find((t) => t.id === id) ?? null },
      async findAll(profileId: string) { return tasks.filter((t) => t.profileId === profileId) },
      async save(task: Task) { const idx = tasks.findIndex((t) => t.id === task.id); if (idx >= 0) tasks[idx] = task; else tasks.push(task) },
      async delete(_profileId: string, id: string) { const idx = tasks.findIndex((t) => t.id === id); if (idx >= 0) tasks.splice(idx, 1) },
    },
    profiles: { async findById() { return null }, async save() {} },
    progressions: {
      async findById(id: string) { return progressions.find((p) => p.profileId === id) ?? null },
      async save(p: Progression) { const idx = progressions.findIndex((x) => x.profileId === p.profileId); if (idx >= 0) progressions[idx] = p; else progressions.push(p) },
    },
    async run<T>(callback: () => Promise<T>): Promise<T> { return callback() },
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
    const uow = makeUoW([task], progression)

    const result = await completeTask(uow, { taskId: "t1", profileId: "p1", now: "2026-05-10T00:00:00Z" })

    expect(result.task.status).toBe("completed")
    expect(result.task.completedAt).toBe("2026-05-10T00:00:00Z")
    expect(result.xpGranted).toBe(55)
    expect(result.previousLevel).toBe(0)
    expect(result.newLevel).toBe(0)
    expect(result.didLevelUp).toBe(false)
    expect(result.xpToNextLevel).toBe(445)
    expect((await uow.tasks.findById("p1", "t1"))?.status).toBe("completed")
    expect((await uow.progressions.findById("p1"))?.totalXp).toBe(555)
  })

  it("grants priority bonus XP", async () => {
    const task = makeTask({ id: "t1", status: "active", complexity: "medium", priority: "high" })
    const uow = makeUoW([task], { profileId: "p1", totalXp: 0, updatedAt: "2026-05-01T00:00:00Z" })
    const result = await completeTask(uow, { taskId: "t1", profileId: "p1", now: "2026-05-10T00:00:00Z" })
    expect(result.xpGranted).toBe(63)
  })

  it("triggers level up when crossing threshold", async () => {
    const task = makeTask({ id: "t1", status: "active", complexity: "large", priority: "normal" })
    const uow = makeUoW([task], { profileId: "p1", totalXp: 950, updatedAt: "2026-05-01T00:00:00Z" })
    const result = await completeTask(uow, { taskId: "t1", profileId: "p1", now: "2026-05-10T00:00:00Z" })

    expect(result.xpGranted).toBe(110)
    expect(result.previousLevel).toBe(0)
    expect(result.newLevel).toBe(1)
    expect(result.didLevelUp).toBe(true)
    expect(result.xpToNextLevel).toBe(940)
  })

  it("idempotent: second call on completed task does not grant XP", async () => {
    const task = makeTask({ id: "t1", status: "active", complexity: "small", priority: "normal" })
    const uow = makeUoW([task], { profileId: "p1", totalXp: 100, updatedAt: "2026-05-01T00:00:00Z" })

    const first = await completeTask(uow, { taskId: "t1", profileId: "p1", now: "2026-05-10T00:00:00Z" })
    expect(first.xpGranted).toBe(28)

    const second = await completeTask(uow, { taskId: "t1", profileId: "p1", now: "2026-05-11T00:00:00Z" })
    expect(second.xpGranted).toBe(0)
    expect(second.didLevelUp).toBe(false)
    expect((await uow.progressions.findById("p1"))?.totalXp).toBe(128)
  })

  it("throws when task not found", async () => {
    const uow = makeUoW([], { profileId: "p1", totalXp: 0, updatedAt: "2026-05-01T00:00:00Z" })
    await expect(completeTask(uow, { taskId: "missing", profileId: "p1", now: "2026-05-10T00:00:00Z" }))
      .rejects.toThrow("task not found: missing")
  })

  it("throws when task belongs to different profile", async () => {
    const task = makeTask({ id: "t1", status: "active", profileId: "p1" })
    const uow = makeUoW([task], { profileId: "p1", totalXp: 0, updatedAt: "2026-05-01T00:00:00Z" })
    await expect(completeTask(uow, { taskId: "t1", profileId: "p2", now: "2026-05-10T00:00:00Z" }))
      .rejects.toThrow("task does not belong to profile")
  })

  it("throws when progression not found", async () => {
    const task = makeTask({ id: "t1", status: "active" })
    const uow = makeUoW([task])
    await expect(completeTask(uow, { taskId: "t1", profileId: "p1", now: "2026-05-10T00:00:00Z" }))
      .rejects.toThrow("progression not found for profile: p1")
  })
})
