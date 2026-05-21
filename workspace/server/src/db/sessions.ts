import crypto from "crypto";
import { query, queryOne } from "./client.ts";
import { hashPassword, verifyPassword } from "../security/password.ts";
import jwt from "jsonwebtoken";

export interface SessionRow {
  id: number;
  user_id: number;
  refresh_token_hash: string;
  expires_at: Date;
  created_at: Date;
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export async function createSession(userId: number, refreshTokenPlain: string, expiresAt: Date): Promise<SessionRow> {
  const hash = await hashPassword(refreshTokenPlain);
  const row = await queryOne<SessionRow>(
    `INSERT INTO sessions (user_id, refresh_token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, refresh_token_hash, expires_at, created_at`,
    [userId, hash, expiresAt]
  );
  if (!row) throw new Error("Failed to create session");
  return row;
}

function extractJti(refreshJwt: string): string | undefined {
  try {
    const decoded = jwt.decode(refreshJwt) as { jti?: string } | null;
    return decoded?.jti;
  } catch {
    return undefined;
  }
}

export async function findSessionByRefreshToken(refreshJwt: string): Promise<SessionRow | undefined> {
  const jti = extractJti(refreshJwt);
  if (!jti) return undefined;

  const rows = await query<SessionRow>(
    `SELECT id, user_id, refresh_token_hash, expires_at, created_at
     FROM sessions WHERE expires_at > NOW()`
  );
  for (const row of rows) {
    if (await verifyPassword(jti, row.refresh_token_hash)) {
      return row;
    }
  }
  return undefined;
}

export async function deleteSessionById(id: number): Promise<void> {
  await query(`DELETE FROM sessions WHERE id = $1`, [id]);
}

export async function deleteAllUserSessions(userId: number): Promise<void> {
  await query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
}
