import { requireAuth, json } from "../../shared.ts";
import { requireAdmin } from "../../../security/jwt.ts";
import { listUsers, findUserById } from "../../../db/users.ts";
import { findProfileByUserId } from "../../../db/profiles.ts";
import { findProgressionByUserId } from "../../../db/progressions.ts";

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

export async function handleGetUserById(req: Request, userId: number): Promise<Response> {
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

  const user = await findUserById(userId);
  if (!user) return json({ error: "User not found" }, 404);

  const profile = await findProfileByUserId(userId);
  const progression = await findProgressionByUserId(userId);

  return json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      created_at: user.created_at.toISOString(),
      display_name: profile?.display_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      xp: progression?.xp ?? 0,
      level: progression?.level ?? 1,
    },
  });
}
