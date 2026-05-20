import { vi } from "vitest";
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

export function makeDeps(overrides?: {
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
