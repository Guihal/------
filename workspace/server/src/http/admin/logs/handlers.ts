import { requireAuth, json, bad } from "../../shared.ts";
import { requireAdmin } from "../../../security/jwt.ts";
import { query } from "../../../db/client.ts";

interface AuditLogRow {
  id: number;
  user_id: number | null;
  action: string;
  details: string | null;
  ip_address: string | null;
  created_at: Date;
}

export async function handleGetLogs(req: Request): Promise<Response> {
  let ctx;
  try {
    ctx = requireAuth(req);
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 401;
    return json({ error: (err as Error).message }, status);
  }

  try {
    requireAdmin(ctx.role);
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 403;
    return json({ error: (err as Error).message }, status);
  }

  const url = new URL(req.url);
  const limitParam = url.searchParams.get("limit");
  const offsetParam = url.searchParams.get("offset");

  const limit = Math.min(Math.max(Number(limitParam ?? 50), 1), 200);
  const offset = Math.max(Number(offsetParam ?? 0), 0);

  if (!Number.isFinite(limit) || !Number.isFinite(offset)) {
    return bad("Invalid pagination params");
  }

  const countResult = await query<{ count: string }>(`SELECT COUNT(*)::text as count FROM audit_logs`);
  const total = Number(countResult[0]?.count ?? 0);

  const rows = await query<AuditLogRow>(
    `SELECT id, user_id, action, details, ip_address, created_at
     FROM audit_logs
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const logs = rows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    action: r.action,
    details: r.details ? JSON.parse(r.details) : null,
    ip_address: r.ip_address,
    created_at: r.created_at.toISOString(),
  }));

  return json({
    logs,
    pagination: { total, limit, offset },
  });
}
