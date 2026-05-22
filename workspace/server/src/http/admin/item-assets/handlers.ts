import { requireAuth, json } from "../../shared.ts";
import { requireAdmin } from "../../../security/jwt.ts";
import { listItems } from "../../../db/items.ts";

export async function handleGetItemAssets(req: Request): Promise<Response> {
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

  const items = await listItems();
  return json({
    assets: items.map((i) => ({
      id: i.id,
      name: i.name,
      rarity: i.rarity,
      asset_url: i.asset_url,
    })),
  });
}
