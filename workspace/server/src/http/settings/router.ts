import { handleGetSettings, handlePutSettings } from "./handlers.ts";

export async function handleSettings(req: Request, pathname: string): Promise<Response | undefined> {
  if (pathname === "/settings" && req.method === "GET") {
    return handleGetSettings(req);
  }
  if (pathname === "/settings" && req.method === "PUT") {
    return handlePutSettings(req);
  }
  return undefined;
}
