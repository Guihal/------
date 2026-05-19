import { describe, it, expect, beforeEach } from "vitest"
import { MemoryTaskRepository } from "../../../../infrastructure/memory/repositories/task.repository"
import { MemoryProfileRepository } from "../../../../infrastructure/memory/repositories/profile.repository"
import { MemoryProgressionRepository } from "../../../../infrastructure/memory/repositories/progression.repository"
import type { Task } from "../../../../core/domain/task/types"
import type { Profile } from "../../../../core/domain/profile/types"
import type { Progression } from "../../../../core/domain/progression/types"

describe("memory repositories", () => {
  let tasks: MemoryTaskRepository
  let profiles: MemoryProfileRepository
  let progressions: MemoryProgressionRepository

  beforeEach(() => {
    tasks = new MemoryTaskRepository()
    profiles = new MemoryProfileRepository()
    progressions = new MemoryProgressionRepository()
  })

  const profile: Profile = { id: "p1", name: "Alice", createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" }
  const task: Task = {
    id: "t1", profileId: "p1", title: "T", description: null, status: "active",
    priority: "normal", complexity: "small", complexitySource: "suggested",
    dueAt: null, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z",
    completedAt: null, archivedAt: null,
  }

  it("profile CRUD", async () => {
    expect(await profiles.findById("p1")).toBeNull()
    await profiles.save(profile)
    const found = await profiles.findById("p1")
    expect(found).toEqual(profile)
  })

  it("task CRUD", async () => {
    await profiles.save(profile)
    expect(await tasks.findById("p1", "t1")).toBeNull()
    await tasks.save(task)
    const found = await tasks.findById("p1", "t1")
    expect(found).toEqual(task)
  })

  it("task findAll filters by profileId", async () => {
    await profiles.save(profile)
    await profiles.save({ ...profile, id: "p2", name: "Bob" })
    await tasks.save(task)
    await tasks.save({ ...task, id: "t2", profileId: "p2" })
    const p1Tasks = await tasks.findAll("p1")
    expect(p1Tasks).toHaveLength(1)
    expect(p1Tasks[0].id).toBe("t1")
  })

  it("task delete", async () => {
    await profiles.save(profile)
    await tasks.save(task)
    await tasks.delete("p1", "t1")
    expect(await tasks.findById("p1", "t1")).toBeNull()
  })

  it("task save updates existing", async () => {
    await profiles.save(profile)
    await tasks.save(task)
    const updated: Task = { ...task, title: "Updated", status: "completed", completedAt: "2025-01-02T00:00:00Z" }
    await tasks.save(updated)
    const found = await tasks.findById("p1", "t1")
    expect(found).toEqual(updated)
  })

  it("progression CRUD", async () => {
    await profiles.save(profile)
    const prog: Progression = { profileId: "p1", totalXp: 1500, updatedAt: "2025-01-02T00:00:00Z" }
    await progressions.save(prog)
    const found = await progressions.findById("p1")
    expect(found).toEqual(prog)
  })

  it("progression save updates existing", async () => {
    await profiles.save(profile)
    const prog: Progression = { profileId: "p1", totalXp: 500, updatedAt: "2025-01-02T00:00:00Z" }
    await progressions.save(prog)
    const updated: Progression = { profileId: "p1", totalXp: 2500, updatedAt: "2025-01-03T00:00:00Z" }
    await progressions.save(updated)
    const found = await progressions.findById("p1")
    expect(found).toEqual(updated)
  })
})
