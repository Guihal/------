import { requireAuth, json, bad } from "../../shared.ts";
import { findTaskById, updateTask } from "../../../db/tasks.ts";
import { audit } from "../../../db/audit.ts";
import { parseUpdateTask } from "../../../domain/tasks/validation.ts";

export async function handlePutTask(req: Request, taskId: number): Promise<Response> {
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
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid JSON");
  }
  const parsed = parseUpdateTask(body);
  if ("error" in parsed) return bad(parsed.error);
  const updated = await updateTask(taskId, parsed);
  if (!updated) return json({ error: "Task not found" }, 404);
  await audit({ userId: ctx.userId, action: "task_updated", details: { task_id: taskId } });
  return json({ task: updated });
}
