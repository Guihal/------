import { handleGetItems } from "./handlers/list.ts";
import { handlePostItem } from "./handlers/create.ts";
import { handlePutItem } from "./handlers/update.ts";
import { handleDeleteItem } from "./handlers/delete.ts";

export async function handleAdminItems(req: Request, pathname: string): Promise<Response | undefined> {
  if (pathname === "/admin/items" && req.method === "GET") {
    return handleGetItems();
  }
  if (pathname === "/admin/items" && req.method === "POST") {
    return handlePostItem(req);
  }
  const itemMatch = pathname.match(/^\/admin\/items\/(\d+)$/);
  if (itemMatch && req.method === "PUT") {
    return handlePutItem(req, Number(itemMatch[1]));
  }
  if (itemMatch && req.method === "DELETE") {
    return handleDeleteItem(req, Number(itemMatch[1]));
  }
  return undefined;
}
