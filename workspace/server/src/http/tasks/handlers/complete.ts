import { requireAuth, json } from "../../shared.ts";
import { findTaskById, markTaskCompleted } from "../../../db/tasks.ts";
import { ensureProgression, addXp } from "../../../db/progressions.ts";
import { computeTaskXp } from "../../../domain/tasks/xp.ts";
import { audit } from "../../../db/audit.ts";
import { withTransaction } from "../../../db/client.ts";

export async function handlePatchTaskComplete(req: Request, taskId: number): Promise<Response> {
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
  if (task.completed) {
    return json({ task, xp_gained: 0, reward: null });
  }
  const xp = computeTaskXp(task.difficulty, task.size);
  const updated = await withTransaction(async (client) => {
    const t = await markTaskCompleted(taskId, client);
    if (!t) throw new Error("Task completion failed");
    await ensureProgression(ctx.userId, client);
    await addXp(ctx.userId, xp, client);
    return t;
  });
  await audit({ userId: ctx.userId, action: "task_completed", details: { task_id: taskId, xp } });
  return json({ task: updated, xp_gained: xp, reward: null });
}
