import { requireAuth, json } from "../../shared.ts";
import { requireAdmin } from "../../../security/jwt.ts";
import { query, queryOne } from "../../../db/client.ts";

export async function handleGetStats(req: Request): Promise<Response> {
  let ctx;
  try {
    ctx = requireAuth(req);
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 401;
    return json({ error: (err as Error).message }, status);
  }

  try {
    requireAdmin(ctx.role);
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 403;
    return json({ error: (err as Error).message }, status);
  }

  const usersCount = await queryOne<{ count: string }>(`SELECT COUNT(*)::text as count FROM users`);
  const tasksCount = await queryOne<{ count: string }>(`SELECT COUNT(*)::text as count FROM tasks`);
  const completedTasks = await queryOne<{ count: string }>(`SELECT COUNT(*)::text as count FROM tasks WHERE completed = TRUE`);
  const activeTasks = await queryOne<{ count: string }>(`SELECT COUNT(*)::text as count FROM tasks WHERE completed = FALSE AND archived = FALSE`);
  const itemsCount = await queryOne<{ count: string }>(`SELECT COUNT(*)::text as count FROM items`);
  const userItemsCount = await queryOne<{ count: string }>(`SELECT COUNT(*)::text as count FROM user_items`);

  return json({
    stats: {
      total_users: Number(usersCount?.count ?? 0),
      total_tasks: Number(tasksCount?.count ?? 0),
      completed_tasks: Number(completedTasks?.count ?? 0),
      active_tasks: Number(activeTasks?.count ?? 0),
      total_items: Number(itemsCount?.count ?? 0),
      total_user_items: Number(userItemsCount?.count ?? 0),
    },
  });
}

export async function handleGetLevelStats(req: Request): Promise<Response> {
  let ctx;
  try {
    ctx = requireAuth(req);
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 401;
    return json({ error: (err as Error).message }, status);
  }

  try {
    requireAdmin(ctx.role);
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 403;
    return json({ error: (err as Error).message }, status);
  }

  const rows = await query<{ level: number; count: string }>(
    `SELECT level, COUNT(*)::text as count FROM progressions GROUP BY level ORDER BY level`
  );

  return json({
    levels: rows.map((r) => ({ level: r.level, count: Number(r.count) })),
  });
}

export async function handleGetDropStats(req: Request): Promise<Response> {
  let ctx;
  try {
    ctx = requireAuth(req);
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 401;
    return json({ error: (err as Error).message }, status);
  }

  try {
    requireAdmin(ctx.role);
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 403;
    return json({ error: (err as Error).message }, status);
  }

  const rows = await query<{ rarity: string; count: string }>(
    `SELECT i.rarity, COUNT(*)::text as count
     FROM user_items ui
     JOIN items i ON ui.item_id = i.id
     GROUP BY i.rarity
     ORDER BY i.rarity`
  );

  return json({
    drops: rows.map((r) => ({ rarity: r.rarity, count: Number(r.count) })),
  });
}

export async function handleGetTaskStats(req: Request): Promise<Response> {
  let ctx;
  try {
    ctx = requireAuth(req);
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 401;
    return json({ error: (err as Error).message }, status);
  }

  try {
    requireAdmin(ctx.role);
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 403;
    return json({ error: (err as Error).message }, status);
  }

  const byDifficulty = await query<{ difficulty: string; count: string }>(
    `SELECT difficulty, COUNT(*)::text as count FROM tasks GROUP BY difficulty ORDER BY difficulty`
  );
  const byCategory = await query<{ category: string; count: string }>(
    `SELECT category, COUNT(*)::text as count FROM tasks GROUP BY category ORDER BY category`
  );

  return json({
    by_difficulty: byDifficulty.map((r) => ({ difficulty: r.difficulty, count: Number(r.count) })),
    by_category: byCategory.map((r) => ({ category: r.category, count: Number(r.count) })),
  });
}
