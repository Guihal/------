import { verifyRefreshToken } from "../../../security/jwt.ts";
import { findSessionByRefreshToken, deleteSessionById } from "../../../db/sessions.ts";
import { audit } from "../../../db/audit.ts";
import { getClientIp, json } from "../utils.ts";

export async function handleLogout(req: Request): Promise<Response> {
  let body: { refresh_token?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body ok */
  }
  const token = body.refresh_token;
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      if (payload.type === "refresh") {
        const session = await findSessionByRefreshToken(token);
        if (session) {
          await deleteSessionById(session.id);
          await audit({ userId: session.user_id, action: "logout", ipAddress: getClientIp(req) });
        }
      }
    } catch {
      // ignore invalid token on logout
    }
  }
  return json({ ok: true });
}
