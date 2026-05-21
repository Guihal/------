import { requireAuth, json, unauthorized } from "../../shared.ts";
import { findUserById } from "../../../db/users.ts";
import { findProfileByUserId, updateProfile } from "../../../db/profiles.ts";
import { findProgressionByUserId } from "../../../db/progressions.ts";
import { audit } from "../../../db/audit.ts";

function isValidBody(body: unknown): body is Record<string, unknown> {
  return typeof body === "object" && body !== null && !Array.isArray(body);
}

function parsePatchProfile(body: unknown): { display_name?: string; avatar_url?: string } | { error: string } {
  if (!isValidBody(body)) return { error: "Invalid body" };
  const out: { display_name?: string; avatar_url?: string } = {};
  if (body.display_name !== undefined) {
    if (typeof body.display_name !== "string" || body.display_name.length > 100) {
      return { error: "display_name max 100 chars" };
    }
    const trimmed = body.display_name.trim();
    if (trimmed.length === 0) return { error: "display_name cannot be empty" };
    out.display_name = trimmed;
  }
  if (body.avatar_url !== undefined) {
    if (typeof body.avatar_url !== "string" || body.avatar_url.length > 2048) {
      return { error: "avatar_url max 2048 chars" };
    }
    const trimmed = body.avatar_url.trim();
    if (trimmed.length === 0) return { error: "avatar_url cannot be empty" };
    out.avatar_url = trimmed;
  }
  if (Object.keys(out).length === 0) return { error: "no fields to update" };
  return out;
}

export async function handleGetProfile(req: Request): Promise<Response> {
  let ctx;
  try {
    ctx = requireAuth(req);
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 401;
    return json({ error: (err as Error).message }, status);
  }
  const user = await findUserById(ctx.userId);
  if (!user) return unauthorized("User not found");
  const profile = await findProfileByUserId(ctx.userId);
  const progression = await findProgressionByUserId(ctx.userId);
  return json({
    id: user.id,
    email: user.email,
    role: user.role,
    display_name: profile?.display_name ?? null,
    avatar_url: profile?.avatar_url ?? null,
    xp: progression?.xp ?? 0,
    level: progression?.level ?? 1,
  });
}

export async function handlePatchProfile(req: Request): Promise<Response> {
  let ctx;
  try {
    ctx = requireAuth(req);
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 401;
    return json({ error: (err as Error).message }, status);
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const parsed = parsePatchProfile(body);
  if ("error" in parsed) return json({ error: parsed.error }, 400);
  const updated = await updateProfile(ctx.userId, parsed);
  if (!updated) return json({ error: "Profile not found" }, 404);
  await audit({ userId: ctx.userId, action: "profile_updated", details: { fields: Object.keys(parsed) } });
  return json({ profile: updated });
}
