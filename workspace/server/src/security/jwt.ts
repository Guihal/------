import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "dev-access-secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret";
const ACCESS_TTL = 60 * 15; // 15 minutes
const REFRESH_TTL = 60 * 60 * 24 * 7; // 7 days

export interface TokenPayload {
  sub: number; // user id
  role: "user" | "admin";
  jti?: string; // refresh token id
  type: "access" | "refresh";
}

export function signAccessToken(userId: number, role: "user" | "admin"): string {
  return jwt.sign({ sub: userId, role, type: "access" } as TokenPayload, ACCESS_SECRET, {
    expiresIn: ACCESS_TTL,
  });
}

export function signRefreshToken(userId: number, role: "user" | "admin", jti: string): string {
  return jwt.sign({ sub: userId, role, jti, type: "refresh" } as TokenPayload, REFRESH_SECRET, {
    expiresIn: REFRESH_TTL,
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET, { clockTolerance: 5 }) as unknown as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, REFRESH_SECRET, { clockTolerance: 5 }) as unknown as TokenPayload;
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload | null;
  } catch {
    return null;
  }
}
