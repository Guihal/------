import {
	computeLevel,
	computeProgress,
	XP_PER_LEVEL,
} from "../domain/progression/compute";
import type { Progression } from "../domain/progression/types";

export type LevelProgressResult = {
	readonly progression: Progression;
	readonly previousLevel: number;
	readonly newLevel: number;
	readonly didLevelUp: boolean;
	readonly xpToNextLevel: number;
};

export function applyLevelProgress(
	current: Progression,
	xpDelta: number,
	now: string,
): LevelProgressResult {
	const previousLevel = computeLevel(current.totalXp);
	const newTotalXp = current.totalXp + xpDelta;
	const newLevel = computeLevel(newTotalXp);
	const didLevelUp = newLevel > previousLevel;
	const progress = computeProgress(newTotalXp);
	const xpToNextLevel = XP_PER_LEVEL - progress;

	return {
		progression: {
			profileId: current.profileId,
			totalXp: newTotalXp,
			tasksCompleted: current.tasksCompleted,
			streak: current.streak,
			updatedAt: now,
		},
		previousLevel,
		newLevel,
		didLevelUp,
		xpToNextLevel,
	};
}
