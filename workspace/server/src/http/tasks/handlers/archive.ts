import { requireAuth, json } from "../../shared.ts";
import { findTaskById, markTaskArchived } from "../../../db/tasks.ts";
import { audit } from "../../../db/audit.ts";

export async function handlePatchTaskArchive(req: Request, taskId: number): Promise<Response> {
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
  const updated = await markTaskArchived(taskId);
  if (!updated) {
    return json({ task, archived: true });
  }
  await audit({ userId: ctx.userId, action: "task_archived", details: { task_id: taskId } });
  return json({ task: updated, archived: true });
}
