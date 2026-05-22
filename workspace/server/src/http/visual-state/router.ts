import { requireAuth, json } from "../shared.ts";
import { findProfileByUserId } from "../../db/profiles.ts";
import { findProgressionByUserId } from "../../db/progressions.ts";
import { listUserItems } from "../../db/inventory.ts";
import { findItemById } from "../../db/items.ts";

export async function handleVisualState(req: Request, pathname: string): Promise<Response | undefined> {
  if (pathname === "/visual-state" && req.method === "GET") {
    let ctx;
    try {
      ctx = requireAuth(req);
    } catch (err) {
      const status = (err as Error & { statusCode?: number }).statusCode ?? 401;
      return json({ error: (err as Error).message }, status);
    }

    const profile = await findProfileByUserId(ctx.userId);
    const progression = await findProgressionByUserId(ctx.userId);
    const userItems = await listUserItems(ctx.userId);
    const equipped = userItems.find((ui) => ui.equipped);
    const equippedItem = equipped ? await findItemById(equipped.item_id) : null;

    return json({
      display_name: profile?.display_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      xp: progression?.xp ?? 0,
      level: progression?.level ?? 1,
      equipped_item: equippedItem
        ? {
            id: equippedItem.id,
            name: equippedItem.name,
            rarity: equippedItem.rarity,
            asset_url: equippedItem.asset_url,
          }
        : null,
    });
  }
  return undefined;
}
