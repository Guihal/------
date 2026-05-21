import { Client, Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://taskcompanion:taskcompanion@localhost:5432/taskcompanion";

export const pool = new Pool({ connectionString, max: 10 });

export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T | undefined> {
  const rows = await query<T>(text, params);
  return rows[0];
}
