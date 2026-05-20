import { describe, expect, it } from "vitest";
import type { Task } from "../../../core/domain/task/types";
import type { TaskRepositoryPort } from "../../../core/ports/task-repository.port";
import { archiveTask } from "../../../core/use-cases/tasks/archive-task.use-case";

function makeInMemoryTaskRepo(): TaskRepositoryPort & {
	readonly tasks: Task[];
} {
	const tasks: Task[] = [];
	return {
		get tasks() {
			return tasks;
		},
		async findById(_profileId: string, id: string) {
			return tasks.find((t) => t.id === id) ?? null;
		},
		async findAll(profileId: string) {
			return tasks.filter((t) => t.profileId === profileId);
		},
		async save(task: Task) {
			const idx = tasks.findIndex((t) => t.id === task.id);
			if (idx >= 0) tasks[idx] = task;
			else tasks.push(task);
		},
		async delete(_profileId: string, id: string) {
			const idx = tasks.findIndex((t) => t.id === id);
			if (idx >= 0) tasks.splice(idx, 1);
		},
	};
}

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

describe("archiveTask", () => {
	it("soft-deletes active task (status → archived)", async () => {
		const repo = makeInMemoryTaskRepo();
		const task = makeTask({ id: "t1", status: "active" });
		await repo.save(task);

		const result = await archiveTask(repo, {
			taskId: "t1",
			profileId: "p1",
			now: "2026-05-10T00:00:00Z",
		});

		expect(result.task.status).toBe("archived");
		expect(result.task.archivedAt).toBe("2026-05-10T00:00:00Z");
		expect(result.task.updatedAt).toBe("2026-05-10T00:00:00Z");

		const saved = await repo.findById("p1", "t1");
		expect(saved?.status).toBe("archived");
		expect(saved?.archivedAt).toBe("2026-05-10T00:00:00Z");
	});

	it("rejects archiving already archived task", async () => {
		const repo = makeInMemoryTaskRepo();
		const task = makeTask({
			id: "t1",
			status: "archived",
			archivedAt: "2026-05-01T00:00:00Z",
		});
		await repo.save(task);

		await expect(
			archiveTask(repo, {
				taskId: "t1",
				profileId: "p1",
				now: "2026-05-10T00:00:00Z",
			}),
		).rejects.toThrow("invalid transition: already_archived");
	});

	it("rejects archiving completed task", async () => {
		const repo = makeInMemoryTaskRepo();
		const task = makeTask({
			id: "t1",
			status: "completed",
			completedAt: "2026-05-05T00:00:00Z",
		});
		await repo.save(task);

		await expect(
			archiveTask(repo, {
				taskId: "t1",
				profileId: "p1",
				now: "2026-05-10T00:00:00Z",
			}),
		).rejects.toThrow("invalid transition: already_completed");
	});

	it("throws when task not found", async () => {
		const repo = makeInMemoryTaskRepo();

		await expect(
			archiveTask(repo, {
				taskId: "missing",
				profileId: "p1",
				now: "2026-05-10T00:00:00Z",
			}),
		).rejects.toThrow("task not found: missing");
	});

	it("throws when task belongs to different profile", async () => {
		const repo = makeInMemoryTaskRepo();
		const task = makeTask({ id: "t1", status: "active", profileId: "p1" });
		await repo.save(task);

		await expect(
			archiveTask(repo, {
				taskId: "t1",
				profileId: "p2",
				now: "2026-05-10T00:00:00Z",
			}),
		).rejects.toThrow("task does not belong to profile");
	});
});
