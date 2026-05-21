import { json } from "../../../shared.ts";
import { findItemById, deleteItem } from "../../../../db/items.ts";

export async function handleDeleteItem(_req: Request, itemId: number): Promise<Response> {
  const existing = await findItemById(itemId);
  if (!existing) return json({ error: "Item not found" }, 404);
  await deleteItem(itemId);
  return json({ ok: true });
}
