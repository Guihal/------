import { hashPassword } from "../../../security/password.ts";
import { createUser, findUserByEmail } from "../../../db/users.ts";
import { audit } from "../../../db/audit.ts";
import { validateEmail, validatePassword, getClientIp, json, bad } from "../utils.ts";

export async function handleRegister(req: Request): Promise<Response> {
  const body = (await req.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  if (!email || !validateEmail(email)) return bad("Invalid email");
  if (!password || !validatePassword(password)) return bad("Invalid password (6-72 chars)");

  const existing = await findUserByEmail(email);
  if (existing) return bad("Email already registered", 409);

  const passwordHash = await hashPassword(password);
  const user = await createUser(email, passwordHash);
  await audit({ userId: user.id, action: "register", ipAddress: getClientIp(req) });

  return json({ id: user.id, email: user.email, role: user.role });
}
