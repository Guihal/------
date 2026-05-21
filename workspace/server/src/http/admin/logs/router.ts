import { handleGetLogs } from "./handlers.ts";

export async function handleAdminLogs(req: Request, pathname: string): Promise<Response | undefined> {
  if (pathname === "/admin/logs" && req.method === "GET") {
    return handleGetLogs(req);
  }
  return undefined;
}
