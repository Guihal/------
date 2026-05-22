import { handleGetItems } from "./handlers/list.ts";
import { handlePostItem } from "./handlers/create.ts";
import { handlePutItem } from "./handlers/update.ts";
import { handleDeleteItem } from "./handlers/delete.ts";
import { requireAuth, json } from "../../shared.ts";
import { requireAdmin } from "../../../security/jwt.ts";

function adminGuard(req: Request): Response | undefined {
  let ctx;
  try {
    ctx = requireAuth(req);
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 401;
    return json({ error: (err as Error).message }, status);
  }
  try {
    requireAdmin(ctx.role);
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 403;
    return json({ error: (err as Error).message }, status);
  }
  return undefined;
}

export async function handleAdminItems(req: Request, pathname: string): Promise<Response | undefined> {
  if (pathname === "/admin/items" && req.method === "GET") {
    const guard = adminGuard(req);
    if (guard) return guard;
    return handleGetItems(req);
  }
  if (pathname === "/admin/items" && req.method === "POST") {
    const guard = adminGuard(req);
    if (guard) return guard;
    return handlePostItem(req);
  }
  const itemMatch = pathname.match(/^\/admin\/items\/(\d+)$/);
  if (itemMatch && req.method === "PUT") {
    const guard = adminGuard(req);
    if (guard) return guard;
    return handlePutItem(req, Number(itemMatch[1]));
  }
  if (itemMatch && req.method === "DELETE") {
    const guard = adminGuard(req);
    if (guard) return guard;
    return handleDeleteItem(req, Number(itemMatch[1]));
  }
  return undefined;
}
