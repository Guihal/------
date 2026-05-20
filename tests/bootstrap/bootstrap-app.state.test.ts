import { beforeEach, describe, expect, it } from "vitest";
import { bootstrapApp } from "../../core/use-cases/app/bootstrap-app.use-case";
import { makeDeps } from "./bootstrap-app.fixtures";

describe("bootstrapApp state + error", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("loads tasks into state", async () => {
		const taskList = [
			{
				id: "t1",
				profileId: "default",
				title: "Task 1",
				description: null,
				status: "active",
				priority: "normal",
				complexity: "small",
				complexitySource: "suggested",
				dueAt: null,
				createdAt: "2026-05-19T12:00:00Z",
				updatedAt: "2026-05-19T12:00:00Z",
				completedAt: null,
				archivedAt: null,
			},
		];
		const deps = makeDeps({ tasks: taskList });
		const result = await bootstrapApp(() => Promise.resolve(deps));

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.state.tasks).toEqual(taskList);
		expect(deps.ports.taskRepository.findAll).toHaveBeenCalledWith("default");
	});

	it("is idempotent — repeated call does not duplicate", async () => {
		const deps1 = makeDeps();
		const deps2 = makeDeps();
		const r1 = await bootstrapApp(() => Promise.resolve(deps1));
		const r2 = await bootstrapApp(() => Promise.resolve(deps2));

		expect(r1.ok).toBe(true);
		expect(r2.ok).toBe(true);
		if (!r1.ok || !r2.ok) return;

		expect(r1.state.profile.id).toBe(r2.state.profile.id);
		expect(deps1.ports.profileRepository.save).toHaveBeenCalledTimes(1);
		expect(deps1.ports.progressionRepository.save).toHaveBeenCalledTimes(1);
		expect(deps2.ports.profileRepository.save).toHaveBeenCalledTimes(1);
		expect(deps2.ports.progressionRepository.save).toHaveBeenCalledTimes(1);
	});

	it("returns error when dependency bootstrap fails", async () => {
		const result = await bootstrapApp(() =>
			Promise.reject(new Error("db down")),
		);

		expect(result.ok).toBe(false);
		if (result.ok) return;

		expect(result.error).toContain("db down");
	});
});
