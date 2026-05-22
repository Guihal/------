import { json } from "../../../shared.ts";
import { listItems, searchItems } from "../../../../db/items.ts";

export async function handleGetItems(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const search = url.searchParams.get("search");
  const items = search ? await searchItems(search) : await listItems();
  return json({ items });
}
