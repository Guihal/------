import jwt from "jsonwebtoken";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

const ACCESS_SECRET = requireEnv("JWT_ACCESS_SECRET");
const REFRESH_SECRET = requireEnv("JWT_REFRESH_SECRET");
const ACCESS_TTL = 60 * 15; // 15 minutes
const REFRESH_TTL = 60 * 60 * 24 * 7; // 7 days

export type Role = "user" | "admin";

export interface TokenPayload {
  sub: number; // user id
  role: Role;
  jti?: string; // refresh token id
  type: "access" | "refresh";
}

function isValidRole(v: unknown): v is Role {
  return v === "user" || v === "admin";
}

function assertTokenPayload(raw: unknown): TokenPayload {
  if (typeof raw !== "object" || raw === null) throw new Error("Invalid token payload");
  const p = raw as Record<string, unknown>;
  if (typeof p.sub !== "number") throw new Error("Invalid token sub");
  if (!isValidRole(p.role)) throw new Error("Invalid token role");
  if (p.type !== "access" && p.type !== "refresh") throw new Error("Invalid token type");
  return p as unknown as TokenPayload;
}

export function signAccessToken(userId: number, role: Role): string {
  return jwt.sign({ sub: userId, role, type: "access" } as TokenPayload, ACCESS_SECRET, {
    expiresIn: ACCESS_TTL,
  });
}

export function signRefreshToken(userId: number, role: Role, jti: string): string {
  return jwt.sign({ sub: userId, role, jti, type: "refresh" } as TokenPayload, REFRESH_SECRET, {
    expiresIn: REFRESH_TTL,
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  const raw = jwt.verify(token, ACCESS_SECRET, { clockTolerance: 5 });
  return assertTokenPayload(raw);
}

export function verifyRefreshToken(token: string): TokenPayload {
  const raw = jwt.verify(token, REFRESH_SECRET, { clockTolerance: 5 });
  return assertTokenPayload(raw);
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload | null;
  } catch {
    return null;
  }
}

export function isAdmin(role: Role): boolean {
  return role === "admin";
}

export function requireAdmin(role: Role): void {
  if (!isAdmin(role)) {
    const err = new Error("Forbidden: admin role required");
    (err as Error & { statusCode?: number }).statusCode = 403;
    throw err;
  }
}
