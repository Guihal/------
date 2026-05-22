import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../../security/jwt.ts";
import {
  findSessionByRefreshToken,
  deleteSessionById,
  createSession,
  generateRefreshToken,
  deleteAllUserSessions,
} from "../../../db/sessions.ts";
import { audit } from "../../../db/audit.ts";
import { getClientIp, json, bad, unauthorized } from "../router.ts";

export async function handleRefresh(req: Request): Promise<Response> {
  let body: { refresh_token?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body ok */
  }
  const token = body.refresh_token;
  if (!token) return bad("refresh_token required");

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    return unauthorized("Invalid refresh token");
  }
  if (payload.type !== "refresh") return unauthorized("Invalid token type");

  const session = await findSessionByRefreshToken(token);
  if (!session) {
    try {
      const decoded = verifyRefreshToken(token);
      if (decoded.sub) {
        await deleteAllUserSessions(decoded.sub);
        await audit({ userId: decoded.sub, action: "refresh_reuse_detected", ipAddress: getClientIp(req) });
      }
    } catch {
      /* ignore decode errors */
    }
    return unauthorized("Session revoked or expired");
  }

  await deleteSessionById(session.id);
  const newRefreshPlain = generateRefreshToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  const accessToken = signAccessToken(session.user_id, payload.role);
  const newRefreshJwt = signRefreshToken(session.user_id, payload.role, newRefreshPlain);
  await createSession(session.user_id, newRefreshPlain, expiresAt);

  await audit({ userId: session.user_id, action: "refresh", ipAddress: getClientIp(req) });

  return json({
    access_token: accessToken,
    refresh_token: newRefreshJwt,
    token_type: "Bearer",
    expires_in: 900,
  });
}
