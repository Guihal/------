import { describe, expect, it } from "vitest";
import type { Progression } from "../../../core/domain/progression/types";
import type { Task } from "../../../core/domain/task/types";
import type { UnitOfWorkPort } from "../../../core/ports/unit-of-work.port";
import { completeTask } from "../../../core/use-cases/tasks/complete-task.use-case";

function makeTask(
	overrides: Partial<Task> & Pick<Task, "id" | "status">,
): Task {
	return {
		id: overrides.id,
		profileId: overrides.profileId ?? "p1",
		title: overrides.title ?? "Task",
		description: overrides.description ?? null,
		status: overrides.status,
		priority: overrides.priority ?? "normal",
		complexity: overrides.complexity ?? "small",
		complexitySource: "suggested",
		dueAt: overrides.dueAt ?? null,
		createdAt: overrides.createdAt ?? "2026-05-01T00:00:00Z",
		updatedAt: overrides.updatedAt ?? "2026-05-01T00:00:00Z",
		completedAt: overrides.completedAt ?? null,
		archivedAt: overrides.archivedAt ?? null,
	};
}

describe("completeTask rollback", () => {
	it("throws on failure inside transaction", async () => {
		const task = makeTask({ id: "t1", status: "active" });
		const progression: Progression = {
			profileId: "p1",
			totalXp: 100,
			updatedAt: "2026-05-01T00:00:00Z",
		};

		const uow: UnitOfWorkPort = {
			tasks: {
				async findById() {
					return task;
				},
				async findAll() {
					return [task];
				},
				async save() {
					/* no-op */
				},
				async delete() {
					/* no-op */
				},
			},
			profiles: {
				async findById() {
					return null;
				},
				async save() {
					/* no-op */
				},
			},
			progressions: {
				async findById() {
					return progression;
				},
				async save() {
					throw new Error("db failure");
				},
			},
			async run<T>(callback: () => Promise<T>): Promise<T> {
				return callback();
			},
		};

		await expect(
			completeTask(uow, {
				taskId: "t1",
				profileId: "p1",
				now: "2026-05-10T00:00:00Z",
			}),
		).rejects.toThrow("db failure");
	});
});
