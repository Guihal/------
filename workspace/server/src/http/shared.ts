import { verifyAccessToken } from "../security/jwt.ts";
import { getClientIp as _getClientIp } from "../db/audit.ts";
import type { Role } from "../security/jwt.ts";

export { _getClientIp as getClientIp };

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

const rateStore = new Map<string, { count: number; resetAt: number }>();
const RL_WINDOW = 15_000;
const RL_MAX = 5;

setInterval(() => {
  const now = Date.now();
  for (const [k, e] of rateStore) if (now > e.resetAt) rateStore.delete(k);
}, 60_000);

export function checkRateLimit(key: string): { allowed: boolean; retryAfter?: number } {
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

export function rateLimitResponse(retryAfter?: number): Response {
  return json({ error: "Too many requests", retry_after: retryAfter }, 429);
}

export function clearRateLimit(): void {
  rateStore.clear();
}
