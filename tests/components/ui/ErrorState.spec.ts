import { describe, it, expect } from "vitest"
import { defineComponent, h } from "vue"
import { mount } from "@vue/test-utils"

const ErrorState = defineComponent({
  props: ["title", "message", "retryLabel"],
  emits: ["retry"],
  setup(props, { emit }) {
    return () =>
      h("div", { class: "error-state", "data-testid": "error-state" }, [
        h("div", { class: "error-icon", "aria-hidden": "true" }, "⚠️"),
        h("h3", { class: "error-title" }, props.title ?? "Something went wrong"),
        props.message ? h("p", { class: "error-message" }, props.message) : null,
        props.retryLabel
          ? h(
              "button",
              { class: "error-retry", "data-testid": "error-retry", onClick: () => emit("retry") },
              props.retryLabel
            )
          : null,
      ])
  },
})

describe("ErrorState", () => {
  it("renders default title", () => {
    const wrapper = mount(ErrorState, {})
    expect(wrapper.text()).toContain("Something went wrong")
  })

  it("renders custom title", () => {
    const wrapper = mount(ErrorState, { props: { title: "Network error" } })
    expect(wrapper.text()).toContain("Network error")
  })

  it("renders message when provided", () => {
    const wrapper = mount(ErrorState, { props: { message: "Try again later" } })
    expect(wrapper.text()).toContain("Try again later")
  })

  it("does not render retry button when retryLabel omitted", () => {
    const wrapper = mount(ErrorState, {})
    expect(wrapper.find('[data-testid="error-retry"]').exists()).toBe(false)
  })

  it("renders retry button when retryLabel provided", () => {
    const wrapper = mount(ErrorState, { props: { retryLabel: "Retry" } })
    expect(wrapper.find('[data-testid="error-retry"]').exists()).toBe(true)
    expect(wrapper.text()).toContain("Retry")
  })

  it("emits retry on click", async () => {
    const wrapper = mount(ErrorState, { props: { retryLabel: "Retry" } })
    await wrapper.find('[data-testid="error-retry"]').trigger("click")
    expect(wrapper.emitted("retry")).toHaveLength(1)
  })
})
