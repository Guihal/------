import { findUserById } from "../../../db/users.ts";
import { requireAuth } from "../router.ts";
import { json, unauthorized } from "../utils.ts";

export async function handleMe(req: Request): Promise<Response> {
  let ctx;
  try {
    ctx = requireAuth(req);
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 401;
    return json({ error: (err as Error).message }, status);
  }
  const user = await findUserById(ctx.userId);
  if (!user) return unauthorized();
  return json({ id: user.id, email: user.email, role: user.role });
}
