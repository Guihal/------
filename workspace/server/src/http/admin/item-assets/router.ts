import { handleGetItemAssets } from "./handlers.ts";

export async function handleAdminItemAssets(req: Request, pathname: string): Promise<Response | undefined> {
  if (pathname === "/admin/item-assets" && req.method === "GET") {
    return handleGetItemAssets(req);
  }
  return undefined;
}
