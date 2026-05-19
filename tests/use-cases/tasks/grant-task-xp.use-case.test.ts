import { describe, expect, it } from "vitest"
import type { UnitOfWorkPort } from "../../../core/ports/unit-of-work.port"
import type { Progression } from "../../../core/domain/progression/types"
import { grantTaskXp } from "../../../core/use-cases/tasks/grant-task-xp.use-case"

function makeUoW(initialProgression?: Progression): UnitOfWorkPort {
  const progressions: Progression[] = initialProgression ? [initialProgression] : []
  return {
    tasks: { async findById() { return null }, async findAll() { return [] }, async save() {}, async delete() {} },
    profiles: { async findById() { return null }, async save() {} },
    progressions: {
      async findById(id: string) { return progressions.find((p) => p.profileId === id) ?? null },
      async save(p) {
        const idx = progressions.findIndex((x) => x.profileId === p.profileId)
        if (idx >= 0) progressions[idx] = p
        else progressions.push(p)
      },
    },
    async run<T>(callback: () => Promise<T>): Promise<T> { return callback() },
  }
}

describe("grantTaskXp", () => {
  it("grants XP and updates progression", async () => {
    const uow = makeUoW({ profileId: "p1", totalXp: 500, updatedAt: "2026-05-01T00:00:00Z" })
    const result = await grantTaskXp(uow, { profileId: "p1", complexity: "medium", priority: "normal", now: "2026-05-10T00:00:00Z" })

    expect(result.xpGranted).toBe(55)
    expect(result.previousLevel).toBe(0)
    expect(result.newLevel).toBe(0)
    expect(result.didLevelUp).toBe(false)
    expect(result.xpToNextLevel).toBe(445)
    expect((await uow.progressions.findById("p1"))?.totalXp).toBe(555)
  })

  it("grants priority bonus XP", async () => {
    const uow = makeUoW({ profileId: "p1", totalXp: 0, updatedAt: "2026-05-01T00:00:00Z" })
    const result = await grantTaskXp(uow, { profileId: "p1", complexity: "medium", priority: "high", now: "2026-05-10T00:00:00Z" })
    expect(result.xpGranted).toBe(63)
  })

  it("triggers level up when crossing threshold", async () => {
    const uow = makeUoW({ profileId: "p1", totalXp: 950, updatedAt: "2026-05-01T00:00:00Z" })
    const result = await grantTaskXp(uow, { profileId: "p1", complexity: "large", priority: "normal", now: "2026-05-10T00:00:00Z" })

    expect(result.xpGranted).toBe(110)
    expect(result.previousLevel).toBe(0)
    expect(result.newLevel).toBe(1)
    expect(result.didLevelUp).toBe(true)
    expect(result.xpToNextLevel).toBe(940)
  })

  it("throws when progression not found", async () => {
    const uow = makeUoW()
    await expect(grantTaskXp(uow, { profileId: "p1", complexity: "small", priority: "normal", now: "2026-05-10T00:00:00Z" }))
      .rejects.toThrow("progression not found for profile: p1")
  })

  it("UoW rollback: throws on failure inside transaction", async () => {
    const uow: UnitOfWorkPort = {
      tasks: { async findById() { return null }, async findAll() { return [] }, async save() {}, async delete() {} },
      profiles: { async findById() { return null }, async save() {} },
      progressions: {
        async findById() { return { profileId: "p1", totalXp: 100, updatedAt: "2026-05-01T00:00:00Z" } },
        async save() { throw new Error("db failure") },
      },
      async run<T>(callback: () => Promise<T>): Promise<T> { return callback() },
    }

    await expect(grantTaskXp(uow, { profileId: "p1", complexity: "small", priority: "normal", now: "2026-05-10T00:00:00Z" }))
      .rejects.toThrow("db failure")
  })
})
