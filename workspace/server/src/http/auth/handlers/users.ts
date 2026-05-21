import { listUsers } from "../../../db/users.ts";
import { requireAdmin } from "../../../security/rbac.ts";
import { requireAuth } from "../router.ts";
import { json } from "../utils.ts";

export async function handleUsers(req: Request): Promise<Response> {
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
  const users = await listUsers();
  return json({ users });
}
