import { query, queryOne } from "./client.ts";

export async function countUsers(): Promise<number> {
  const r = await queryOne<{ count: string }>(`SELECT COUNT(*)::text as count FROM users`);
  return Number(r?.count ?? 0);
}

export async function countTasks(): Promise<number> {
  const r = await queryOne<{ count: string }>(`SELECT COUNT(*)::text as count FROM tasks`);
  return Number(r?.count ?? 0);
}

export async function countCompletedTasks(): Promise<number> {
  const r = await queryOne<{ count: string }>(`SELECT COUNT(*)::text as count FROM tasks WHERE completed = TRUE`);
  return Number(r?.count ?? 0);
}

export async function countActiveTasks(): Promise<number> {
  const r = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM tasks WHERE completed = FALSE AND archived = FALSE`
  );
  return Number(r?.count ?? 0);
}

export async function countItems(): Promise<number> {
  const r = await queryOne<{ count: string }>(`SELECT COUNT(*)::text as count FROM items`);
  return Number(r?.count ?? 0);
}

export async function countUserItems(): Promise<number> {
  const r = await queryOne<{ count: string }>(`SELECT COUNT(*)::text as count FROM user_items`);
  return Number(r?.count ?? 0);
}

export interface LevelStat {
  level: number;
  count: number;
}

export async function getLevelDistribution(): Promise<LevelStat[]> {
  const rows = await query<{ level: number; count: string }>(
    `SELECT level, COUNT(*)::text as count FROM progressions GROUP BY level ORDER BY level`
  );
  return rows.map((r) => ({ level: r.level, count: Number(r.count) }));
}

export interface DropStat {
  rarity: string;
  count: number;
}

export async function getDropDistribution(): Promise<DropStat[]> {
  const rows = await query<{ rarity: string; count: string }>(
    `SELECT i.rarity, COUNT(*)::text as count
     FROM user_items ui
     JOIN items i ON ui.item_id = i.id
     GROUP BY i.rarity
     ORDER BY i.rarity`
  );
  return rows.map((r) => ({ rarity: r.rarity, count: Number(r.count) }));
}

export interface TaskStat {
  key: string;
  count: number;
}

export async function getTaskStatsByDifficulty(): Promise<TaskStat[]> {
  const rows = await query<{ difficulty: string; count: string }>(
    `SELECT difficulty, COUNT(*)::text as count FROM tasks GROUP BY difficulty ORDER BY difficulty`
  );
  return rows.map((r) => ({ key: r.difficulty, count: Number(r.count) }));
}

export async function getTaskStatsByCategory(): Promise<TaskStat[]> {
  const rows = await query<{ category: string; count: string }>(
    `SELECT category, COUNT(*)::text as count FROM tasks GROUP BY category ORDER BY category`
  );
  return rows.map((r) => ({ key: r.category, count: Number(r.count) }));
}
