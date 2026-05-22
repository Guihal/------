import { listActiveItems } from "../../db/items.ts";
import { addItemToUser } from "../../db/inventory.ts";
import { listTaskRewardRolls } from "../../db/task-reward-rolls.ts";
import { recordTaskDrop, findTaskDropByTaskId } from "../../db/task-drops.ts";
import type { PoolClient } from "pg";

export interface RollResult {
  item_id: number;
  name: string;
  rarity: string;
}

export interface SeededRandom {
  next(): number;
}

// Deterministic RNG for tests: xorshift32
export function createSeededRandom(seed: number): SeededRandom {
  let s = seed >>> 0;
  return {
    next(): number {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      return ((s >>> 0) / 4294967296);
    }
  };
}

let globalRandom: SeededRandom | null = null;

export function setGlobalRandom(rng: SeededRandom | null): void {
  globalRandom = rng;
}

function random(): number {
  if (globalRandom) return globalRandom.next();
  return Math.random();
}

const RARITY_WEIGHTS: Record<string, number> = {
  common: 60,
  rare: 25,
  epic: 10,
  legendary: 5,
};

export async function rollDrop(
  taskId: number,
  userId: number,
  client?: PoolClient
): Promise<RollResult | null> {
  // Idempotency: check if drop already recorded for this task
  const existing = await findTaskDropByTaskId(taskId);
  if (existing) {
    if (existing.item_id) {
      const { findItemById } = await import("../../db/items.ts");
      const item = await findItemById(existing.item_id);
      if (item) {
        return { item_id: item.id, name: item.name, rarity: item.rarity };
      }
    }
    return null;
  }

  // Try task-specific reward rolls first
  const rolls = await listTaskRewardRolls(taskId, client);
  if (rolls.length > 0) {
    const roll = random();
    let cumulative = 0;
    for (const r of rolls) {
      cumulative += Number(r.probability);
      if (roll < cumulative) {
        const items = await listActiveItems();
        const item = items.find(i => i.id === r.item_id);
        if (item) {
          await addItemToUser(userId, item.id, client);
          await recordTaskDrop(taskId, item.id, client);
          return { item_id: item.id, name: item.name, rarity: item.rarity };
        }
        break;
      }
    }
  }

  // Fallback to rarity-based roll
  const roll = random() * 100;
  let cumulative = 0;
  let selectedRarity: string | null = null;
  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    cumulative += weight;
    if (roll < cumulative) {
      selectedRarity = rarity;
      break;
    }
  }
  if (!selectedRarity) {
    await recordTaskDrop(taskId, null, client);
    return null;
  }

  const items = await listActiveItems();
  const candidates = items.filter(i => i.rarity === selectedRarity);
  if (candidates.length === 0) {
    await recordTaskDrop(taskId, null, client);
    return null;
  }

  const item = candidates[Math.floor(random() * candidates.length)];
  if (!item) {
    await recordTaskDrop(taskId, null, client);
    return null;
  }
  await addItemToUser(userId, item.id, client);
  await recordTaskDrop(taskId, item.id, client);
  return { item_id: item.id, name: item.name, rarity: item.rarity };
}
