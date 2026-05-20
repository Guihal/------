import type { Progression } from "../../core/domain/progression/types";
import type { Task, TaskComplexity } from "../../core/domain/task/types";
import type { ClockPort } from "../../core/ports/clock.port";
import type { IdGeneratorPort } from "../../core/ports/id-generator.port";
import type { ProfileRepositoryPort } from "../../core/ports/profile-repository.port";
import type { ProgressionRepositoryPort } from "../../core/ports/progression-repository.port";
import type { RandomPort } from "../../core/ports/random.port";
import type { TaskRepositoryPort } from "../../core/ports/task-repository.port";
import type { UnitOfWorkPort } from "../../core/ports/unit-of-work.port";
import type { LevelProgressResult } from "../../core/use-cases/apply-level-progress.use-case";
import type { TaskListGroups } from "../../core/use-cases/resolve-task-list.use-case";
import type { SuggestTaskComplexityInput } from "../../core/use-cases/suggest-task-complexity.use-case";
import type {
	ArchiveTaskInput,
	ArchiveTaskResult,
} from "../../core/use-cases/tasks/archive-task.use-case";
import type {
	CompleteTaskInput,
	CompleteTaskResult,
} from "../../core/use-cases/tasks/complete-task.use-case";
import type {
	CreateTaskInput,
	CreateTaskResult,
} from "../../core/use-cases/tasks/create-task.use-case";
import type {
	GrantTaskXpInput,
	GrantTaskXpResult,
} from "../../core/use-cases/tasks/grant-task-xp.use-case";

export interface AppDependencies {
	readonly ports: {
		readonly clock: ClockPort;
		readonly idGenerator: IdGeneratorPort;
		readonly random?: RandomPort;
		readonly taskRepository: TaskRepositoryPort;
		readonly profileRepository: ProfileRepositoryPort;
		readonly progressionRepository: ProgressionRepositoryPort;
		readonly unitOfWork: UnitOfWorkPort;
	};
	readonly useCases: {
		readonly createTask: (input: CreateTaskInput) => Promise<CreateTaskResult>;
		readonly completeTask: (
			input: CompleteTaskInput,
		) => Promise<CompleteTaskResult>;
		readonly archiveTask: (
			input: ArchiveTaskInput,
		) => Promise<ArchiveTaskResult>;
		readonly grantTaskXp: (
			input: GrantTaskXpInput,
		) => Promise<GrantTaskXpResult>;
		readonly applyLevelProgress: (
			current: Progression,
			xpDelta: number,
			now: string,
		) => LevelProgressResult;
		readonly resolveTaskList: (
			tasks: readonly Task[],
			now: string,
		) => TaskListGroups;
		readonly suggestTaskComplexity: (
			input: SuggestTaskComplexityInput,
		) => TaskComplexity;
	};
}
