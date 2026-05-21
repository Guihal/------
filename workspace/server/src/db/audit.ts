import { query } from "./client.ts";
import type { PoolClient } from "pg";

export interface AuditEntry {
  userId?: number;
  action: string;
  details?: Record<string, unknown>;
  ipAddress?: string | undefined;
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
  const remote = (req as unknown as Record<string, unknown>).remoteAddress;
  if (typeof remote === "string") return remote;
  return undefined;
}

export async function audit(entry: AuditEntry, client?: PoolClient): Promise<void> {
  const sql = `INSERT INTO audit_logs (user_id, action, details, ip_address)
     VALUES ($1, $2, $3, $4)`;
  const params = [
    entry.userId ?? null,
    entry.action,
    entry.details ? JSON.stringify(entry.details) : null,
    entry.ipAddress ?? null,
  ];
  if (client) {
    await client.query(sql, params);
  } else {
    await query(sql, params);
  }
}
