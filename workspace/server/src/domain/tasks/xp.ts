import type { Difficulty, Size } from "../../db/task-types.ts";

const BASE_XP: Record<Difficulty, number> = {
  low: 10,
  normal: 20,
  high: 40,
};

const SIZE_MULT: Record<Size, number> = {
  tiny: 0.5,
  small: 0.75,
  medium: 1.0,
  large: 1.5,
};

export function computeTaskXp(difficulty: Difficulty, size: Size): number {
  return Math.round(BASE_XP[difficulty] * SIZE_MULT[size]);
}

export function xpForLevel(level: number): number {
  return (level - 1) ** 2 * 100;
}
