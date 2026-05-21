import {
  requireAuth,
  getBearer,
  json,
  bad,
  unauthorized,
  getClientIp,
  checkRateLimit,
  rateLimitResponse,
} from "../shared.ts";
import { verifyAccessToken } from "../../security/jwt.ts";
import { findUserById } from "../../db/users.ts";
import { findProfileByUserId, updateProfile } from "../../db/profiles.ts";
import { findProgressionByUserId, addXp, ensureProgression } from "../../db/progressions.ts";
import { createTask, listTasksByUser, findTaskById, markTaskCompleted, markTaskArchived } from "../../db/tasks.ts";
import { computeTaskXp } from "../../domain/tasks/xp.ts";
import { audit } from "../../db/audit.ts";
import { withTransaction } from "../../db/client.ts";
import type { CreateTaskInput, Difficulty, Category, Size } from "../../db/tasks.ts";

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

function parsePatchProfile(body: unknown): { display_name?: string; avatar_url?: string } | { error: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return { error: "Invalid body" };
  const b = body as Record<string, unknown>;
  const out: { display_name?: string; avatar_url?: string } = {};
  if (b.display_name !== undefined) {
    if (typeof b.display_name !== "string" || b.display_name.length > 100) {
      return { error: "display_name max 100 chars" };
    }
    const trimmed = b.display_name.trim();
    if (trimmed.length === 0) return { error: "display_name cannot be empty" };
    out.display_name = trimmed;
  }
  if (b.avatar_url !== undefined) {
    if (typeof b.avatar_url !== "string" || b.avatar_url.length > 2048) {
      return { error: "avatar_url max 2048 chars" };
    }
    const trimmed = b.avatar_url.trim();
    if (trimmed.length === 0) return { error: "avatar_url cannot be empty" };
    out.avatar_url = trimmed;
  }
  if (Object.keys(out).length === 0) return { error: "no fields to update" };
  return out;
}

async function handleGetProfile(req: Request): Promise<Response> {
  let ctx;
  try {
    ctx = requireAuth(req);
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 401;
    return json({ error: (err as Error).message }, status);
  }
  const user = await findUserById(ctx.userId);
  if (!user) return unauthorized("User not found");
  const profile = await findProfileByUserId(ctx.userId);
  const progression = await findProgressionByUserId(ctx.userId);
  return json({
    id: user.id,
    email: user.email,
    role: user.role,
    display_name: profile?.display_name ?? null,
    avatar_url: profile?.avatar_url ?? null,
    xp: progression?.xp ?? 0,
    level: progression?.level ?? 1,
  });
}

async function handlePatchProfile(req: Request): Promise<Response> {
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
  const parsed = parsePatchProfile(body);
  if ("error" in parsed) return bad(parsed.error);
  const updated = await updateProfile(ctx.userId, parsed);
  if (!updated) return json({ error: "Profile not found" }, 404);
  await audit({ userId: ctx.userId, action: "profile_updated", details: { fields: Object.keys(parsed) } });
  return json({ profile: updated });
}

async function handleGetProgression(req: Request): Promise<Response> {
  let ctx;
  try {
    ctx = requireAuth(req);
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 401;
    return json({ error: (err as Error).message }, status);
  }
  const prog = await ensureProgression(ctx.userId);
  return json({
    xp: prog.xp,
    level: prog.level,
    next_level_xp: (prog.level) ** 2 * 100,
  });
}

async function handleGetTasks(req: Request): Promise<Response> {
  let ctx;
  try {
    ctx = requireAuth(req);
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 401;
    return json({ error: (err as Error).message }, status);
  }
  const tasks = await listTasksByUser(ctx.userId);
  return json({ tasks });
}

async function handlePostTasks(req: Request): Promise<Response> {
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

async function handlePatchTaskComplete(req: Request, taskId: number): Promise<Response> {
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

async function handlePatchTaskArchive(req: Request, taskId: number): Promise<Response> {
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

export async function handleTasks(req: Request, pathname: string): Promise<Response | undefined> {
  const ip = getClientIp(req) ?? "unknown";

  if (pathname === "/profile" && req.method === "GET") {
    return handleGetProfile(req);
  }
  if (pathname === "/profile" && req.method === "PATCH") {
    const rl = checkRateLimit(`${ip}:profile`);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);
    return handlePatchProfile(req);
  }
  if (pathname === "/progression" && req.method === "GET") {
    return handleGetProgression(req);
  }
  if (pathname === "/tasks" && req.method === "GET") {
    return handleGetTasks(req);
  }
  if (pathname === "/tasks" && req.method === "POST") {
    const rl = checkRateLimit(`${ip}:tasks`);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);
    return handlePostTasks(req);
  }
  const completeMatch = pathname.match(/^\/tasks\/(\d+)\/complete$/);
  if (completeMatch && req.method === "PATCH") {
    const rl = checkRateLimit(`${ip}:complete`);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);
    return handlePatchTaskComplete(req, Number(completeMatch[1]));
  }
  const archiveMatch = pathname.match(/^\/tasks\/(\d+)\/archive$/);
  if (archiveMatch && req.method === "PATCH") {
    const rl = checkRateLimit(`${ip}:archive`);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);
    return handlePatchTaskArchive(req, Number(archiveMatch[1]));
  }
  return undefined;
}
