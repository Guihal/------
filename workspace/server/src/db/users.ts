import { query, queryOne } from "./client.ts";

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  role: "user" | "admin";
  created_at: Date;
  updated_at: Date;
}

export async function createUser(
  email: string,
  passwordHash: string,
  role: "user" | "admin" = "user"
): Promise<UserRow> {
  const row = await queryOne<UserRow>(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, $2, $3)
     RETURNING id, email, password_hash, role, created_at, updated_at`,
    [email, passwordHash, role]
  );
  if (!row) throw new Error("Failed to create user");
  return row;
}

export async function findUserByEmail(email: string): Promise<UserRow | undefined> {
  return queryOne<UserRow>(
    `SELECT id, email, password_hash, role, created_at, updated_at FROM users WHERE email = $1`,
    [email]
  );
}

export async function findUserById(id: number): Promise<UserRow | undefined> {
  return queryOne<UserRow>(
    `SELECT id, email, password_hash, role, created_at, updated_at FROM users WHERE id = $1`,
    [id]
  );
}
