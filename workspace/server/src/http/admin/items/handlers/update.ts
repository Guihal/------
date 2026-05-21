import { json, bad } from "../../../shared.ts";
import { findItemById, updateItem } from "../../../../db/items.ts";
import { saveAsset } from "../../../../storage/assets.ts";

function isValidBody(body: unknown): body is Record<string, unknown> {
  return typeof body === "object" && body !== null && !Array.isArray(body);
}

function parseUpdateItem(body: unknown): { name?: string; description?: string | null; rarity?: string; asset_url?: string | null } | { error: string } {
  if (!isValidBody(body)) return { error: "Invalid body" };
  const out: { name?: string; description?: string | null; rarity?: string; asset_url?: string | null } = {};
  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.length < 1 || body.name.length > 100) {
      return { error: "name must be 1-100 chars" };
    }
    out.name = body.name.trim();
  }
  if (body.description !== undefined) {
    if (body.description === null) {
      out.description = null;
    } else if (typeof body.description !== "string" || body.description.length > 2000) {
      return { error: "description max 2000 chars" };
    } else {
      out.description = body.description.trim();
    }
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

export async function handlePutItem(req: Request, itemId: number): Promise<Response> {
  const existing = await findItemById(itemId);
  if (!existing) return json({ error: "Item not found" }, 404);

  const ct = req.headers.get("content-type") || "";
  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    const name = form.get("name");
    const description = form.get("description");
    const rarity = form.get("rarity");
    const file = form.get("asset");
    const parsed: { name?: string; description?: string | null; rarity?: string; asset_url?: string | null } = {};
    if (typeof name === "string") {
      if (name.length < 1 || name.length > 100) return bad("name must be 1-100 chars");
      parsed.name = name.trim();
    }
    if (typeof description === "string") parsed.description = description.trim();
    if (description === null) parsed.description = null;
    if (typeof rarity === "string") {
      if (!["common", "rare", "epic", "legendary"].includes(rarity)) return bad("rarity must be common|rare|epic|legendary");
      parsed.rarity = rarity;
    }
    if (file instanceof File) {
      const asset = await saveAsset(file);
      if ("error" in asset) return bad(asset.error);
      parsed.asset_url = asset.url;
    }
    if (Object.keys(parsed).length === 0) return bad("no fields to update");
    const item = await updateItem(itemId, parsed);
    return json({ item });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid JSON");
  }
  const parsed = parseUpdateItem(body);
  if ("error" in parsed) return bad(parsed.error);
  if (Object.keys(parsed).length === 0) return bad("no fields to update");
  const item = await updateItem(itemId, parsed);
  return json({ item });
}
