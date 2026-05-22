import { requireAuth, json } from "../../shared.ts";
import { deleteTask, findTaskByIdForUser } from "../../../db/tasks.ts";
import { audit } from "../../../db/audit.ts";

export async function handleDeleteTask(req: Request, taskId: number): Promise<Response> {
  let ctx;
  try {
    ctx = requireAuth(req);
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 401;
    return json({ error: (err as Error).message }, status);
  }
  const task = await findTaskByIdForUser(taskId, ctx.userId);
  if (!task) {
    return json({ error: "Task not found" }, 404);
  }
  const updated = await deleteTask(taskId);
  if (!updated) return json({ task, archived: true });
  await audit({ userId: ctx.userId, action: "task_archived", details: { task_id: taskId } });
  return json({ task: updated, archived: true });
}
