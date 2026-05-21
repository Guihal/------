import { listItems } from "../../db/items.ts";
import { addItemToUser } from "../../db/inventory.ts";
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
  userId: number,
  client?: PoolClient
): Promise<RollResult | null> {
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
  if (!selectedRarity) return null;

  const items = await listItems();
  const candidates = items.filter(i => i.rarity === selectedRarity);
  if (candidates.length === 0) return null;

  const item = candidates[Math.floor(random() * candidates.length)];
  if (!item) return null;
  await addItemToUser(userId, item.id, client);
  return { item_id: item.id, name: item.name, rarity: item.rarity };
}
