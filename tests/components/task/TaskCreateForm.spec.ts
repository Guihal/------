import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { defineComponent, h, ref, watch } from "vue";
import type { TaskPriority } from "../../../core/domain/task/types";

const TaskCreateForm = defineComponent({
	props: ["suggestedComplexity"],
	emits: ["submit", "cancel"],
	setup(props, { emit }) {
		const title = ref("");
		const description = ref("");
		const priority = ref<TaskPriority>("normal");
		const dueAt = ref("");
		const complexity = ref<"tiny" | "small" | "medium" | "large">("small");
		const complexitySource = ref<"suggested" | "manual">("manual");
		const titleError = ref("");

		watch(
			() => props.suggestedComplexity,
			(val: "tiny" | "small" | "medium" | "large" | null | undefined) => {
				if (val) {
					complexity.value = val;
					complexitySource.value = "suggested";
				}
			},
		);

		function handleSubmit() {
			titleError.value = "";
			if (title.value.trim().length === 0) {
				titleError.value = "Title is required";
				return;
			}
			emit("submit", {
				title: title.value.trim(),
				description: description.value.trim() || null,
				priority: priority.value,
				dueAt: dueAt.value || null,
				complexity: complexity.value,
				complexitySource: complexitySource.value,
			});
			title.value = "";
			description.value = "";
			priority.value = "normal";
			dueAt.value = "";
			complexity.value = "small";
			complexitySource.value = "manual";
		}

		return () =>
			h(
				"form",
				{
					class: "create-form",
					"data-testid": "create-task-form",
					onSubmit: (e: Event) => {
						e.preventDefault();
						handleSubmit();
					},
				},
				[
					h("h2", { class: "form-title" }, "New Task"),
					h("div", { class: "field" }, [
						h("label", { for: "task-title" }, "Title *"),
						h("input", {
							id: "task-title",
							type: "text",
							"data-testid": "input-title",
							value: title.value,
							onInput: (e: Event) => {
								title.value = (e.target as HTMLInputElement).value;
							},
						}),
						titleError.value
							? h("span", { class: "error" }, titleError.value)
							: null,
					]),
					h("div", { class: "field" }, [
						h("label", { for: "task-desc" }, "Description"),
						h("textarea", {
							id: "task-desc",
							rows: 3,
							"data-testid": "input-description",
							value: description.value,
							onInput: (e: Event) => {
								description.value = (e.target as HTMLTextAreaElement).value;
							},
						}),
					]),
					h("div", { class: "field" }, [
						h("label", { for: "task-priority" }, "Priority"),
						h(
							"select",
							{
								id: "task-priority",
								"data-testid": "input-priority",
								value: priority.value,
								onChange: (e: Event) => {
									priority.value = (e.target as HTMLSelectElement)
										.value as TaskPriority;
								},
							},
							[
								h("option", { value: "low" }, "Low"),
								h("option", { value: "normal" }, "Normal"),
								h("option", { value: "high" }, "High"),
							],
						),
					]),
					h("div", { class: "field" }, [
						h("label", { for: "task-due" }, "Due date"),
						h("input", {
							id: "task-due",
							type: "date",
							"data-testid": "input-due",
							value: dueAt.value,
							onInput: (e: Event) => {
								dueAt.value = (e.target as HTMLInputElement).value;
							},
						}),
					]),
					h("div", { class: "field" }, [
						h("label", { for: "task-complexity" }, "Complexity"),
						h(
							"select",
							{
								id: "task-complexity",
								"data-testid": "input-complexity",
								value: complexity.value,
								onChange: (e: Event) => {
									complexity.value = (e.target as HTMLSelectElement).value as
										| "tiny"
										| "small"
										| "medium"
										| "large";
								},
							},
							[
								h("option", { value: "tiny" }, "Tiny"),
								h("option", { value: "small" }, "Small"),
								h("option", { value: "medium" }, "Medium"),
								h("option", { value: "large" }, "Large"),
							],
						),
						complexitySource.value === "suggested"
							? h("span", { class: "badge-suggested" }, "Suggested")
							: null,
					]),
					h("div", { class: "form-actions" }, [
						h(
							"button",
							{
								type: "submit",
								class: "btn-primary",
								"data-testid": "btn-submit",
							},
							"Create",
						),
						h(
							"button",
							{
								type: "button",
								class: "btn-secondary",
								"data-testid": "btn-cancel",
								onClick: () => emit("cancel"),
							},
							"Cancel",
						),
					]),
				],
			);
	},
});

describe("TaskCreateForm", () => {
	it("renders form fields", () => {
		const wrapper = mount(TaskCreateForm);
		expect(wrapper.find("[data-testid='input-title']").exists()).toBe(true);
		expect(wrapper.find("[data-testid='input-description']").exists()).toBe(
			true,
		);
		expect(wrapper.find("[data-testid='input-priority']").exists()).toBe(true);
		expect(wrapper.find("[data-testid='input-due']").exists()).toBe(true);
		expect(wrapper.find("[data-testid='input-complexity']").exists()).toBe(
			true,
		);
	});

	it("emits submit with correct data", async () => {
		const wrapper = mount(TaskCreateForm);
		await wrapper.find("[data-testid='input-title']").setValue("My task");
		await wrapper.find("[data-testid='input-description']").setValue("Details");
		await wrapper.find("[data-testid='input-priority']").setValue("high");
		await wrapper.find("[data-testid='input-due']").setValue("2026-06-01");
		await wrapper.find("[data-testid='input-complexity']").setValue("large");
		await wrapper.find("[data-testid='btn-submit']").trigger("submit");

		expect(wrapper.emitted("submit")).toHaveLength(1);
		const payload = wrapper.emitted("submit")?.[0][0] as {
			title: string;
			description: string | null;
			priority: string;
			dueAt: string | null;
			complexity: string;
			complexitySource: string;
		};
		expect(payload.title).toBe("My task");
		expect(payload.description).toBe("Details");
		expect(payload.priority).toBe("high");
		expect(payload.dueAt).toBe("2026-06-01");
		expect(payload.complexity).toBe("large");
		expect(payload.complexitySource).toBe("manual");
	});

	it("shows title error when empty", async () => {
		const wrapper = mount(TaskCreateForm);
		await wrapper.find("[data-testid='btn-submit']").trigger("submit");
		expect(wrapper.text()).toContain("Title is required");
		expect(wrapper.emitted("submit")).toBeUndefined();
	});

	it("emits cancel on cancel click", async () => {
		const wrapper = mount(TaskCreateForm);
		await wrapper.find("[data-testid='btn-cancel']").trigger("click");
		expect(wrapper.emitted("cancel")).toHaveLength(1);
	});

	it("applies suggested complexity when prop changes", async () => {
		const wrapper = mount(TaskCreateForm);
		await wrapper.setProps({ suggestedComplexity: "medium" });
		expect(
			(
				wrapper.find("[data-testid='input-complexity']")
					.element as HTMLSelectElement
			).value,
		).toBe("medium");
	});
});
