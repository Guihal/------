import { query, queryOne } from "./client.ts";
import type { PoolClient } from "pg";

export interface LevelRewardRow {
  id: number;
  level: number;
  reward_type: "item" | "currency" | "xp";
  amount: number;
  item_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export async function createLevelReward(
  level: number,
  rewardType: "item" | "currency" | "xp",
  amount: number,
  itemId: number | null,
  client?: PoolClient
): Promise<LevelRewardRow> {
  const sql = `
    INSERT INTO level_rewards (level, reward_type, amount, item_id)
    VALUES ($1, $2, $3, $4)
    RETURNING id, level, reward_type, amount, item_id, created_at, updated_at
  `;
  const result = client
    ? (await client.query(sql, [level, rewardType, amount, itemId])).rows[0]
    : await queryOne<LevelRewardRow>(sql, [level, rewardType, amount, itemId]);
  if (!result) throw new Error("Failed to create level reward");
  return result as LevelRewardRow;
}

export async function findLevelRewardByLevel(
  level: number,
  client?: PoolClient
): Promise<LevelRewardRow | undefined> {
  const sql = `
    SELECT id, level, reward_type, amount, item_id, created_at, updated_at
    FROM level_rewards WHERE level = $1
  `;
  if (client) {
    const result = await client.query(sql, [level]);
    return result.rows[0] as LevelRewardRow | undefined;
  }
  return queryOne<LevelRewardRow>(sql, [level]);
}

export async function listLevelRewards(): Promise<LevelRewardRow[]> {
  return query<LevelRewardRow>(
    `SELECT id, level, reward_type, amount, item_id, created_at, updated_at
     FROM level_rewards ORDER BY level`
  );
}
