import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import TaskCreateForm from "../../../app/components/task/TaskCreateForm.vue"

describe("TaskCreateForm", () => {
  it("renders form fields", () => {
    const wrapper = mount(TaskCreateForm)
    expect(wrapper.find("[data-testid='input-title']").exists()).toBe(true)
    expect(wrapper.find("[data-testid='input-description']").exists()).toBe(true)
    expect(wrapper.find("[data-testid='input-priority']").exists()).toBe(true)
    expect(wrapper.find("[data-testid='input-due']").exists()).toBe(true)
    expect(wrapper.find("[data-testid='input-complexity']").exists()).toBe(true)
  })

  it("emits submit with correct data", async () => {
    const wrapper = mount(TaskCreateForm)
    await wrapper.find("[data-testid='input-title']").setValue("My task")
    await wrapper.find("[data-testid='input-description']").setValue("Details")
    await wrapper.find("[data-testid='input-priority']").setValue("high")
    await wrapper.find("[data-testid='input-due']").setValue("2026-06-01")
    await wrapper.find("[data-testid='input-complexity']").setValue("large")
    await wrapper.find("[data-testid='btn-submit']").trigger("submit")

    expect(wrapper.emitted("submit")).toHaveLength(1)
    const payload = wrapper.emitted("submit")![0][0] as {
      title: string
      description: string | null
      priority: string
      dueAt: string | null
      complexity: string
      complexitySource: string
    }
    expect(payload.title).toBe("My task")
    expect(payload.description).toBe("Details")
    expect(payload.priority).toBe("high")
    expect(payload.dueAt).toBe("2026-06-01")
    expect(payload.complexity).toBe("large")
    expect(payload.complexitySource).toBe("manual")
  })

  it("shows title error when empty", async () => {
    const wrapper = mount(TaskCreateForm)
    await wrapper.find("[data-testid='btn-submit']").trigger("submit")
    expect(wrapper.text()).toContain("Title is required")
    expect(wrapper.emitted("submit")).toBeUndefined()
  })

  it("emits cancel on cancel click", async () => {
    const wrapper = mount(TaskCreateForm)
    await wrapper.find("[data-testid='btn-cancel']").trigger("click")
    expect(wrapper.emitted("cancel")).toHaveLength(1)
  })

  it("applies suggested complexity when prop changes", async () => {
    const wrapper = mount(TaskCreateForm)
    await wrapper.setProps({ suggestedComplexity: "medium" })
    expect((wrapper.find("[data-testid='input-complexity']").element as HTMLSelectElement).value).toBe("medium")
  })
})
