import { requireAuth, json } from "../../shared.ts";
import { requireAdmin } from "../../../security/jwt.ts";
import {
  countUsers,
  countTasks,
  countCompletedTasks,
  countActiveTasks,
  countItems,
  countUserItems,
  getLevelDistribution,
  getDropDistribution,
  getTaskStatsByDifficulty,
  getTaskStatsByCategory,
} from "../../../db/stats.ts";

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

  const [
    total_users,
    total_tasks,
    completed_tasks,
    active_tasks,
    total_items,
    total_user_items,
  ] = await Promise.all([
    countUsers(),
    countTasks(),
    countCompletedTasks(),
    countActiveTasks(),
    countItems(),
    countUserItems(),
  ]);

  return json({
    stats: {
      total_users,
      total_tasks,
      completed_tasks,
      active_tasks,
      total_items,
      total_user_items,
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

  const levels = await getLevelDistribution();
  return json({ levels });
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

  const drops = await getDropDistribution();
  return json({ drops });
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

  const [by_difficulty, by_category] = await Promise.all([
    getTaskStatsByDifficulty(),
    getTaskStatsByCategory(),
  ]);

  return json({ by_difficulty, by_category });
}
