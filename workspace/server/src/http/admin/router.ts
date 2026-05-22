import { handleAdminItems } from "./items/router.ts";
import { handleAdminStats } from "./stats/router.ts";
import { handleAdminLogs } from "./logs/router.ts";
import { handleAdminUsers } from "./users/router.ts";

export async function handleAdmin(req: Request, pathname: string): Promise<Response | undefined> {
  const itemsResp = await handleAdminItems(req, pathname);
  if (itemsResp) return itemsResp;
  const usersResp = await handleAdminUsers(req, pathname);
  if (usersResp) return usersResp;
  const statsResp = await handleAdminStats(req, pathname);
  if (statsResp) return statsResp;
  const logsResp = await handleAdminLogs(req, pathname);
  if (logsResp) return logsResp;
  return undefined;
}
