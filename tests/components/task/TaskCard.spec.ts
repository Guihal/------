import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { defineComponent, h } from "vue";
import type { Task } from "../../../core/domain/task/types";

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
	};
}

function formatDate(iso: string | null): string {
	if (!iso) return "";
	const d = new Date(iso);
	return d.toLocaleDateString("en-US");
}

const priorityClass: Record<Task["priority"], string> = {
	low: "priority-low",
	normal: "priority-normal",
	high: "priority-high",
};

const TaskCard = defineComponent({
	props: ["task"],
	emits: ["complete", "archive"],
	setup(props, { emit }) {
		return () =>
			h("div", { class: "task-card", "data-testid": "task-card" }, [
				h("div", { class: "task-header" }, [
					h("h3", { class: "task-title" }, props.task.title),
					h(
						"span",
						{ class: ["task-priority", priorityClass[props.task.priority]] },
						props.task.priority,
					),
				]),
				h("div", { class: "task-meta" }, [
					h("span", { class: "task-complexity" }, props.task.complexity),
					props.task.dueAt
						? h(
								"span",
								{ class: "task-deadline" },
								formatDate(props.task.dueAt),
							)
						: null,
				]),
				props.task.description
					? h("div", { class: "task-description" }, props.task.description)
					: null,
				props.task.status === "active"
					? h("div", { class: "task-actions" }, [
							h(
								"button",
								{
									class: "btn-complete",
									"data-testid": "btn-complete",
									onClick: () => emit("complete", props.task.id),
								},
								"Complete",
							),
							h(
								"button",
								{
									class: "btn-archive",
									"data-testid": "btn-archive",
									onClick: () => emit("archive", props.task.id),
								},
								"Archive",
							),
						])
					: null,
			]);
	},
});

describe("TaskCard", () => {
	it("renders title", () => {
		const wrapper = mount(TaskCard, { props: { task: makeTask() } });
		expect(wrapper.text()).toContain("Test task");
	});

	it("renders priority badge", () => {
		const wrapper = mount(TaskCard, {
			props: { task: makeTask({ priority: "high" }) },
		});
		expect(wrapper.text()).toContain("high");
	});

	it("renders complexity", () => {
		const wrapper = mount(TaskCard, {
			props: { task: makeTask({ complexity: "large" }) },
		});
		expect(wrapper.text()).toContain("large");
	});

	it("renders deadline when present", () => {
		const wrapper = mount(TaskCard, {
			props: { task: makeTask({ dueAt: "2026-06-01T00:00:00Z" }) },
		});
		expect(wrapper.text()).toContain("6/1/2026");
	});

	it("shows complete and archive buttons for active task", () => {
		const wrapper = mount(TaskCard, {
			props: { task: makeTask({ status: "active" }) },
		});
		expect(wrapper.find('[data-testid="btn-complete"]').exists()).toBe(true);
		expect(wrapper.find('[data-testid="btn-archive"]').exists()).toBe(true);
	});

	it("hides action buttons for completed task", () => {
		const wrapper = mount(TaskCard, {
			props: { task: makeTask({ status: "completed" }) },
		});
		expect(wrapper.find('[data-testid="btn-complete"]').exists()).toBe(false);
		expect(wrapper.find('[data-testid="btn-archive"]').exists()).toBe(false);
	});

	it("emits complete on click", async () => {
		const wrapper = mount(TaskCard, { props: { task: makeTask() } });
		await wrapper.find('[data-testid="btn-complete"]').trigger("click");
		expect(wrapper.emitted("complete")).toHaveLength(1);
		expect(wrapper.emitted("complete")?.[0]).toEqual(["t1"]);
	});

	it("emits archive on click", async () => {
		const wrapper = mount(TaskCard, { props: { task: makeTask() } });
		await wrapper.find('[data-testid="btn-archive"]').trigger("click");
		expect(wrapper.emitted("archive")).toHaveLength(1);
		expect(wrapper.emitted("archive")?.[0]).toEqual(["t1"]);
	});
});
