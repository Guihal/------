import { requireAuth, json, bad } from "../../shared.ts";
import { equipItem, unequipItem, findUserItem } from "../../../db/inventory.ts";

export async function handlePostEquip(req: Request): Promise<Response> {
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
  const itemId = (body as Record<string, unknown>).item_id;
  if (itemId === null || itemId === undefined) {
    await unequipItem(ctx.userId);
    return json({ ok: true });
  }
  if (typeof itemId !== "number") return bad("item_id must be a number");
  const owned = await findUserItem(ctx.userId, itemId);
  if (!owned) return json({ error: "Item not owned" }, 404);
  const updated = await equipItem(ctx.userId, itemId);
  if (!updated) return json({ error: "Equip failed" }, 500);
  return json({ item: updated });
}
