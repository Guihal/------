import { signAccessToken, signRefreshToken } from "../../../security/jwt.ts";
import { findUserByEmail } from "../../../db/users.ts";
import { createSession, generateRefreshToken } from "../../../db/sessions.ts";
import { audit } from "../../../db/audit.ts";
import { verifyPassword } from "../../../security/password.ts";
import { getClientIp, json, bad, unauthorized } from "../utils.ts";

export async function handleLogin(req: Request): Promise<Response> {
  const body = (await req.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  if (!email || !password) return bad("Email and password required");

  const user = await findUserByEmail(email);
  if (!user) return unauthorized("Invalid credentials");

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    await audit({ userId: user.id, action: "login_failed", ipAddress: getClientIp(req) });
    return unauthorized("Invalid credentials");
  }

  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  const accessToken = signAccessToken(user.id, user.role);
  const refreshJwt = signRefreshToken(user.id, user.role, refreshToken);
  await createSession(user.id, refreshToken, expiresAt);

  await audit({ userId: user.id, action: "login", ipAddress: getClientIp(req) });

  return json({
    access_token: accessToken,
    refresh_token: refreshJwt,
    token_type: "Bearer",
    expires_in: 900,
    user: { id: user.id, email: user.email, role: user.role },
  });
}
