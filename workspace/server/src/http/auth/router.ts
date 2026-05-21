import { verifyAccessToken, requireAdmin, type Role } from "../../security/jwt.ts";
import { handleRegister } from "./handlers/register.ts";
import { handleLogin } from "./handlers/login.ts";
import { handleRefresh } from "./handlers/refresh.ts";
import { handleLogout } from "./handlers/logout.ts";
import { findUserById, listUsers } from "../../db/users.ts";

export function validateEmail(email: string): boolean {
  if (email.length > 254) return false;
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(email);
}

export function validatePassword(password: string): boolean {
  return password.length >= 6 && password.length <= 72;
}

export function getClientIp(req: Request): string | undefined {
  const trustedProxy = process.env.TRUSTED_PROXY;
  if (trustedProxy === "1") {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim();
      if (first) return first;
    }
  }
  return (req as Request & { remoteAddress?: string }).remoteAddress ?? undefined;
}

export function getBearer(req: Request): string | undefined {
  const h = req.headers.get("authorization");
  if (!h) return undefined;
  const [scheme, token] = h.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return undefined;
  return token;
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export function bad(message: string, status = 400): Response {
  return json({ error: message }, status);
}

export function unauthorized(message = "Unauthorized"): Response {
  return json({ error: message }, 401);
}

const rateStore = new Map<string, { count: number; resetAt: number }>();
const RL_WINDOW = 15_000;
const RL_MAX = 5;

setInterval(() => {
  const now = Date.now();
  for (const [k, e] of rateStore) if (now > e.resetAt) rateStore.delete(k);
}, 60_000);

function checkRateLimit(key: string): { allowed: boolean; retryAfter?: number } {
  if (process.env.DISABLE_RATE_LIMIT === "1") return { allowed: true };
  const now = Date.now();
  const entry = rateStore.get(key);
  if (!entry || now > entry.resetAt) {
    rateStore.set(key, { count: 1, resetAt: now + RL_WINDOW });
    return { allowed: true };
  }
  if (entry.count >= RL_MAX) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { allowed: true };
}

export function clearRateLimit(): void {
  rateStore.clear();
}

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
