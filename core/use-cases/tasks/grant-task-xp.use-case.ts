import { computeBaseXp, computeFinalXp } from "../../domain/xp/task-xp"
import { applyLevelProgress } from "../apply-level-progress.use-case"
import type { UnitOfWorkPort } from "../../ports/unit-of-work.port"
import type { TaskComplexity, TaskPriority } from "../../domain/task/types"

export type GrantTaskXpInput = {
  readonly profileId: string
  readonly complexity: TaskComplexity
  readonly priority: TaskPriority
  readonly now: string
}

export type GrantTaskXpResult = {
  readonly xpGranted: number
  readonly previousLevel: number
  readonly newLevel: number
  readonly didLevelUp: boolean
  readonly xpToNextLevel: number
}

export async function grantTaskXp(
  uow: UnitOfWorkPort,
  input: GrantTaskXpInput,
): Promise<GrantTaskXpResult> {
  return uow.run(async () => {
    const progression = await uow.progressions.findById(input.profileId)
    if (progression === null) {
      throw new Error(`progression not found for profile: ${input.profileId}`)
    }

    const baseXp = computeBaseXp(input.complexity, input.priority)
    const xpGranted = computeFinalXp(baseXp)

    const levelResult = applyLevelProgress(progression, xpGranted, input.now)
    await uow.progressions.save(levelResult.progression)

    return {
      xpGranted,
      previousLevel: levelResult.previousLevel,
      newLevel: levelResult.newLevel,
      didLevelUp: levelResult.didLevelUp,
      xpToNextLevel: levelResult.xpToNextLevel,
    }
  })
}
