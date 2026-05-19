import { describe, it, expect, beforeEach } from "vitest"
import { MemoryUnitOfWork } from "../../../../infrastructure/memory/unit-of-work/memory-unit-of-work"
import type { Task } from "../../../../core/domain/task/types"
import type { Profile } from "../../../../core/domain/profile/types"
import type { Progression } from "../../../../core/domain/progression/types"

describe("memory unit of work", () => {
  let uow: MemoryUnitOfWork

  beforeEach(() => {
    uow = new MemoryUnitOfWork()
  })

  const profile: Profile = { id: "p1", name: "Alice", createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" }
  const task: Task = {
    id: "t1", profileId: "p1", title: "T", description: null, status: "active",
    priority: "normal", complexity: "small", complexitySource: "suggested",
    dueAt: null, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z",
    completedAt: null, archivedAt: null,
  }

  it("commits multi-entity operation", async () => {
    await uow.run(async () => {
      await uow.profiles.save(profile)
      await uow.tasks.save(task)
    })
    expect(await uow.profiles.findById("p1")).toEqual(profile)
    expect(await uow.tasks.findById("p1", "t1")).toEqual(task)
  })

  it("rolls back on error leaving no partial state", async () => {
    await expect(
      uow.run(async () => {
        await uow.profiles.save(profile)
        await uow.tasks.save(task)
        throw new Error("boom")
      }),
    ).rejects.toThrow("boom")

    expect(await uow.profiles.findById("p1")).toBeNull()
    expect(await uow.tasks.findById("p1", "t1")).toBeNull()
  })

  it("simulates completeTask chain: save task + save progression", async () => {
    await uow.profiles.save(profile)
    const prog: Progression = { profileId: "p1", totalXp: 0, updatedAt: "2025-01-01T00:00:00Z" }
    await uow.progressions.save(prog)

    const completedTask: Task = { ...task, status: "completed", updatedAt: "2025-01-02T00:00:00Z", completedAt: "2025-01-02T00:00:00Z" }
    const updatedProg: Progression = { profileId: "p1", totalXp: 500, updatedAt: "2025-01-02T00:00:00Z" }

    await uow.run(async () => {
      await uow.tasks.save(completedTask)
      await uow.progressions.save(updatedProg)
    })

    expect(await uow.tasks.findById("p1", "t1")).toEqual(completedTask)
    expect(await uow.progressions.findById("p1")).toEqual(updatedProg)
  })

  it("rolls back completeTask chain on error", async () => {
    await uow.profiles.save(profile)
    const prog: Progression = { profileId: "p1", totalXp: 0, updatedAt: "2025-01-01T00:00:00Z" }
    await uow.progressions.save(prog)
    await uow.tasks.save(task)

    const completedTask: Task = { ...task, status: "completed", updatedAt: "2025-01-02T00:00:00Z", completedAt: "2025-01-02T00:00:00Z" }
    const updatedProg: Progression = { profileId: "p1", totalXp: 500, updatedAt: "2025-01-02T00:00:00Z" }

    await expect(
      uow.run(async () => {
        await uow.tasks.save(completedTask)
        await uow.progressions.save(updatedProg)
        throw new Error("boom")
      }),
    ).rejects.toThrow("boom")

    expect((await uow.tasks.findById("p1", "t1"))!.status).toBe("active")
    expect((await uow.progressions.findById("p1"))!.totalXp).toBe(0)
  })

  it("rejects nested run", async () => {
    await expect(
      uow.run(async () => {
        await uow.profiles.save(profile)
        await uow.run(async () => {
          await uow.tasks.save(task)
        })
      }),
    ).rejects.toThrow("Nested transactions are not supported")
  })
})
