import { describe, expect, it } from "vitest"
import type { TaskRepositoryPort } from "../../../core/ports/task-repository.port"
import type { Task } from "../../../core/domain/task/types"
import { createTask } from "../../../core/use-cases/tasks/create-task.use-case"

function makeInMemoryTaskRepo(): TaskRepositoryPort & { readonly tasks: Task[] } {
  const tasks: Task[] = []
  return {
    get tasks() { return tasks },
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
}

describe("createTask", () => {
  it("creates and persists a task", async () => {
    const repo = makeInMemoryTaskRepo()
    const result = await createTask(repo, {
      id: "t1",
      profileId: "p1",
      title: "Test task",
      description: "Desc",
      priority: "high",
      complexity: "medium",
      dueAt: "2026-05-20T00:00:00Z",
      now: "2026-05-01T00:00:00Z",
    })

    expect(result.task.id).toBe("t1")
    expect(result.task.profileId).toBe("p1")
    expect(result.task.title).toBe("Test task")
    expect(result.task.status).toBe("active")
    expect(result.task.complexitySource).toBe("manual")
    expect(result.task.createdAt).toBe("2026-05-01T00:00:00Z")
    expect(repo.tasks).toHaveLength(1)
  })

  it("trims title whitespace", async () => {
    const repo = makeInMemoryTaskRepo()
    const result = await createTask(repo, {
      id: "t1",
      profileId: "p1",
      title: "  Test  ",
      description: null,
      priority: "normal",
      complexity: "small",
      dueAt: null,
      now: "2026-05-01T00:00:00Z",
    })

    expect(result.task.title).toBe("Test")
  })

  it("rejects empty title", async () => {
    const repo = makeInMemoryTaskRepo()
    await expect(
      createTask(repo, {
        id: "t1",
        profileId: "p1",
        title: "   ",
        description: null,
        priority: "normal",
        complexity: "small",
        dueAt: null,
        now: "2026-05-01T00:00:00Z",
      }),
    ).rejects.toThrow("title must not be empty")
  })
})
