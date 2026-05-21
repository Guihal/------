import { requireAuth, json } from "../../shared.ts";
import { ensureProgression } from "../../../db/progressions.ts";

export async function handleGetProgression(req: Request): Promise<Response> {
  let ctx;
  try {
    ctx = requireAuth(req);
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 401;
    return json({ error: (err as Error).message }, status);
  }
  const prog = await ensureProgression(ctx.userId);
  return json({
    xp: prog.xp,
    level: prog.level,
    next_level_xp: (prog.level) ** 2 * 100,
  });
}
