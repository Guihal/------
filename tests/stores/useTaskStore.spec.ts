import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { setActivePinia, createPinia } from "pinia"
import { useTaskStore } from "../../app/stores/useTaskStore"
import type { AppDependencies } from "../../infrastructure/di/app-dependencies"
import type { Task } from "../../core/domain/task/types"

const mockTask: Task = {
  id: "t1",
  profileId: "p1",
  title: "Test",
  description: null,
  status: "active",
  priority: "normal",
  complexity: "small",
  complexitySource: "manual",
  dueAt: null,
  createdAt: "2026-05-19T00:00:00Z",
  updatedAt: "2026-05-19T00:00:00Z",
  completedAt: null,
  archivedAt: null,
}

function makeDeps(overrides?: {
  createTask?: Task
  completeTask?: Task
  archiveTask?: Task
}): AppDependencies {
  return {
    ports: {} as unknown as AppDependencies["ports"],
    useCases: {
      createTask: vi.fn().mockResolvedValue({ task: overrides?.createTask ?? mockTask }),
      completeTask: vi.fn().mockResolvedValue({
        task: overrides?.completeTask ?? { ...mockTask, status: "completed" as const },
        xpGranted: 25,
        previousLevel: 0,
        newLevel: 0,
        didLevelUp: false,
        xpToNextLevel: 1000,
      }),
      archiveTask: vi.fn().mockResolvedValue({
        task: overrides?.archiveTask ?? { ...mockTask, status: "archived" as const },
      }),
      grantTaskXp: vi.fn(),
      applyLevelProgress: vi.fn(),
      resolveTaskList: vi.fn().mockReturnValue({
        overdue: [],
        upcoming: [],
        noDeadline: [mockTask],
        completed: [],
      }),
      suggestTaskComplexity: vi.fn().mockReturnValue("medium"),
    },
  }
}

describe("useTaskStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    Object.defineProperty(globalThis, "crypto", {
      value: { randomUUID: () => "uuid-1" },
      writable: true,
      configurable: true,
    })
    delete (globalThis as unknown as Record<string, unknown>)["app-dependencies"]
  })

  afterEach(() => {
    delete (globalThis as unknown as Record<string, unknown>)["app-dependencies"]
  })

  function setDeps(deps: AppDependencies) {
    (globalThis as unknown as Record<string, unknown>)["app-dependencies"] = deps
  }

  it("createTask calls use case and appends task", async () => {
    const deps = makeDeps()
    setDeps(deps)

    const store = useTaskStore()
    store.setTasks([])

    const result = await store.createTask({
      id: "t1",
      profileId: "p1",
      title: "New",
      description: null,
      priority: "normal",
      complexity: "small",
      dueAt: null,
      now: "2026-05-19T00:00:00Z",
    })

    expect(deps.useCases.createTask).toHaveBeenCalled()
    expect(result).toEqual(mockTask)
    expect(store.tasks).toHaveLength(1)
  })

  it("completeTask updates task in list", async () => {
    const completed = { ...mockTask, status: "completed" as const }
    const deps = makeDeps({ completeTask: completed })
    setDeps(deps)

    const store = useTaskStore()
    store.setTasks([mockTask])

    await store.completeTask({ taskId: "t1", profileId: "p1", now: "2026-05-19T00:00:00Z" })

    expect(deps.useCases.completeTask).toHaveBeenCalledWith(expect.objectContaining({ taskId: "t1", profileId: "p1" }))
    expect(store.tasks[0].status).toBe("completed")
  })

  it("archiveTask updates task in list", async () => {
    const archived = { ...mockTask, status: "archived" as const }
    const deps = makeDeps({ archiveTask: archived })
    setDeps(deps)

    const store = useTaskStore()
    store.setTasks([mockTask])

    await store.archiveTask({ taskId: "t1", profileId: "p1", now: "2026-05-19T00:00:00Z" })

    expect(deps.useCases.archiveTask).toHaveBeenCalledWith(expect.objectContaining({ taskId: "t1", profileId: "p1" }))
    expect(store.tasks[0].status).toBe("archived")
  })

  it("suggestComplexity delegates to use case", () => {
    const deps = makeDeps()
    setDeps(deps)

    const store = useTaskStore()
    const result = store.suggestComplexity({
      title: "Test",
      description: null,
      priority: "normal",
      dueAt: null,
    })

    expect(deps.useCases.suggestTaskComplexity).toHaveBeenCalled()
    expect(result).toBe("medium")
  })

  it("groups computed calls resolveTaskList", () => {
    const deps = makeDeps()
    setDeps(deps)

    const store = useTaskStore()
    store.setTasks([mockTask])

    const groups = store.resolveGroups(new Date("2026-05-20T00:00:00Z"))
    expect(groups.noDeadline).toHaveLength(1)
    expect(deps.useCases.resolveTaskList).toHaveBeenCalledWith([mockTask], expect.any(Date))
  })
})
