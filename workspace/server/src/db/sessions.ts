import crypto from "crypto";
import { query, queryOne } from "./client.ts";
import { hashPassword, verifyPassword } from "../security/password.ts";

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

export async function createSession(userId: number, refreshToken: string, expiresAt: Date): Promise<SessionRow> {
  const hash = await hashPassword(refreshToken);
  const row = await queryOne<SessionRow>(
    `INSERT INTO sessions (user_id, refresh_token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, refresh_token_hash, expires_at, created_at`,
    [userId, hash, expiresAt]
  );
  if (!row) throw new Error("Failed to create session");
  return row;
}

export async function findSessionByRefreshToken(refreshToken: string): Promise<SessionRow | undefined> {
  // We hash every candidate and compare; for speed we iterate rows.
  // In production with many sessions add a lookup prefix or use HMAC.
  const rows = await query<SessionRow>(
    `SELECT id, user_id, refresh_token_hash, expires_at, created_at
     FROM sessions WHERE expires_at > NOW()`
  );
  for (const row of rows) {
    if (await verifyPassword(refreshToken, row.refresh_token_hash)) {
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
