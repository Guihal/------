import type { TaskComplexity, TaskPriority } from "../task/types"

export const BASE_XP: Record<TaskComplexity, number> = {
  tiny: 10,
  small: 25,
  medium: 50,
  large: 100,
}

export const PRIORITY_BONUS: Record<TaskPriority, number> = {
  low: 0,
  normal: 0.1,
  high: 0.25,
}

export function computeBaseXp(
  complexity: TaskComplexity,
  priority: TaskPriority = "normal",
): number {
  const base = BASE_XP[complexity]
  const bonus = PRIORITY_BONUS[priority]
  return Math.round(base * (1 + bonus))
}

export function computeFinalXp(
  baseXp: number,
  _taskMultiplier = 1,
  _equipmentXpMultiplier = 1,
): number {
  // MVP-0 invariant: multipliers hardcoded to 1
  return baseXp
}
