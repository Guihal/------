import { canTransitionTo } from "../../domain/task/invariants";
import type { Task } from "../../domain/task/types";
import type { UnitOfWorkPort } from "../../ports/unit-of-work.port";
import { grantTaskXpWithinTransaction } from "./grant-task-xp.use-case";

export type CompleteTaskInput = {
	readonly taskId: string;
	readonly profileId: string;
	readonly now: string;
};

export type CompleteTaskResult = {
	readonly task: Task;
	readonly xpGranted: number;
	readonly previousLevel: number;
	readonly newLevel: number;
	readonly didLevelUp: boolean;
	readonly xpToNextLevel: number;
};

export async function completeTask(
	uow: UnitOfWorkPort,
	input: CompleteTaskInput,
): Promise<CompleteTaskResult> {
	return uow.run(async () => {
		const task = await uow.tasks.findById(input.profileId, input.taskId);
		if (task === null) {
			throw new Error(`task not found: ${input.taskId}`);
		}

		if (task.profileId !== input.profileId) {
			throw new Error("task does not belong to profile");
		}

		// Idempotency guard: already completed → no-op
		if (task.status === "completed") {
			const progression = await uow.progressions.findById(input.profileId);
			const currentLevel = progression?.totalXp
				? Math.floor(progression.totalXp / 1000)
				: 0;
			const progress = progression?.totalXp ? progression.totalXp % 1000 : 0;

			return {
				task,
				xpGranted: 0,
				previousLevel: currentLevel,
				newLevel: currentLevel,
				didLevelUp: false,
				xpToNextLevel: 1000 - progress,
			};
		}

		const transition = canTransitionTo(task, "completed");
		if (!transition.ok) {
			throw new Error(`invalid transition: ${transition.error.kind}`);
		}

		const completedTask: Task = {
			...task,
			status: "completed",
			updatedAt: input.now,
			completedAt: input.now,
		};

		await uow.tasks.save(completedTask);

		const xpResult = await grantTaskXpWithinTransaction(uow, {
			profileId: input.profileId,
			complexity: task.complexity,
			priority: task.priority,
			now: input.now,
		});

		return {
			task: completedTask,
			xpGranted: xpResult.xpGranted,
			previousLevel: xpResult.previousLevel,
			newLevel: xpResult.newLevel,
			didLevelUp: xpResult.didLevelUp,
			xpToNextLevel: xpResult.xpToNextLevel,
		};
	});
}
