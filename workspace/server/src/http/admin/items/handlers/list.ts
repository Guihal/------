import { json } from "../../../shared.ts";
import { listItems } from "../../../../db/items.ts";

export async function handleGetItems(): Promise<Response> {
  const items = await listItems();
  return json({ items });
}
