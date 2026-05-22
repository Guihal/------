import { requireAuth, json } from "../../shared.ts";
import { findTaskById, markTaskCompleted } from "../../../db/tasks.ts";
import { ensureProgression } from "../../../db/progressions.ts";
import { computeTaskXp } from "../../../domain/tasks/xp.ts";
import { rollDrop } from "../../../domain/rewards/drop.ts";
import { addXpWithReward } from "../../../domain/rewards/progression-rewards.ts";
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
    const { reward: levelReward } = await addXpWithReward(ctx.userId, xp, client);
    const drop = await rollDrop(taskId, ctx.userId, client);
    return { task: t, levelReward, drop };
  });
  const reward = {
    drop: updated.drop || undefined,
    level: updated.levelReward || undefined,
  };
  await audit({ userId: ctx.userId, action: "task_completed", details: { task_id: taskId, xp, reward } });
  return json({ task: updated.task, xp_gained: xp, reward });
}
