import { query, queryOne } from "./client.ts";
import type { PoolClient } from "pg";

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  role: "user" | "admin";
  xp_multiplier: number;
  created_at: Date;
  updated_at: Date;
}

export async function createUser(
  email: string,
  passwordHash: string,
  client?: PoolClient
): Promise<UserRow> {
  const sql = `INSERT INTO users (email, password_hash, role)
     VALUES ($1, $2, 'user')
     RETURNING id, email, password_hash, role, xp_multiplier, created_at, updated_at`;
  const params = [email, passwordHash];
  const row = client
    ? (await client.query(sql, params)).rows[0]
    : await queryOne<UserRow>(sql, params);
  if (!row) throw new Error("Failed to create user");
  return row as UserRow;
}

export async function findUserByEmail(email: string): Promise<UserRow | undefined> {
  return queryOne<UserRow>(
    `SELECT id, email, password_hash, role, xp_multiplier, created_at, updated_at FROM users WHERE email = $1`,
    [email]
  );
}

export async function findUserById(id: number): Promise<UserRow | undefined> {
  return queryOne<UserRow>(
    `SELECT id, email, password_hash, role, xp_multiplier, created_at, updated_at FROM users WHERE id = $1`,
    [id]
  );
}

export async function listUsers(): Promise<Pick<UserRow, "id" | "email" | "role" | "created_at">[]> {
  return query<Pick<UserRow, "id" | "email" | "role" | "created_at">>(
    `SELECT id, email, role, created_at FROM users ORDER BY id`
  );
}
