import { requireAuth, json, bad } from "../../shared.ts";
import { createTask } from "../../../db/tasks.ts";
import { audit } from "../../../db/audit.ts";
import { parseCreateTask } from "../../../domain/tasks/validation.ts";

export async function handlePostTasks(req: Request): Promise<Response> {
  let ctx;
  try {
    ctx = requireAuth(req);
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 401;
    return json({ error: (err as Error).message }, status);
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid JSON");
  }
  const parsed = parseCreateTask(body);
  if ("error" in parsed) return bad(parsed.error);
  const task = await createTask(ctx.userId, parsed);
  await audit({ userId: ctx.userId, action: "task_created", details: { task_id: task.id } });
  return json({ task }, 201);
}
