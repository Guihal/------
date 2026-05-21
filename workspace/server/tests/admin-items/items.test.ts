import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { serve } from "bun";
import { migrate } from "../../src/db/schema.ts";
import { pool } from "../../src/db/client.ts";
import { handleAdmin } from "../../src/http/admin/router.ts";

let server: ReturnType<typeof serve>;
const BASE = "http://localhost:3004";

beforeAll(async () => {
  await migrate();
  await pool.query("DELETE FROM items");
  server = serve({
    port: 3004,
    async fetch(req) {
      const url = new URL(req.url);
      const resp = await handleAdmin(req, url.pathname);
      if (resp) return resp;
      return Response.json({ error: "not_found" }, { status: 404 });
    },
  });
});

afterAll(async () => {
  server.stop();
  await pool.query("DELETE FROM items");
});

async function postJson(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

async function putJson(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

async function del(path: string) {
  const res = await fetch(`${BASE}${path}`, { method: "DELETE" });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

async function get(path: string) {
  const res = await fetch(`${BASE}${path}`);
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

describe("admin items", () => {
  it("lists empty items", async () => {
    const { status, json } = await get("/admin/items");
    expect(status).toBe(200);
    expect(json.items).toEqual([]);
  });

  it("creates item with json", async () => {
    const { status, json } = await postJson("/admin/items", {
      name: "Sword",
      description: "A sharp blade",
      rarity: "rare",
    });
    expect(status).toBe(201);
    expect(json.item.name).toBe("Sword");
    expect(json.item.rarity).toBe("rare");
  });

  it("rejects invalid rarity", async () => {
    const { status, json } = await postJson("/admin/items", {
      name: "Bad",
      rarity: "super",
    });
    expect(status).toBe(400);
    expect(json.error).toContain("rarity");
  });

  it("rejects name too long", async () => {
    const { status } = await postJson("/admin/items", {
      name: "x".repeat(101),
    });
    expect(status).toBe(400);
  });

  it("updates item", async () => {
    const { json: created } = await postJson("/admin/items", { name: "Shield" });
    const id = created.item.id;
    const { status, json } = await putJson(`/admin/items/${id}`, { name: "Iron Shield", rarity: "epic" });
    expect(status).toBe(200);
    expect(json.item.name).toBe("Iron Shield");
    expect(json.item.rarity).toBe("epic");
  });

  it("deletes item", async () => {
    const { json: created } = await postJson("/admin/items", { name: "Potion" });
    const id = created.item.id;
    const { status } = await del(`/admin/items/${id}`);
    expect(status).toBe(200);
    const { json } = await get("/admin/items");
    expect(json.items.find((i: { id: number }) => i.id === id)).toBeUndefined();
  });

  it("returns 404 for missing item on update", async () => {
    const { status } = await putJson("/admin/items/99999", { name: "Ghost" });
    expect(status).toBe(404);
  });

  it("returns 404 for missing item on delete", async () => {
    const { status } = await del("/admin/items/99999");
    expect(status).toBe(404);
  });
});
