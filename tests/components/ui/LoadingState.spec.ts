import { describe, it, expect } from "vitest"
import { defineComponent, h } from "vue"
import { mount } from "@vue/test-utils"

const LoadingState = defineComponent({
  props: ["message"],
  setup(props) {
    return () =>
      h("div", { class: "loading-state", "data-testid": "loading-state" }, [
        h("div", { class: "loading-spinner", "aria-hidden": "true" }),
        h("span", { class: "loading-text" }, props.message ?? "Loading…"),
      ])
  },
})

describe("LoadingState", () => {
  it("renders default message", () => {
    const wrapper = mount(LoadingState, {})
    expect(wrapper.text()).toContain("Loading…")
  })

  it("renders custom message", () => {
    const wrapper = mount(LoadingState, { props: { message: "Fetching tasks…" } })
    expect(wrapper.text()).toContain("Fetching tasks…")
  })

  it("has spinner element", () => {
    const wrapper = mount(LoadingState, {})
    expect(wrapper.find(".loading-spinner").exists()).toBe(true)
  })
})
