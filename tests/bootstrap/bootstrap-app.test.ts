import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClockPort } from "../../core/ports/clock.port";
import type { IdGeneratorPort } from "../../core/ports/id-generator.port";
import type { RandomPort } from "../../core/ports/random.port";
import type { Profile } from "../../core/domain/profile/types";
import type { Progression } from "../../core/domain/progression/types";
import type { Task } from "../../core/domain/task/types";
import type { ProfileRepositoryPort } from "../../core/ports/profile-repository.port";
import type { ProgressionRepositoryPort } from "../../core/ports/progression-repository.port";
import type { TaskRepositoryPort } from "../../core/ports/task-repository.port";
import type { UnitOfWorkPort } from "../../core/ports/unit-of-work.port";
import type { AppDependencies } from "../../infrastructure/di/app-dependencies";
import { bootstrapApp } from "../../src/bootstrap/bootstrap-app";

function makeDeps(overrides?: {
	profile?: Profile | null;
	progression?: Progression | null;
	tasks?: readonly Task[];
}): AppDependencies {
	const profile = overrides?.profile ?? null;
	const progression = overrides?.progression ?? null;
	const tasks = overrides?.tasks ?? [];

	const profileRepo: ProfileRepositoryPort = {
		findById: vi.fn().mockResolvedValue(profile),
		save: vi.fn().mockResolvedValue(undefined),
	};

	const progressionRepo: ProgressionRepositoryPort = {
		findById: vi.fn().mockResolvedValue(progression),
		save: vi.fn().mockResolvedValue(undefined),
	};

	const taskRepo: TaskRepositoryPort = {
		findById: vi.fn().mockResolvedValue(null),
		findAll: vi.fn().mockResolvedValue(tasks),
		save: vi.fn().mockResolvedValue(undefined),
		delete: vi.fn().mockResolvedValue(undefined),
	};

	const uow: UnitOfWorkPort = {
		tasks: taskRepo,
		profiles: profileRepo,
		progressions: progressionRepo,
		run: vi.fn(async (cb) => cb()),
	};

	const clock: ClockPort = {
		nowIso: vi.fn().mockReturnValue("2026-05-20T00:00:00Z"),
	};

	const idGenerator: IdGeneratorPort = {
		generateId: vi.fn().mockReturnValue("test-id"),
	};

	const random: RandomPort = {
		random: vi.fn().mockReturnValue(0.5),
	};

	return {
		ports: {
			clock,
			idGenerator,
			random,
			taskRepository: taskRepo,
			profileRepository: profileRepo,
			progressionRepository: progressionRepo,
			unitOfWork: uow,
		},
		useCases: {} as unknown as AppDependencies["useCases"],
	};
}

describe("bootstrapApp", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("creates default profile when none exists", async () => {
		const deps = makeDeps();
		const result = await bootstrapApp(() => Promise.resolve(deps));

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.state.profile.id).toBe("default");
		expect(result.state.profile.name).toBe("User");
		expect(deps.ports.profileRepository.save).toHaveBeenCalledTimes(1);
	});

	it("reuses existing profile", async () => {
		const existing: Profile = {
			id: "default",
			name: "Alice",
			createdAt: "2025-01-01T00:00:00Z",
			updatedAt: "2025-01-01T00:00:00Z",
		};
		const deps = makeDeps({ profile: existing });
		const result = await bootstrapApp(() => Promise.resolve(deps));

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.state.profile).toEqual(existing);
		expect(deps.ports.profileRepository.save).not.toHaveBeenCalled();
	});

	it("creates progression when none exists", async () => {
		const deps = makeDeps();
		const result = await bootstrapApp(() => Promise.resolve(deps));

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.state.progression.profileId).toBe("default");
		expect(result.state.progression.totalXp).toBe(0);
		expect(deps.ports.progressionRepository.save).toHaveBeenCalledTimes(1);
	});

	it("reuses existing progression", async () => {
		const existing: Progression = {
			profileId: "default",
			totalXp: 1500,
			updatedAt: "2025-01-01T00:00:00Z",
		};
		const deps = makeDeps({ progression: existing });
		const result = await bootstrapApp(() => Promise.resolve(deps));

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.state.progression).toEqual(existing);
		expect(deps.ports.progressionRepository.save).not.toHaveBeenCalled();
	});

	it("loads tasks into state", async () => {
		const taskList: readonly Task[] = [
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
