import { query, queryOne } from "./client.ts";
import type { PoolClient } from "pg";

export interface TaskDropRow {
  id: number;
  task_id: number;
  item_id: number | null;
  created_at: Date;
}

export async function recordTaskDrop(
  taskId: number,
  itemId: number | null,
  client?: PoolClient
): Promise<TaskDropRow | undefined> {
  const sql = `
    INSERT INTO task_drops (task_id, item_id)
    VALUES ($1, $2)
    ON CONFLICT (task_id) DO NOTHING
    RETURNING id, task_id, item_id, created_at
  `;
  const result = client
    ? (await client.query(sql, [taskId, itemId])).rows[0]
    : await queryOne<TaskDropRow>(sql, [taskId, itemId]);
  return result as TaskDropRow | undefined;
}

export async function findTaskDropByTaskId(taskId: number): Promise<TaskDropRow | undefined> {
  return queryOne<TaskDropRow>(
    `SELECT id, task_id, item_id, created_at FROM task_drops WHERE task_id = $1`,
    [taskId]
  );
}
