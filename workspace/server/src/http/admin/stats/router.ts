import { handleGetStats, handleGetLevelStats, handleGetDropStats, handleGetTaskStats } from "./handlers.ts";

export async function handleAdminStats(req: Request, pathname: string): Promise<Response | undefined> {
  if (pathname === "/admin/stats" && req.method === "GET") {
    return handleGetStats(req);
  }
  if (pathname === "/admin/stats/levels" && req.method === "GET") {
    return handleGetLevelStats(req);
  }
  if (pathname === "/admin/stats/drops" && req.method === "GET") {
    return handleGetDropStats(req);
  }
  if (pathname === "/admin/stats/tasks" && req.method === "GET") {
    return handleGetTaskStats(req);
  }
  return undefined;
}
