import { describe, it, expect } from "vitest"
import { defineComponent, h } from "vue"
import { mount } from "@vue/test-utils"

const EmptyState = defineComponent({
  props: ["title", "description", "icon"],
  setup(props) {
    return () =>
      h("div", { class: "empty-state", "data-testid": "empty-state" }, [
        h("div", { class: "empty-icon" }, props.icon ?? "📭"),
        h("h3", { class: "empty-title" }, props.title),
        props.description ? h("p", { class: "empty-description" }, props.description) : null,
      ])
  },
})

describe("EmptyState", () => {
  it("renders title", () => {
    const wrapper = mount(EmptyState, { props: { title: "No tasks" } })
    expect(wrapper.text()).toContain("No tasks")
  })

  it("renders default icon", () => {
    const wrapper = mount(EmptyState, { props: { title: "No tasks" } })
    expect(wrapper.find(".empty-icon").text()).toBe("📭")
  })

  it("renders custom icon", () => {
    const wrapper = mount(EmptyState, { props: { title: "No tasks", icon: "🎒" } })
    expect(wrapper.find(".empty-icon").text()).toBe("🎒")
  })

  it("renders description when provided", () => {
    const wrapper = mount(EmptyState, {
      props: { title: "No tasks", description: "Add one to get started" },
    })
    expect(wrapper.text()).toContain("Add one to get started")
  })

  it("does not render description node when omitted", () => {
    const wrapper = mount(EmptyState, { props: { title: "No tasks" } })
    expect(wrapper.find(".empty-description").exists()).toBe(false)
  })
})
