import { handleAdminItems } from "./items/router.ts";

export async function handleAdmin(req: Request, pathname: string): Promise<Response | undefined> {
  const itemsResp = await handleAdminItems(req, pathname);
  if (itemsResp) return itemsResp;
  return undefined;
}
