import { query, queryOne } from "./client.ts";
import type { PoolClient } from "pg";

export interface ProgressionRow {
  id: number;
  user_id: number;
  xp: number;
  level: number;
  created_at: Date;
  updated_at: Date;
}

export async function createProgression(
  userId: number,
  client?: PoolClient
): Promise<ProgressionRow> {
  const sql = `INSERT INTO progressions (user_id) VALUES ($1)
    RETURNING id, user_id, xp, level, created_at, updated_at`;
  const row = client
    ? (await client.query(sql, [userId])).rows[0]
    : await queryOne<ProgressionRow>(sql, [userId]);
  if (!row) throw new Error("Failed to create progression");
  return row as ProgressionRow;
}

export async function findProgressionByUserId(userId: number): Promise<ProgressionRow | undefined> {
  return queryOne<ProgressionRow>(
    `SELECT id, user_id, xp, level, created_at, updated_at FROM progressions WHERE user_id = $1`,
    [userId]
  );
}

export async function addXp(
  userId: number,
  xp: number,
  client?: PoolClient
): Promise<ProgressionRow | undefined> {
  const sql = `
    UPDATE progressions
    SET xp = xp + $1,
        level = GREATEST(1, FLOOR(SQRT((xp + $1) / 100.0)) + 1),
        updated_at = NOW()
    WHERE user_id = $2
    RETURNING id, user_id, xp, level, created_at, updated_at`;
  const params = [xp, userId];
  return client
    ? (await client.query(sql, params)).rows[0] as ProgressionRow | undefined
    : queryOne<ProgressionRow>(sql, params);
}

export async function ensureProgression(userId: number): Promise<ProgressionRow> {
  const existing = await findProgressionByUserId(userId);
  if (existing) return existing;
  return createProgression(userId);
}
