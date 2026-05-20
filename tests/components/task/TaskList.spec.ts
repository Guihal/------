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

const TaskCard = defineComponent({
	props: ["task"],
	emits: ["complete", "archive"],
	setup(props, { emit: _emit }) {
		return () =>
			h("div", { class: "task-card", "data-testid": "task-card" }, [
				h("h3", { class: "task-title" }, props.task.title),
			]);
	},
});

const TaskList = defineComponent({
	props: ["title", "tasks", "emptyText"],
	emits: ["complete", "archive"],
	setup(props, { emit }) {
		const testId = `group-${props.title.toLowerCase().replace(/\s+/g, "-")}`;
		return () =>
			h("section", { class: "task-group", "data-testid": testId }, [
				h(
					"h2",
					{ class: "group-title" },
					`${props.title} (${props.tasks.length})`,
				),
				props.tasks.length === 0
					? h("div", { class: "group-empty" }, props.emptyText)
					: h(
							"div",
							{ class: "group-list" },
							props.tasks.map((task: Task) =>
								h(TaskCard, {
									key: task.id,
									task,
									onComplete: (id: string) => emit("complete", id),
									onArchive: (id: string) => emit("archive", id),
								}),
							),
						),
			]);
	},
});

describe("TaskList", () => {
	it("renders group title with count", () => {
		const wrapper = mount(TaskList, {
			props: { title: "Upcoming", tasks: [makeTask()], emptyText: "Empty" },
		});
		expect(wrapper.text()).toContain("Upcoming (1)");
	});

	it("shows empty text when no tasks", () => {
		const wrapper = mount(TaskList, {
			props: { title: "Overdue", tasks: [], emptyText: "Nothing here" },
		});
		expect(wrapper.text()).toContain("Nothing here");
		expect(wrapper.find("[data-testid='group-overdue']").exists()).toBe(true);
	});

	it("renders task cards for each task", () => {
		const tasks = [
			makeTask({ id: "t1", title: "A" }),
			makeTask({ id: "t2", title: "B" }),
		];
		const wrapper = mount(TaskList, {
			props: { title: "No Deadline", tasks, emptyText: "Empty" },
		});
		expect(wrapper.findAll("[data-testid='task-card']")).toHaveLength(2);
	});
});
