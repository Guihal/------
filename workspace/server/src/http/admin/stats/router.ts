import { handleGetStats } from "./handlers.ts";

export async function handleAdminStats(req: Request, pathname: string): Promise<Response | undefined> {
  if (pathname === "/admin/stats" && req.method === "GET") {
    return handleGetStats(req);
  }
  return undefined;
}
