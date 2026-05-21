import { query, queryOne } from "./client.ts";
import type { PoolClient } from "pg";
import type { TaskRow, CreateTaskInput, UpdateTaskInput } from "./task-types.ts";
import { TASK_COLUMNS } from "./task-columns.ts";
export type { Difficulty, Category, Size, TaskRow, CreateTaskInput, UpdateTaskInput } from "./task-types.ts";

export async function createTask(
  userId: number,
  input: CreateTaskInput,
  client?: PoolClient
): Promise<TaskRow> {
  const sql = `INSERT INTO tasks
    (user_id, title, description, difficulty, category, size, deadline)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING ${TASK_COLUMNS}`;
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
  return row;
}

export async function findTaskById(id: number): Promise<TaskRow | undefined> {
  return queryOne<TaskRow>(
    `SELECT ${TASK_COLUMNS} FROM tasks WHERE id = $1`,
    [id]
  );
}

export async function listTasksByUser(userId: number): Promise<TaskRow[]> {
  return query<TaskRow>(
    `SELECT ${TASK_COLUMNS} FROM tasks WHERE user_id = $1 AND archived = FALSE ORDER BY created_at DESC`,
    [userId]
  );
}

export async function markTaskCompleted(
  id: number,
  client?: PoolClient
): Promise<TaskRow | undefined> {
  const sql = `UPDATE tasks SET completed = TRUE, completed_at = NOW(), updated_at = NOW()
    WHERE id = $1 AND completed = FALSE RETURNING ${TASK_COLUMNS}`;
  return client
    ? (await client.query(sql, [id])).rows[0]
    : queryOne<TaskRow>(sql, [id]);
}

export async function markTaskArchived(
  id: number,
  client?: PoolClient
): Promise<TaskRow | undefined> {
  const sql = `UPDATE tasks SET archived = TRUE, updated_at = NOW()
    WHERE id = $1 AND archived = FALSE RETURNING ${TASK_COLUMNS}`;
  return client
    ? (await client.query(sql, [id])).rows[0]
    : queryOne<TaskRow>(sql, [id]);
}

export async function updateTask(
  id: number,
  input: UpdateTaskInput,
  client?: PoolClient
): Promise<TaskRow | undefined> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  if (input.title !== undefined) {
    setClauses.push(`title = $${setClauses.length + 1}`);
    values.push(input.title);
  }
  if (input.description !== undefined) {
    setClauses.push(`description = $${setClauses.length + 1}`);
    values.push(input.description);
  }
  if (input.difficulty !== undefined) {
    setClauses.push(`difficulty = $${setClauses.length + 1}`);
    values.push(input.difficulty);
  }
  if (input.category !== undefined) {
    setClauses.push(`category = $${setClauses.length + 1}`);
    values.push(input.category);
  }
  if (input.size !== undefined) {
    setClauses.push(`size = $${setClauses.length + 1}`);
    values.push(input.size);
  }
  if (input.deadline !== undefined) {
    setClauses.push(`deadline = $${setClauses.length + 1}`);
    values.push(input.deadline);
  }
  if (setClauses.length === 0) return findTaskById(id);
  const fields = [...setClauses, `updated_at = NOW()`];
  const sql = `UPDATE tasks SET ${fields.join(", ")} WHERE id = $${setClauses.length + 1} RETURNING ${TASK_COLUMNS}`;
  values.push(id);
  return client
    ? (await client.query(sql, values)).rows[0]
    : queryOne<TaskRow>(sql, values);
}

export async function deleteTask(
  id: number,
  client?: PoolClient
): Promise<TaskRow | undefined> {
  const sql = `DELETE FROM tasks WHERE id = $1 RETURNING ${TASK_COLUMNS}`;
  return client
    ? (await client.query(sql, [id])).rows[0]
    : queryOne<TaskRow>(sql, [id]);
}

export async function listTasksByUserFiltered(
  userId: number,
  filters: { status?: "active" | "completed" | "archived" | "all" | undefined; overdue?: boolean | undefined }
): Promise<TaskRow[]> {
  const conditions = ["user_id = $1"];
  const params: unknown[] = [userId];
  if (filters.status === "active") {
    conditions.push("completed = FALSE AND archived = FALSE");
  } else if (filters.status === "completed") {
    conditions.push("completed = TRUE AND archived = FALSE");
  } else if (filters.status === "archived") {
    conditions.push("archived = TRUE");
  } else {
    conditions.push("archived = FALSE");
  }
  if (filters.overdue === true) {
    conditions.push("deadline IS NOT NULL AND deadline < NOW() AND completed = FALSE AND archived = FALSE");
  }
  const sql = `SELECT ${TASK_COLUMNS} FROM tasks WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC`;
  return query<TaskRow>(sql, params);
}
