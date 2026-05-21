import { query } from "./client.ts";

export interface AuditEntry {
  userId?: number;
  action: string;
  details?: Record<string, unknown>;
  ipAddress?: string | undefined;
}

export async function audit(entry: AuditEntry): Promise<void> {
  await query(
    `INSERT INTO audit_logs (user_id, action, details, ip_address)
     VALUES ($1, $2, $3, $4)`,
    [
      entry.userId ?? null,
      entry.action,
      entry.details ? JSON.stringify(entry.details) : null,
      entry.ipAddress ?? null,
    ]
  );
}
