import { describe, it, expect, vi } from "vitest"
import { mount } from "@vue/test-utils"
import TaskCard from "../../../app/components/task/TaskCard.vue"
import type { Task } from "../../../core/domain/task/types"

function makeTask(overrides?: Partial<Task>): Task {
  return {
    id: "t1",
    profileId: "p1",
    title: "Test task",
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
  }
}

describe("TaskCard", () => {
  it("renders title", () => {
    const wrapper = mount(TaskCard, { props: { task: makeTask() } })
    expect(wrapper.text()).toContain("Test task")
  })

  it("renders priority badge", () => {
    const wrapper = mount(TaskCard, { props: { task: makeTask({ priority: "high" }) } })
    expect(wrapper.text()).toContain("high")
  })

  it("renders complexity", () => {
    const wrapper = mount(TaskCard, { props: { task: makeTask({ complexity: "large" }) } })
    expect(wrapper.text()).toContain("large")
  })

  it("renders deadline when present", () => {
    const wrapper = mount(TaskCard, { props: { task: makeTask({ dueAt: "2026-06-01T00:00:00Z" }) } })
    expect(wrapper.text()).toContain("6/1/2026")
  })

  it("shows complete and archive buttons for active task", () => {
    const wrapper = mount(TaskCard, { props: { task: makeTask({ status: "active" }) } })
    expect(wrapper.find('[data-testid="btn-complete"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="btn-archive"]').exists()).toBe(true)
  })

  it("hides action buttons for completed task", () => {
    const wrapper = mount(TaskCard, { props: { task: makeTask({ status: "completed" }) } })
    expect(wrapper.find('[data-testid="btn-complete"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="btn-archive"]').exists()).toBe(false)
  })

  it("emits complete on click", async () => {
    const wrapper = mount(TaskCard, { props: { task: makeTask() } })
    await wrapper.find('[data-testid="btn-complete"]').trigger("click")
    expect(wrapper.emitted("complete")).toHaveLength(1)
    expect(wrapper.emitted("complete")![0]).toEqual(["t1"])
  })

  it("emits archive on click", async () => {
    const wrapper = mount(TaskCard, { props: { task: makeTask() } })
    await wrapper.find('[data-testid="btn-archive"]').trigger("click")
    expect(wrapper.emitted("archive")).toHaveLength(1)
    expect(wrapper.emitted("archive")![0]).toEqual(["t1"])
  })
})
