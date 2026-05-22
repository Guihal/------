import { listActiveItems } from "../../db/items.ts";
import { addItemToUser } from "../../db/inventory.ts";
import { findLevelRewardByLevel } from "../../db/level-rewards.ts";
import type { PoolClient } from "pg";

export interface LevelReward {
  item_id: number;
  name: string;
  rarity: string;
}

export async function grantLevelReward(
  userId: number,
  level: number,
  client?: PoolClient
): Promise<LevelReward | null> {
  const levelReward = await findLevelRewardByLevel(level, client);
  if (levelReward) {
    if (levelReward.reward_type === "item" && levelReward.item_id) {
      const items = await listActiveItems();
      const item = items.find(i => i.id === levelReward.item_id);
      if (item) {
        await addItemToUser(userId, item.id, client);
        return { item_id: item.id, name: item.name, rarity: item.rarity };
      }
    }
    return null;
  }

  // Fallback: rarity-based selection
  const targetRarity = level % 5 === 0 ? "legendary" : level % 3 === 0 ? "epic" : level % 2 === 0 ? "rare" : "common";
  const items = await listActiveItems();
  const candidates = items.filter(i => i.rarity === targetRarity);
  if (candidates.length === 0) return null;
  const item = candidates[0];
  if (!item) return null;
  await addItemToUser(userId, item.id, client);
  return { item_id: item.id, name: item.name, rarity: item.rarity };
}
