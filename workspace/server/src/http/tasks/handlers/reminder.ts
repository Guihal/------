import { requireAuth, json, bad } from "../../shared.ts";
import { findTaskById } from "../../../db/tasks.ts";
import { audit } from "../../../db/audit.ts";

export async function handlePostReminder(req: Request, taskId: number): Promise<Response> {
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

  if (task.completed || task.archived) {
    return bad("Cannot set reminder for completed or archived task");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid JSON");
  }
  if (!body || typeof body !== "object") return bad("Invalid body");

  const reminderAt = (body as Record<string, unknown>).reminder_at;
  if (reminderAt === undefined) return bad("reminder_at is required");
  if (reminderAt !== null && (typeof reminderAt !== "string" || Number.isNaN(Date.parse(reminderAt)))) {
    return bad("reminder_at must be a valid ISO date string or null");
  }

  await audit({ userId: ctx.userId, action: "task_reminder_set", details: { task_id: taskId, reminder_at: reminderAt } });

  return json({
    task_id: taskId,
    reminder_at: reminderAt,
    ok: true,
  });
}
