import { query, queryOne } from "./client.ts";
import type { PoolClient } from "pg";

export interface ProfileRow {
  id: number;
  user_id: number;
  display_name: string | null;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function createProfile(
  userId: number,
  client?: PoolClient
): Promise<ProfileRow> {
  const sql = `INSERT INTO profiles (user_id) VALUES ($1)
    RETURNING id, user_id, display_name, avatar_url, created_at, updated_at`;
  const row = client
    ? (await client.query(sql, [userId])).rows[0]
    : await queryOne<ProfileRow>(sql, [userId]);
  if (!row) throw new Error("Failed to create profile");
  return row as ProfileRow;
}

export async function findProfileByUserId(userId: number): Promise<ProfileRow | undefined> {
  return queryOne<ProfileRow>(
    `SELECT id, user_id, display_name, avatar_url, created_at, updated_at FROM profiles WHERE user_id = $1`,
    [userId]
  );
}

export async function updateProfile(
  userId: number,
  updates: { display_name?: string; avatar_url?: string }
): Promise<ProfileRow | undefined> {
  const fields: string[] = [];
  const values: unknown[] = [];
  if (updates.display_name !== undefined) {
    fields.push(`display_name = $${fields.length + 1}`);
    values.push(updates.display_name);
  }
  if (updates.avatar_url !== undefined) {
    fields.push(`avatar_url = $${fields.length + 1}`);
    values.push(updates.avatar_url);
  }
  if (fields.length === 0) return findProfileByUserId(userId);
  fields.push(`updated_at = NOW()`);
  values.push(userId);
  const sql = `UPDATE profiles SET ${fields.join(", ")} WHERE user_id = $${values.length}
    RETURNING id, user_id, display_name, avatar_url, created_at, updated_at`;
  return queryOne<ProfileRow>(sql, values);
}
