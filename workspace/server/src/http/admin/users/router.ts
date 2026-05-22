import { handleGetUsers } from "./handlers.ts";

export async function handleAdminUsers(req: Request, pathname: string): Promise<Response | undefined> {
  if (pathname === "/admin/users" && req.method === "GET") {
    return handleGetUsers(req);
  }
  return undefined;
}
