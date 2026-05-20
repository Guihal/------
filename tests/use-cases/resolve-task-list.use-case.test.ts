import { describe, expect, it } from "vitest";
import type { Task } from "../../core/domain/task/types";
import { resolveTaskList } from "../../core/use-cases/resolve-task-list.use-case";

function makeTask(
	overrides: Partial<Task> & Pick<Task, "id" | "status" | "dueAt">,
): Task {
	return {
		id: overrides.id,
		profileId: "p1",
		title: "Task",
		description: null,
		status: overrides.status,
		priority: overrides.priority ?? "normal",
		complexity: "small",
		complexitySource: "suggested",
		dueAt: overrides.dueAt,
		createdAt: overrides.createdAt ?? "2026-05-01T00:00:00Z",
		updatedAt: "2026-05-01T00:00:00Z",
		completedAt: null,
		archivedAt: null,
	};
}

describe("resolveTaskList", () => {
	const now = "2026-05-15T12:00:00Z";

	it("groups overdue active tasks", () => {
		const tasks: Task[] = [
			makeTask({ id: "t1", status: "active", dueAt: "2026-05-10T00:00:00Z" }),
		];
		const result = resolveTaskList(tasks, now);
		expect(result.overdue.map((t) => t.id)).toEqual(["t1"]);
		expect(result.upcoming).toHaveLength(0);
		expect(result.noDeadline).toHaveLength(0);
		expect(result.completed).toHaveLength(0);
	});

	it("groups upcoming active tasks", () => {
		const tasks: Task[] = [
			makeTask({ id: "t1", status: "active", dueAt: "2026-05-20T00:00:00Z" }),
		];
		const result = resolveTaskList(tasks, now);
		expect(result.overdue).toHaveLength(0);
		expect(result.upcoming.map((t) => t.id)).toEqual(["t1"]);
		expect(result.noDeadline).toHaveLength(0);
		expect(result.completed).toHaveLength(0);
	});

	it("groups no-deadline active tasks", () => {
		const tasks: Task[] = [
			makeTask({ id: "t1", status: "active", dueAt: null }),
		];
		const result = resolveTaskList(tasks, now);
		expect(result.overdue).toHaveLength(0);
		expect(result.upcoming).toHaveLength(0);
		expect(result.noDeadline.map((t) => t.id)).toEqual(["t1"]);
		expect(result.completed).toHaveLength(0);
	});

	it("groups completed tasks", () => {
		const tasks: Task[] = [
			makeTask({ id: "t1", status: "completed", dueAt: null }),
		];
		const result = resolveTaskList(tasks, now);
		expect(result.overdue).toHaveLength(0);
		expect(result.upcoming).toHaveLength(0);
		expect(result.noDeadline).toHaveLength(0);
		expect(result.completed.map((t) => t.id)).toEqual(["t1"]);
	});

	it("sorts by priority: high first", () => {
		const tasks: Task[] = [
			makeTask({
				id: "t1",
				status: "active",
				dueAt: "2026-05-20T00:00:00Z",
				priority: "normal",
			}),
			makeTask({
				id: "t2",
				status: "active",
				dueAt: "2026-05-20T00:00:00Z",
				priority: "high",
			}),
			makeTask({
				id: "t3",
				status: "active",
				dueAt: "2026-05-20T00:00:00Z",
				priority: "low",
			}),
		];
		const result = resolveTaskList(tasks, now);
		expect(result.upcoming.map((t) => t.id)).toEqual(["t2", "t1", "t3"]);
	});

	it("sorts by dueAt within same priority", () => {
		const tasks: Task[] = [
			makeTask({ id: "t1", status: "active", dueAt: "2026-05-25T00:00:00Z" }),
			makeTask({ id: "t2", status: "active", dueAt: "2026-05-18T00:00:00Z" }),
		];
		const result = resolveTaskList(tasks, now);
		expect(result.upcoming.map((t) => t.id)).toEqual(["t2", "t1"]);
	});

	it("sorts no-deadline by createdAt desc", () => {
		const tasks: Task[] = [
			makeTask({
				id: "t1",
				status: "active",
				dueAt: null,
				createdAt: "2026-05-01T00:00:00Z",
			}),
			makeTask({
				id: "t2",
				status: "active",
				dueAt: null,
				createdAt: "2026-05-10T00:00:00Z",
			}),
		];
		const result = resolveTaskList(tasks, now);
		expect(result.noDeadline.map((t) => t.id)).toEqual(["t2", "t1"]);
	});

	it("ignores archived tasks", () => {
		const tasks: Task[] = [
			makeTask({ id: "t1", status: "archived", dueAt: null }),
		];
		const result = resolveTaskList(tasks, now);
		expect(result.overdue).toHaveLength(0);
		expect(result.upcoming).toHaveLength(0);
		expect(result.noDeadline).toHaveLength(0);
		expect(result.completed).toHaveLength(0);
	});
});
