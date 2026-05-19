import { describe, expect, it } from "vitest"
import type { TaskRepositoryPort } from "../../../core/ports/task-repository.port"
import type { ProfileRepositoryPort } from "../../../core/ports/profile-repository.port"
import type { ProgressionRepositoryPort } from "../../../core/ports/progression-repository.port"
import type { UnitOfWorkPort } from "../../../core/ports/unit-of-work.port"
import type { Task } from "../../../core/domain/task/types"
import type { Profile } from "../../../core/domain/profile/types"
import type { Progression } from "../../../core/domain/progression/types"
import { grantTaskXp } from "../../../core/use-cases/tasks/grant-task-xp.use-case"

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
      return null
    },
    async save(profile: Profile) {
      /* no-op */
    },
  }

  const progressionRepo: ProgressionRepositoryPort = {
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
    progressions: progressionRepo,
    async run<T>(callback: () => Promise<T>): Promise<T> {
      return callback()
    },
  }
}

describe("grantTaskXp", () => {
  it("grants XP and updates progression", async () => {
    const progression: Progression = { profileId: "p1", totalXp: 500, updatedAt: "2026-05-01T00:00:00Z" }
    const uow = makeInMemoryUoW([], progression)

    const result = await grantTaskXp(uow, {
      profileId: "p1",
      complexity: "medium",
      priority: "normal",
      now: "2026-05-10T00:00:00Z",
    })

    expect(result.xpGranted).toBe(55)
    expect(result.previousLevel).toBe(0)
    expect(result.newLevel).toBe(0)
    expect(result.didLevelUp).toBe(false)
    expect(result.xpToNextLevel).toBe(445)

    const savedProgression = await uow.progressions.findById("p1")
    expect(savedProgression?.totalXp).toBe(555)
  })

  it("grants priority bonus XP", async () => {
    const progression: Progression = { profileId: "p1", totalXp: 0, updatedAt: "2026-05-01T00:00:00Z" }
    const uow = makeInMemoryUoW([], progression)

    const result = await grantTaskXp(uow, {
      profileId: "p1",
      complexity: "medium",
      priority: "high",
      now: "2026-05-10T00:00:00Z",
    })

    expect(result.xpGranted).toBe(63)
  })

  it("triggers level up when crossing threshold", async () => {
    const progression: Progression = { profileId: "p1", totalXp: 950, updatedAt: "2026-05-01T00:00:00Z" }
    const uow = makeInMemoryUoW([], progression)

    const result = await grantTaskXp(uow, {
      profileId: "p1",
      complexity: "large",
      priority: "normal",
      now: "2026-05-10T00:00:00Z",
    })

    expect(result.xpGranted).toBe(110)
    expect(result.previousLevel).toBe(0)
    expect(result.newLevel).toBe(1)
    expect(result.didLevelUp).toBe(true)
    expect(result.xpToNextLevel).toBe(940)
  })

  it("throws when progression not found", async () => {
    const uow = makeInMemoryUoW([])

    await expect(
      grantTaskXp(uow, {
        profileId: "p1",
        complexity: "small",
        priority: "normal",
        now: "2026-05-10T00:00:00Z",
      }),
    ).rejects.toThrow("progression not found for profile: p1")
  })

  it("UoW rollback: throws on failure inside transaction", async () => {
    const progression: Progression = { profileId: "p1", totalXp: 100, updatedAt: "2026-05-01T00:00:00Z" }

    const uow: UnitOfWorkPort = {
      tasks: {
        async findById() { return null },
        async findAll() { return [] },
        async save() { /* no-op */ },
        async delete() { /* no-op */ },
      },
      profiles: {
        async findById() { return null },
        async save() { /* no-op */ },
      },
      progressions: {
        async findById() { return progression },
        async save() { throw new Error("db failure") },
      },
      async run<T>(callback: () => Promise<T>): Promise<T> {
        return callback()
      },
    }

    await expect(
      grantTaskXp(uow, {
        profileId: "p1",
        complexity: "small",
        priority: "normal",
        now: "2026-05-10T00:00:00Z",
      }),
    ).rejects.toThrow("db failure")
  })
})
