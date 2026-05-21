import { verifyAccessToken, requireAdmin } from "../../security/jwt.ts";
import { handleRegister } from "./handlers/register.ts";
import { handleLogin } from "./handlers/login.ts";
import { handleRefresh } from "./handlers/refresh.ts";
import { handleLogout } from "./handlers/logout.ts";
import { findUserById, listUsers } from "../../db/users.ts";
import { getClientIp } from "../../db/audit.ts";
import {
  checkRateLimit,
  rateLimitResponse,
  requireAuth,
  json,
  bad,
  unauthorized,
} from "../shared.ts";

// Re-export shared utilities for backward compatibility with auth handlers and tests
export { getClientIp } from "../../db/audit.ts";
export { clearRateLimit } from "../shared.ts";
export { json, bad, unauthorized } from "../shared.ts";

export function validateEmail(email: string): boolean {
  if (email.length > 254) return false;
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(email);
}

export function validatePassword(password: string): boolean {
  return password.length >= 6 && password.length <= 72;
}

async function handleMe(req: Request): Promise<Response> {
  let ctx;
  try {
    ctx = requireAuth(req);
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 401;
    return json({ error: (err as Error).message }, status);
  }
  const user = await findUserById(ctx.userId);
  if (!user) return json({ error: "Unauthorized" }, 401);
  return json({ id: user.id, email: user.email, role: user.role });
}

async function handleUsers(req: Request): Promise<Response> {
  let ctx;
  try {
    ctx = requireAuth(req);
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 401;
    return json({ error: (err as Error).message }, status);
  }
  try {
    requireAdmin(ctx.role);
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 403;
    return json({ error: (err as Error).message }, status);
  }
  const users = await listUsers();
  return json({ users });
}

export async function handleAuth(req: Request, pathname: string): Promise<Response | undefined> {
  const ip = getClientIp(req) ?? "unknown";

  if (pathname === "/auth/register" && req.method === "POST") {
    const rl = checkRateLimit(`${ip}:register`);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);
    return handleRegister(req);
  }

  if (pathname === "/auth/login" && req.method === "POST") {
    const rl = checkRateLimit(`${ip}:login`);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);
    return handleLogin(req);
  }

  if (pathname === "/auth/refresh" && req.method === "POST") {
    const rl = checkRateLimit(`${ip}:refresh`);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);
    return handleRefresh(req);
  }

  if (pathname === "/auth/logout" && req.method === "POST") {
    return handleLogout(req);
  }

  if (pathname === "/auth/me" && req.method === "GET") {
    return handleMe(req);
  }

  if (pathname === "/auth/users" && req.method === "GET") {
    return handleUsers(req);
  }

  return undefined;
}
