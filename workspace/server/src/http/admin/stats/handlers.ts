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
