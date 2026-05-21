import { handleGetInventory } from "./handlers/list.ts";
import { handlePostEquip } from "./handlers/equip.ts";

export async function handleInventory(req: Request, pathname: string): Promise<Response | undefined> {
  if (pathname === "/inventory" && req.method === "GET") {
    return handleGetInventory(req);
  }
  if (pathname === "/inventory/equip" && req.method === "POST") {
    return handlePostEquip(req);
  }
  return undefined;
}
