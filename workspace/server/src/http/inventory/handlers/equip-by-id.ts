import { requireAuth, json, bad } from "../../shared.ts";
import { queryOne } from "../../../db/client.ts";
import { equipItem, unequipItem } from "../../../db/inventory.ts";
import type { UserItemRow } from "../../../db/inventory.ts";

export async function handlePostEquipById(req: Request, userItemId: number): Promise<Response> {
  let ctx;
  try {
    ctx = requireAuth(req);
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 401;
    return json({ error: (err as Error).message }, status);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid JSON");
  }
  if (!body || typeof body !== "object") return bad("Invalid body");

  const owned = await queryOne<UserItemRow>(
    `SELECT id, user_id, item_id, quantity, equipped, created_at, updated_at
     FROM user_items WHERE id = $1 AND user_id = $2`,
    [userItemId, ctx.userId]
  );
  if (!owned) return json({ error: "Item not found" }, 404);

  const equip = (body as Record<string, unknown>).equip;
  if (equip === false) {
    await unequipItem(ctx.userId);
    return json({ ok: true });
  }

  const updated = await equipItem(ctx.userId, owned.item_id);
  if (!updated) return json({ error: "Equip failed" }, 500);
  return json({ item: updated });
}
