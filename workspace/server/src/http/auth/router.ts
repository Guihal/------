import { verifyAccessToken } from "../../security/jwt.ts";
import { getBearer, getClientIp, json } from "./utils.ts";
import { checkRateLimit } from "./handlers/rate-limit.ts";
import { handleRegister } from "./handlers/register.ts";
import { handleLogin } from "./handlers/login.ts";
import { handleRefresh } from "./handlers/refresh.ts";
import { handleLogout } from "./handlers/logout.ts";
import { handleMe } from "./handlers/me.ts";
import { handleUsers } from "./handlers/users.ts";
import type { Role } from "../../security/rbac.ts";

export interface AuthContext {
  userId: number;
  role: Role;
}

export function requireAuth(req: Request): AuthContext {
  const token = getBearer(req);
  if (!token) {
    const err = new Error("Missing Bearer token");
    (err as Error & { statusCode?: number }).statusCode = 401;
    throw err;
  }
  const payload = verifyAccessToken(token);
  if (payload.type !== "access") {
    const err = new Error("Invalid token type");
    (err as Error & { statusCode?: number }).statusCode = 401;
    throw err;
  }
  return { userId: payload.sub, role: payload.role };
}

function rateLimitResponse(retryAfter?: number): Response {
  return json({ error: "Too many requests", retry_after: retryAfter }, 429);
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
