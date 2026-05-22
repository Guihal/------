import { handleGetInventory } from "./handlers/list.ts";
import { handlePostEquip } from "./handlers/equip.ts";
import { handlePostEquipById } from "./handlers/equip-by-id.ts";

export async function handleInventory(req: Request, pathname: string): Promise<Response | undefined> {
  if (pathname === "/inventory" && req.method === "GET") {
    return handleGetInventory(req);
  }
  if (pathname === "/inventory/equip" && req.method === "POST") {
    return handlePostEquip(req);
  }
  const equipMatch = pathname.match(/^\/inventory\/(\d+)\/equip$/);
  if (equipMatch && req.method === "POST") {
    return handlePostEquipById(req, Number(equipMatch[1]));
  }
  return undefined;
}
