import { query, queryOne } from "./client.ts";
import type { PoolClient } from "pg";

export type Difficulty = "low" | "normal" | "high";
export type Category = "general" | "work" | "personal" | "health";
export type Size = "tiny" | "small" | "medium" | "large";

export interface TaskRow {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  difficulty: Difficulty;
  category: Category;
  size: Size;
  deadline: Date | null;
  completed: boolean;
  archived: boolean;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  difficulty?: Difficulty;
  category?: Category;
  size?: Size;
  deadline?: Date | null;
}

export async function createTask(
  userId: number,
  input: CreateTaskInput,
  client?: PoolClient
): Promise<TaskRow> {
  const sql = `INSERT INTO tasks
    (user_id, title, description, difficulty, category, size, deadline)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, user_id, title, description, difficulty, category, size,
      deadline, completed, archived, completed_at, created_at, updated_at`;
  const params = [
    userId,
    input.title,
    input.description ?? null,
    input.difficulty ?? "normal",
    input.category ?? "general",
    input.size ?? "medium",
    input.deadline ?? null,
  ];
  const row = client
    ? (await client.query(sql, params)).rows[0]
    : await queryOne<TaskRow>(sql, params);
  if (!row) throw new Error("Failed to create task");
  return row as TaskRow;
}

export async function findTaskById(id: number): Promise<TaskRow | undefined> {
  return queryOne<TaskRow>(
    `SELECT id, user_id, title, description, difficulty, category, size,
      deadline, completed, archived, completed_at, created_at, updated_at
     FROM tasks WHERE id = $1`,
    [id]
  );
}

export async function listTasksByUser(userId: number): Promise<TaskRow[]> {
  return query<TaskRow>(
    `SELECT id, user_id, title, description, difficulty, category, size,
      deadline, completed, archived, completed_at, created_at, updated_at
     FROM tasks WHERE user_id = $1 AND archived = FALSE
     ORDER BY created_at DESC`,
    [userId]
  );
}

export async function markTaskCompleted(
  id: number,
  client?: PoolClient
): Promise<TaskRow | undefined> {
  const sql = `UPDATE tasks
    SET completed = TRUE, completed_at = NOW(), updated_at = NOW()
    WHERE id = $1 AND completed = FALSE
    RETURNING id, user_id, title, description, difficulty, category, size,
      deadline, completed, archived, completed_at, created_at, updated_at`;
  return client
    ? (await client.query(sql, [id])).rows[0] as TaskRow | undefined
    : queryOne<TaskRow>(sql, [id]);
}

export async function markTaskArchived(
  id: number,
  client?: PoolClient
): Promise<TaskRow | undefined> {
  const sql = `UPDATE tasks
    SET archived = TRUE, updated_at = NOW()
    WHERE id = $1 AND archived = FALSE
    RETURNING id, user_id, title, description, difficulty, category, size,
      deadline, completed, archived, completed_at, created_at, updated_at`;
  return client
    ? (await client.query(sql, [id])).rows[0] as TaskRow | undefined
    : queryOne<TaskRow>(sql, [id]);
}
