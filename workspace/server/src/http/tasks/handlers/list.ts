import { requireAuth, json } from "../../shared.ts";
import { listTasksByUser, listTasksByUserFiltered } from "../../../db/tasks.ts";

export async function handleGetTasks(req: Request): Promise<Response> {
  let ctx;
  try {
    ctx = requireAuth(req);
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 401;
    return json({ error: (err as Error).message }, status);
  }
  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status");
  const overdueParam = url.searchParams.get("overdue");
  const validStatus = statusParam === "active" || statusParam === "completed" || statusParam === "archived" || statusParam === "all"
    ? statusParam
    : undefined;
  const overdue = overdueParam === "true" ? true : undefined;
  const tasks = validStatus || overdue !== undefined
    ? await listTasksByUserFiltered(ctx.userId, { status: validStatus, overdue })
    : await listTasksByUser(ctx.userId);
  return json(tasks);
}
