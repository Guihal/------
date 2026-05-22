import { query, queryOne } from "./client.ts";
import type { PoolClient } from "pg";

export interface TaskRewardRollRow {
  id: number;
  task_id: number;
  item_id: number;
  probability: number;
  created_at: Date;
  updated_at: Date;
}

export async function createTaskRewardRoll(
  taskId: number,
  itemId: number,
  probability: number,
  client?: PoolClient
): Promise<TaskRewardRollRow> {
  const sql = `
    INSERT INTO task_reward_rolls (task_id, item_id, probability)
    VALUES ($1, $2, $3)
    RETURNING id, task_id, item_id, probability, created_at, updated_at
  `;
  const result = client
    ? (await client.query(sql, [taskId, itemId, probability])).rows[0]
    : await queryOne<TaskRewardRollRow>(sql, [taskId, itemId, probability]);
  if (!result) throw new Error("Failed to create task reward roll");
  return result as TaskRewardRollRow;
}

export async function listTaskRewardRolls(
  taskId: number,
  client?: PoolClient
): Promise<TaskRewardRollRow[]> {
  const sql = `
    SELECT id, task_id, item_id, probability, created_at, updated_at
    FROM task_reward_rolls
    WHERE task_id = $1
    ORDER BY probability DESC
  `;
  if (client) {
    const result = await client.query(sql, [taskId]);
    return result.rows as TaskRewardRollRow[];
  }
  return query<TaskRewardRollRow>(sql, [taskId]);
}

export async function deleteTaskRewardRolls(
  taskId: number,
  client?: PoolClient
): Promise<void> {
  const sql = `DELETE FROM task_reward_rolls WHERE task_id = $1`;
  if (client) {
    await client.query(sql, [taskId]);
  } else {
    await query(sql, [taskId]);
  }
}
