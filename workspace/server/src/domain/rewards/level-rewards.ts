import { listItems } from "../../db/items.ts";
import { addItemToUser } from "../../db/inventory.ts";
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
  // Every 5 levels: legendary, every 3: epic, every 2: rare, otherwise common
  const targetRarity = level % 5 === 0 ? "legendary" : level % 3 === 0 ? "epic" : level % 2 === 0 ? "rare" : "common";
  const items = await listItems();
  const candidates = items.filter(i => i.rarity === targetRarity);
  if (candidates.length === 0) return null;
  const item = candidates[0];
  if (!item) return null;
  await addItemToUser(userId, item.id, client);
  return { item_id: item.id, name: item.name, rarity: item.rarity };
}
