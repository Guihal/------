import {
  requireAuth,
  json,
  bad,
  getClientIp,
  checkRateLimit,
  rateLimitResponse,
} from "../../shared.ts";
import {
  createTask,
  listTasksByUser,
  listTasksByUserFiltered,
  findTaskById,
  markTaskCompleted,
  markTaskArchived,
  updateTask,
  deleteTask,
} from "../../../db/tasks.ts";
import { ensureProgression, addXp } from "../../../db/progressions.ts";
import { computeTaskXp } from "../../../domain/tasks/xp.ts";
import { audit } from "../../../db/audit.ts";
import { withTransaction } from "../../../db/client.ts";
import type {
  CreateTaskInput,
  Difficulty,
  Category,
  Size,
  UpdateTaskInput,
} from "../../../db/tasks.ts";

function isDifficulty(v: unknown): v is Difficulty {
  return v === "low" || v === "normal" || v === "high";
}

function isCategory(v: unknown): v is Category {
  return v === "general" || v === "work" || v === "personal" || v === "health";
}

function isSize(v: unknown): v is Size {
  return v === "tiny" || v === "small" || v === "medium" || v === "large";
}

function parseCreateTask(body: unknown): CreateTaskInput | { error: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return { error: "Invalid body" };
  const b = body as Record<string, unknown>;
  if (typeof b.title !== "string" || b.title.length < 1 || b.title.length > 200) {
    return { error: "title required (1-200 chars)" };
  }
  const trimmedTitle = b.title.trim();
  if (trimmedTitle.length === 0) return { error: "title cannot be empty" };
  const out: CreateTaskInput = { title: trimmedTitle };
  if (b.description !== undefined) {
    if (typeof b.description !== "string" || b.description.length > 2000) {
      return { error: "description max 2000 chars" };
    }
    const trimmedDesc = b.description.trim();
    if (trimmedDesc.length === 0) return { error: "description cannot be empty" };
    out.description = trimmedDesc;
  }
  if (b.difficulty !== undefined) {
    if (!isDifficulty(b.difficulty)) return { error: "difficulty must be low|normal|high" };
    out.difficulty = b.difficulty;
  }
  if (b.category !== undefined) {
    if (!isCategory(b.category)) return { error: "category must be general|work|personal|health" };
    out.category = b.category;
  }
  if (b.size !== undefined) {
    if (!isSize(b.size)) return { error: "size must be tiny|small|medium|large" };
    out.size = b.size;
  }
  if (b.deadline !== undefined && b.deadline !== null) {
    const ds = typeof b.deadline === "string" ? b.deadline : String(b.deadline);
    const d = new Date(ds);
    if (isNaN(d.getTime())) return { error: "invalid deadline" };
    const now = new Date();
    const maxFuture = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate());
    if (d < now) return { error: "deadline must be in the future" };
    if (d > maxFuture) return { error: "deadline too far in the future" };
    out.deadline = d;
  }
  return out;
}

function parseUpdateTask(body: unknown): UpdateTaskInput | { error: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return { error: "Invalid body" };
  const b = body as Record<string, unknown>;
  const out: UpdateTaskInput = {};
  if (b.title !== undefined) {
    if (typeof b.title !== "string" || b.title.length < 1 || b.title.length > 200) {
      return { error: "title must be 1-200 chars" };
    }
    const trimmed = b.title.trim();
    if (trimmed.length === 0) return { error: "title cannot be empty" };
    out.title = trimmed;
  }
  if (b.description !== undefined) {
    if (b.description === null) {
      out.description = null;
    } else if (typeof b.description !== "string" || b.description.length > 2000) {
      return { error: "description max 2000 chars" };
    } else {
      const trimmed = b.description.trim();
      if (trimmed.length === 0) return { error: "description cannot be empty" };
      out.description = trimmed;
    }
  }
  if (b.difficulty !== undefined) {
    if (!isDifficulty(b.difficulty)) return { error: "difficulty must be low|normal|high" };
    out.difficulty = b.difficulty;
  }
  if (b.category !== undefined) {
    if (!isCategory(b.category)) return { error: "category must be general|work|personal|health" };
    out.category = b.category;
  }
  if (b.size !== undefined) {
    if (!isSize(b.size)) return { error: "size must be tiny|small|medium|large" };
    out.size = b.size;
  }
  if (b.deadline !== undefined) {
    if (b.deadline === null) {
      out.deadline = null;
    } else {
      const ds = typeof b.deadline === "string" ? b.deadline : String(b.deadline);
      const d = new Date(ds);
      if (isNaN(d.getTime())) return { error: "invalid deadline" };
      const now = new Date();
      const maxFuture = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate());
      if (d > maxFuture) return { error: "deadline too far in the future" };
      out.deadline = d;
    }
  }
  if (Object.keys(out).length === 0) return { error: "no fields to update" };
  return out;
}

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
  return json({ tasks });
}

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
