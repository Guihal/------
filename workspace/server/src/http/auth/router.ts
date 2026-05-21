import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from "../../security/jwt.ts";
import { hashPassword, verifyPassword } from "../../security/password.ts";
import { createUser, findUserByEmail, findUserById } from "../../db/users.ts";
import { createSession, findSessionByRefreshToken, deleteSessionById, generateRefreshToken } from "../../db/sessions.ts";
import { audit } from "../../db/audit.ts";
import type { Role } from "../../security/rbac.ts";

function getClientIp(req: Request): string | undefined {
  return req.headers.get("x-forwarded-for") ?? undefined;
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

function bad(message: string, status = 400): Response {
  return json({ error: message }, status);
}

function unauthorized(message = "Unauthorized"): Response {
  return json({ error: message }, 401);
}

function getBearer(req: Request): string | undefined {
  const h = req.headers.get("authorization");
  if (!h) return undefined;
  const [scheme, token] = h.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return undefined;
  return token;
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

export async function handleAuth(req: Request, pathname: string): Promise<Response | undefined> {
  if (pathname === "/auth/register" && req.method === "POST") {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    if (!email || !password || password.length < 6) {
      return bad("Invalid email or password (min 6 chars)");
    }
    const existing = await findUserByEmail(email);
    if (existing) return bad("Email already registered", 409);

    const passwordHash = await hashPassword(password);
    const user = await createUser(email, passwordHash);
    await audit({ userId: user.id, action: "register", ipAddress: getClientIp(req) });

    return json({ id: user.id, email: user.email, role: user.role });
  }

  if (pathname === "/auth/login" && req.method === "POST") {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    if (!email || !password) return bad("Email and password required");

    const user = await findUserByEmail(email);
    if (!user) return unauthorized("Invalid credentials");

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      await audit({ userId: user.id, action: "login_failed", ipAddress: getClientIp(req) });
      return unauthorized("Invalid credentials");
    }

    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
    const accessToken = signAccessToken(user.id, user.role);
    const refreshJwt = signRefreshToken(user.id, user.role, refreshToken);
    const session = await createSession(user.id, refreshJwt, expiresAt);

    await audit({ userId: user.id, action: "login", ipAddress: getClientIp(req) });

    return json({
      access_token: accessToken,
      refresh_token: refreshJwt,
      token_type: "Bearer",
      expires_in: 900,
      user: { id: user.id, email: user.email, role: user.role },
    });
  }

  if (pathname === "/auth/refresh" && req.method === "POST") {
    let body: { refresh_token?: string } = {};
    try { body = await req.json(); } catch { /* empty body ok */ }
    const token = body.refresh_token;
    if (!token) return bad("refresh_token required");

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      return unauthorized("Invalid refresh token");
    }
    if (payload.type !== "refresh") return unauthorized("Invalid token type");

    const session = await findSessionByRefreshToken(token);
    if (!session) return unauthorized("Session revoked or expired");

    // rotate: delete old session, create new one
    await deleteSessionById(session.id);
    const newRefreshPlain = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
    const accessToken = signAccessToken(session.user_id, payload.role);
    const newRefreshJwt = signRefreshToken(session.user_id, payload.role, newRefreshPlain);
    const newSession = await createSession(session.user_id, newRefreshJwt, expiresAt);

    await audit({ userId: session.user_id, action: "refresh", ipAddress: getClientIp(req) });

    return json({
      access_token: accessToken,
      refresh_token: newRefreshJwt,
      token_type: "Bearer",
      expires_in: 900,
    });
  }

  if (pathname === "/auth/logout" && req.method === "POST") {
    let body: { refresh_token?: string } = {};
    try { body = await req.json(); } catch { /* empty body ok */ }
    const token = body.refresh_token;
    if (token) {
      try {
        const payload = verifyRefreshToken(token);
        if (payload.type === "refresh") {
          const session = await findSessionByRefreshToken(token);
          if (session) {
            await deleteSessionById(session.id);
            await audit({ userId: session.user_id, action: "logout", ipAddress: getClientIp(req) });
          }
        }
      } catch {
        // ignore invalid token on logout
      }
    }
    return json({ ok: true });
  }

  if (pathname === "/auth/me" && req.method === "GET") {
    let ctx: AuthContext;
    try {
      ctx = requireAuth(req);
    } catch (err) {
      const status = (err as Error & { statusCode?: number }).statusCode ?? 401;
      return json({ error: (err as Error).message }, status);
    }
    const user = await findUserById(ctx.userId);
    if (!user) return unauthorized();
    return json({ id: user.id, email: user.email, role: user.role });
  }

  return undefined;
}
