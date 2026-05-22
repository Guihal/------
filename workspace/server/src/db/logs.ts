import { query, queryOne } from "./client.ts";

export interface AuditLogRow {
  id: number;
  user_id: number | null;
  action: string;
  details: string | null;
  ip_address: string | null;
  created_at: Date;
}

export async function countAuditLogs(): Promise<number> {
  const r = await queryOne<{ count: string }>(`SELECT COUNT(*)::text as count FROM audit_logs`);
  return Number(r?.count ?? 0);
}

export async function listAuditLogs(limit: number, offset: number): Promise<AuditLogRow[]> {
  return query<AuditLogRow>(
    `SELECT id, user_id, action, details, ip_address, created_at
     FROM audit_logs
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
}
