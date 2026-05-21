import { requireAuth, json, bad } from "../shared.ts";
import { ensureSettingsTable, getOrCreateSettings, updateSettings } from "./db.ts";

export async function handleGetSettings(req: Request): Promise<Response> {
  let ctx;
  try {
    ctx = requireAuth(req);
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 401;
    return json({ error: (err as Error).message }, status);
  }

  await ensureSettingsTable();
  const settings = await getOrCreateSettings(ctx.userId);
  return json({ settings });
}

function isValidBody(body: unknown): body is Record<string, unknown> {
  return typeof body === "object" && body !== null && !Array.isArray(body);
}

export async function handlePutSettings(req: Request): Promise<Response> {
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
    return bad("Invalid JSON");
  }

  if (!isValidBody(body)) return bad("Invalid body");

  const updates: Parameters<typeof updateSettings>[1] = {};

  if (body.theme !== undefined) {
    if (typeof body.theme !== "string" || body.theme.length > 20) {
      return bad("theme must be a string ≤20 chars");
    }
    updates.theme = body.theme;
  }

  if (body.language !== undefined) {
    if (typeof body.language !== "string" || body.language.length > 10) {
      return bad("language must be a string ≤10 chars");
    }
    updates.language = body.language;
  }

  if (body.notifications_enabled !== undefined) {
    if (typeof body.notifications_enabled !== "boolean") {
      return bad("notifications_enabled must be boolean");
    }
    updates.notifications_enabled = body.notifications_enabled;
  }

  if (body.reminder_time !== undefined) {
    if (body.reminder_time !== null && (typeof body.reminder_time !== "string" || body.reminder_time.length > 10)) {
      return bad("reminder_time must be null or string ≤10 chars");
    }
    updates.reminder_time = body.reminder_time as string | null;
  }

  await ensureSettingsTable();
  await getOrCreateSettings(ctx.userId);
  const settings = await updateSettings(ctx.userId, updates);
  if (!settings) return json({ error: "Settings not found" }, 404);

  return json({ settings });
}
