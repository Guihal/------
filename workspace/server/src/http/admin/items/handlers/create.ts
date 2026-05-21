import { json, bad } from "../../../shared.ts";
import { createItem } from "../../../../db/items.ts";
import { saveAsset } from "../../../../storage/assets.ts";

function isValidBody(body: unknown): body is Record<string, unknown> {
  return typeof body === "object" && body !== null && !Array.isArray(body);
}

function parseCreateItem(body: unknown): { name: string; description?: string; rarity?: string } | { error: string } {
  if (!isValidBody(body)) return { error: "Invalid body" };
  if (typeof body.name !== "string" || body.name.length < 1 || body.name.length > 100) {
    return { error: "name required (1-100 chars)" };
  }
  const out: { name: string; description?: string; rarity?: string } = { name: body.name.trim() };
  if (body.description !== undefined) {
    if (typeof body.description !== "string" || body.description.length > 2000) {
      return { error: "description max 2000 chars" };
    }
    out.description = body.description.trim();
  }
  if (body.rarity !== undefined) {
    const r = String(body.rarity);
    if (!["common", "rare", "epic", "legendary"].includes(r)) {
      return { error: "rarity must be common|rare|epic|legendary" };
    }
    out.rarity = r;
  }
  return out;
}

export async function handlePostItem(req: Request): Promise<Response> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    const name = form.get("name");
    const description = form.get("description");
    const rarity = form.get("rarity");
    const file = form.get("asset");
    if (typeof name !== "string" || name.length < 1 || name.length > 100) {
      return bad("name required (1-100 chars)");
    }
    const parsed: { name: string; description?: string; rarity?: string; asset_url?: string | null } = { name: name.trim() };
    if (typeof description === "string") parsed.description = description.trim();
    if (typeof rarity === "string") {
      if (!["common", "rare", "epic", "legendary"].includes(rarity)) return bad("rarity must be common|rare|epic|legendary");
      parsed.rarity = rarity;
    }
    if (file instanceof File) {
      const asset = await saveAsset(file);
      if ("error" in asset) return bad(asset.error);
      parsed.asset_url = asset.url;
    }
    const item = await createItem(parsed);
    return json({ item }, 201);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid JSON");
  }
  const parsed = parseCreateItem(body);
  if ("error" in parsed) return bad(parsed.error);
  const item = await createItem(parsed);
  return json({ item }, 201);
}
