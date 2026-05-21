import { requireAuth, json } from "../../shared.ts";
import { findTaskById, deleteTask } from "../../../db/tasks.ts";
import { audit } from "../../../db/audit.ts";

export async function handleDeleteTask(req: Request, taskId: number): Promise<Response> {
  let ctx;
  try {
    ctx = requireAuth(req);
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 401;
    return json({ error: (err as Error).message }, status);
  }
  const task = await findTaskById(taskId);
  if (!task || task.user_id !== ctx.userId) {
    return json({ error: "Task not found" }, 404);
  }
  const deleted = await deleteTask(taskId);
  if (!deleted) return json({ error: "Task not found" }, 404);
  await audit({ userId: ctx.userId, action: "task_deleted", details: { task_id: taskId } });
  return json({ deleted: true });
}
