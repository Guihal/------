import { query, queryOne } from "./client.ts";
import type { PoolClient } from "pg";

export interface UserItemRow {
  id: number;
  user_id: number;
  item_id: number;
  quantity: number;
  equipped: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function addItemToUser(
  userId: number,
  itemId: number,
  client?: PoolClient
): Promise<UserItemRow> {
  const sql = `
    INSERT INTO user_items (user_id, item_id, quantity)
    VALUES ($1, $2, 1)
    ON CONFLICT (user_id, item_id)
    DO UPDATE SET quantity = user_items.quantity + 1, updated_at = NOW()
    RETURNING id, user_id, item_id, quantity, equipped, created_at, updated_at
  `;
  const result = client
    ? (await client.query(sql, [userId, itemId])).rows[0]
    : await queryOne<UserItemRow>(sql, [userId, itemId]);
  if (!result) throw new Error("Failed to add item to user");
  return result;
}

export async function findUserItem(
  userId: number,
  itemId: number
): Promise<UserItemRow | undefined> {
  return queryOne<UserItemRow>(
    `SELECT id, user_id, item_id, quantity, equipped, created_at, updated_at
     FROM user_items WHERE user_id = $1 AND item_id = $2`,
    [userId, itemId]
  );
}

export async function listUserItems(userId: number): Promise<UserItemRow[]> {
  return query<UserItemRow>(
    `SELECT id, user_id, item_id, quantity, equipped, created_at, updated_at
     FROM user_items WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
}

export async function equipItem(
  userId: number,
  itemId: number,
  client?: PoolClient
): Promise<UserItemRow | undefined> {
  // Unequip any currently equipped item for this user
  const unequipSql = `UPDATE user_items SET equipped = FALSE, updated_at = NOW()
    WHERE user_id = $1 AND equipped = TRUE`;
  if (client) {
    await client.query(unequipSql, [userId]);
  } else {
    await query(unequipSql, [userId]);
  }

  const sql = `UPDATE user_items SET equipped = TRUE, updated_at = NOW()
    WHERE user_id = $1 AND item_id = $2
    RETURNING id, user_id, item_id, quantity, equipped, created_at, updated_at`;
  return client
    ? (await client.query(sql, [userId, itemId])).rows[0]
    : queryOne<UserItemRow>(sql, [userId, itemId]);
}

export async function unequipItem(
  userId: number,
  client?: PoolClient
): Promise<void> {
  const sql = `UPDATE user_items SET equipped = FALSE, updated_at = NOW()
    WHERE user_id = $1 AND equipped = TRUE`;
  if (client) {
    await client.query(sql, [userId]);
  } else {
    await query(sql, [userId]);
  }
}
