import { requireAuth, json } from "../../shared.ts";
import { requireAdmin } from "../../../security/jwt.ts";
import { listUsers } from "../../../db/users.ts";

export async function handleGetUsers(req: Request): Promise<Response> {
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

  const rows = await listUsers();
  return json({
    users: rows.map((r) => ({
      id: r.id,
      email: r.email,
      role: r.role,
      created_at: r.created_at.toISOString(),
    })),
  });
}
