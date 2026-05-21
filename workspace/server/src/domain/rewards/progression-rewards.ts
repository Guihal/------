import { findProgressionByUserId, addXp } from "../../db/progressions.ts";
import { grantLevelReward } from "./level-rewards.ts";
import type { PoolClient } from "pg";

export interface XpRewardResult {
  progression: { id: number; user_id: number; xp: number; level: number };
  reward: { item_id: number; name: string; rarity: string } | null;
}

export async function addXpWithReward(
  userId: number,
  xp: number,
  client?: PoolClient
): Promise<XpRewardResult> {
  const before = await findProgressionByUserId(userId);
  const progression = await addXp(userId, xp, client);
  if (!progression) throw new Error("Failed to add XP");
  let reward = null;
  if (before && progression.level > before.level) {
    reward = await grantLevelReward(userId, progression.level, client);
  }
  return { progression, reward };
}
