import { handleGetUsers, handleGetUserById } from "./handlers.ts";

export async function handleAdminUsers(req: Request, pathname: string): Promise<Response | undefined> {
  if (pathname === "/admin/users" && req.method === "GET") {
    return handleGetUsers(req);
  }
  const userMatch = pathname.match(/^\/admin\/users\/(\d+)$/);
  if (userMatch && req.method === "GET") {
    return handleGetUserById(req, Number(userMatch[1]));
  }
  return undefined;
}
