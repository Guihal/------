import { requireAuth, json, bad } from "../../shared.ts";
import { requireAdmin } from "../../../security/jwt.ts";
import { countAuditLogs, listAuditLogs } from "../../../db/logs.ts";

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

  const total = await countAuditLogs();
  const rows = await listAuditLogs(limit, offset);

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
