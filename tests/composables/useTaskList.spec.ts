import { describe, it, expect, vi } from "vitest"
import { setActivePinia, createPinia } from "pinia"
import { useTaskList } from "../../app/composables/useTaskList"
import { useTaskStore } from "../../app/stores/useTaskStore"
import type { AppDependencies } from "../../infrastructure/di/app-dependencies"
import type { Task } from "../../core/domain/task/types"

const mockTask = (overrides?: Partial<Task>): Task => ({
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
  ...overrides,
})

function makeDeps(): AppDependencies {
  return {
    ports: {} as unknown as AppDependencies["ports"],
    useCases: {
      createTask: vi.fn(),
      completeTask: vi.fn(),
      archiveTask: vi.fn(),
      grantTaskXp: vi.fn(),
      applyLevelProgress: vi.fn(),
      resolveTaskList: vi.fn().mockReturnValue({
        overdue: [mockTask({ id: "t1", dueAt: "2026-01-01T00:00:00Z" })],
        upcoming: [mockTask({ id: "t2", dueAt: "2026-12-31T00:00:00Z" })],
        noDeadline: [mockTask({ id: "t3" })],
        completed: [mockTask({ id: "t4", status: "completed" })],
      }),
      suggestTaskComplexity: vi.fn(),
    },
  }
}

describe("useTaskList", () => {
  it("returns resolved groups from store", () => {
    setActivePinia(createPinia())
    ;(globalThis as unknown as Record<string, unknown>)["app-dependencies"] = makeDeps()

    const store = useTaskStore()
    store.setTasks([mockTask()])

    const list = useTaskList()

    expect(list.overdue.value).toHaveLength(1)
    expect(list.upcoming.value).toHaveLength(1)
    expect(list.noDeadline.value).toHaveLength(1)
    expect(list.completed.value).toHaveLength(1)
  })
})
