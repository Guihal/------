import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { serve } from "bun";
import { migrate } from "../../src/db/schema.ts";
import { pool } from "../../src/db/client.ts";
import { handleAdmin } from "../../src/http/admin/router.ts";
import { signAccessToken } from "../../src/security/jwt.ts";

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

function adminToken() {
  return signAccessToken(1, "admin");
}

function userToken() {
  return signAccessToken(2, "user");
}

async function postJson(path: string, body: unknown, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

async function putJson(path: string, body: unknown, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

async function del(path: string, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method: "DELETE", headers });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

async function get(path: string, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { headers });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

describe("admin items", () => {
  it("lists empty items", async () => {
    const { status, json } = await get("/admin/items", adminToken());
    expect(status).toBe(200);
    expect(json.items).toEqual([]);
  });

  it("GET requires auth", async () => {
    const { status } = await get("/admin/items");
    expect(status).toBe(401);
  });

  it("GET rejects non-admin", async () => {
    const { status } = await get("/admin/items", userToken());
    expect(status).toBe(403);
  });

  it("creates item with json", async () => {
    const { status, json } = await postJson("/admin/items", {
      name: "Sword",
      description: "A sharp blade",
      rarity: "rare",
    }, adminToken());
    expect(status).toBe(201);
    expect(json.item.name).toBe("Sword");
    expect(json.item.rarity).toBe("rare");
  });

  it("rejects invalid rarity", async () => {
    const { status, json } = await postJson("/admin/items", {
      name: "Bad",
      rarity: "super",
    }, adminToken());
    expect(status).toBe(400);
    expect(json.error).toContain("rarity");
  });

  it("rejects name too long", async () => {
    const { status } = await postJson("/admin/items", {
      name: "x".repeat(101),
    }, adminToken());
    expect(status).toBe(400);
  });

  it("updates item", async () => {
    const { json: created } = await postJson("/admin/items", { name: "Shield" }, adminToken());
    const id = created.item.id;
    const { status, json } = await putJson(`/admin/items/${id}`, { name: "Iron Shield", rarity: "epic" }, adminToken());
    expect(status).toBe(200);
    expect(json.item.name).toBe("Iron Shield");
    expect(json.item.rarity).toBe("epic");
  });

  it("deletes item", async () => {
    const { json: created } = await postJson("/admin/items", { name: "Potion" }, adminToken());
    const id = created.item.id;
    const { status } = await del(`/admin/items/${id}`, adminToken());
    expect(status).toBe(200);
    const { json } = await get("/admin/items", adminToken());
    expect(json.items.find((i: { id: number }) => i.id === id)).toBeUndefined();
  });

  it("returns 404 for missing item on update", async () => {
    const { status } = await putJson("/admin/items/99999", { name: "Ghost" }, adminToken());
    expect(status).toBe(404);
  });

  it("returns 404 for missing item on delete", async () => {
    const { status } = await del("/admin/items/99999", adminToken());
    expect(status).toBe(404);
  });

  it("POST requires auth", async () => {
    const { status } = await postJson("/admin/items", { name: "X" });
    expect(status).toBe(401);
  });

  it("PUT requires auth", async () => {
    const { status } = await putJson("/admin/items/1", { name: "X" });
    expect(status).toBe(401);
  });

  it("DELETE requires auth", async () => {
    const { status } = await del("/admin/items/1");
    expect(status).toBe(401);
  });

  it("POST rejects non-admin", async () => {
    const { status } = await postJson("/admin/items", { name: "X" }, userToken());
    expect(status).toBe(403);
  });

  it("PUT rejects non-admin", async () => {
    const { status } = await putJson("/admin/items/1", { name: "X" }, userToken());
    expect(status).toBe(403);
  });

  it("DELETE rejects non-admin", async () => {
    const { status } = await del("/admin/items/1", userToken());
    expect(status).toBe(403);
  });
});
