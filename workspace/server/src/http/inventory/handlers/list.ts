import { requireAuth, json } from "../../../shared.ts";
import { listUserItems } from "../../../../db/inventory.ts";
import { findItemById } from "../../../../db/items.ts";

export async function handleGetInventory(req: Request): Promise<Response> {
  let ctx;
  try {
    ctx = requireAuth(req);
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 401;
    return json({ error: (err as Error).message }, status);
  }
  const userItems = await listUserItems(ctx.userId);
  const enriched = await Promise.all(
    userItems.map(async (ui) => {
      const item = await findItemById(ui.item_id);
      return {
        id: ui.id,
        item_id: ui.item_id,
        name: item?.name ?? "Unknown",
        rarity: item?.rarity ?? "common",
        asset_url: item?.asset_url ?? null,
        quantity: ui.quantity,
        equipped: ui.equipped,
      };
    })
  );
  return json({ items: enriched });
}
