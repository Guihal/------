import {
  getClientIp,
  checkRateLimit,
  rateLimitResponse,
} from "../shared.ts";
import { handleGetProfile, handlePatchProfile } from "./handlers/profile.ts";
import { handleGetProgression } from "./handlers/progression.ts";
import {
  handleGetTasks,
  handlePostTasks,
  handlePutTask,
  handleDeleteTask,
  handlePatchTaskComplete,
  handlePatchTaskArchive,
} from "./handlers/task-handlers.ts";

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
  const taskDetailMatch = pathname.match(/^\/tasks\/(\d+)$/);
  if (taskDetailMatch && req.method === "PUT") {
    const rl = checkRateLimit(`${ip}:tasks`);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);
    return handlePutTask(req, Number(taskDetailMatch[1]));
  }
  if (taskDetailMatch && req.method === "DELETE") {
    const rl = checkRateLimit(`${ip}:tasks`);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);
    return handleDeleteTask(req, Number(taskDetailMatch[1]));
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
