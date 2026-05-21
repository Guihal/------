import crypto from "crypto";
import { query, queryOne } from "./client.ts";
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

function sha256(plain: string): string {
  return crypto.createHash("sha256").update(plain).digest("hex");
}

export async function createSession(userId: number, refreshTokenPlain: string, expiresAt: Date, client?: import("pg").PoolClient): Promise<SessionRow> {
  const hash = sha256(refreshTokenPlain);
  const sql = `INSERT INTO sessions (user_id, refresh_token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, refresh_token_hash, expires_at, created_at`;
  const params = [userId, hash, expiresAt];
  const row = client
    ? (await client.query(sql, params)).rows[0]
    : await queryOne<SessionRow>(sql, params);
  if (!row) throw new Error("Failed to create session");
  return row as SessionRow;
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

  return queryOne<SessionRow>(
    `SELECT id, user_id, refresh_token_hash, expires_at, created_at
     FROM sessions WHERE refresh_token_hash = $1 AND expires_at > NOW()`,
    [sha256(jti)]
  );
}

export async function deleteSessionById(id: number): Promise<void> {
  await query(`DELETE FROM sessions WHERE id = $1`, [id]);
}

export async function deleteAllUserSessions(userId: number): Promise<void> {
  await query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
}
