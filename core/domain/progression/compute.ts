export const XP_PER_LEVEL = 1000;

export function computeLevel(xp: number): number {
	return Math.floor(xp / XP_PER_LEVEL);
}

export function computeProgress(xp: number): number {
	return xp % XP_PER_LEVEL;
}
