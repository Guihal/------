import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { spawn } from "bun";
import { pool } from "../../src/db/client.ts";
import { migrate } from "../../src/db/schema.ts";
import { signAccessToken } from "../../src/security/jwt.ts";

const BASE = "http://localhost:3007";

async function fetchWithTimeout(url: string, opts?: RequestInit, timeoutMs = 3000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(path: string, opts?: RequestInit) {
  const res = await fetchWithTimeout(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function waitForServer(url: string, maxMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(500) });
      if (res.status === 200) return;
    } catch { /* ignore */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("Server did not start in time");
}

let server: ReturnType<typeof spawn>;

async function registerAndLogin(): Promise<{ accessToken: string; userId: number; email: string }> {
  const email = `nr-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const reg = await fetchJson("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "secret123" }),
  });
  const { data } = await fetchJson("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "secret123" }),
  });
  return { accessToken: data.access_token, userId: reg.data.id ?? data.user.id, email };
}

async function makeAdmin(userId: number) {
  await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [userId]);
}

async function createItem(name: string, rarity: string) {
  const { data } = await fetchJson("/admin/items", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${signAccessToken(1, "admin")}` },
    body: JSON.stringify({ name, rarity }),
  });
  return data.item;
}

beforeAll(async () => {
  await migrate();
  await pool.query("DELETE FROM user_items");
  await pool.query("DELETE FROM items");
  await pool.query("DELETE FROM tasks");
  await pool.query("DELETE FROM progressions");
  await pool.query("DELETE FROM profiles");
  await pool.query("DELETE FROM audit_logs");
  await pool.query("DELETE FROM sessions");
  await pool.query("DELETE FROM users");
  server = spawn(["bun", "run", "src/index.ts"], {
    cwd: "/usr/projects/Диплом/workspace/server",
    stdio: ["inherit", "inherit", "inherit"],
    env: { ...process.env, PORT: "3007", DISABLE_RATE_LIMIT: "1" },
  });
  await waitForServer(`${BASE}/health`);
});

afterAll(async () => {
  server?.kill();
  await server?.exited;
});

// ========== inventory/:userItemId/equip ==========
describe("POST /inventory/:userItemId/equip", () => {
  it("requires auth", async () => {
    const { status } = await fetchJson("/inventory/1/equip", { method: "POST" });
    expect(status).toBe(401);
  });

  it("equips owned item by user_item id", async () => {
    await pool.query("DELETE FROM user_items");
    await pool.query("DELETE FROM items");
    const item = await createItem("Sword", "rare");
    const { accessToken, userId } = await registerAndLogin();
    const ui = await pool.query(
      "INSERT INTO user_items (user_id, item_id, quantity) VALUES ($1, $2, 1) RETURNING id",
      [userId, item.id]
    );
    const userItemId = ui.rows[0].id;
    const { status, data } = await fetchJson(`/inventory/${userItemId}/equip`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ equip: true }),
    });
    expect(status).toBe(200);
    expect(data.item.equipped).toBe(true);
  });

  it("returns 404 for unowned item", async () => {
    await pool.query("DELETE FROM user_items");
    await pool.query("DELETE FROM items");
    const { accessToken } = await registerAndLogin();
    const { status } = await fetchJson("/inventory/99999/equip", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ equip: true }),
    });
    expect(status).toBe(404);
  });

  it("unequips when equip=false", async () => {
    await pool.query("DELETE FROM user_items");
    await pool.query("DELETE FROM items");
    const item = await createItem("Shield", "common");
    const { accessToken, userId } = await registerAndLogin();
    const ui = await pool.query(
      "INSERT INTO user_items (user_id, item_id, quantity, equipped) VALUES ($1, $2, 1, true) RETURNING id",
      [userId, item.id]
    );
    const userItemId = ui.rows[0].id;
    const { status, data } = await fetchJson(`/inventory/${userItemId}/equip`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ equip: false }),
    });
    expect(status).toBe(200);
    expect(data.ok).toBe(true);
  });
});

// ========== visual-state ==========
describe("GET /visual-state", () => {
  it("requires auth", async () => {
    const { status } = await fetchJson("/visual-state");
    expect(status).toBe(401);
  });

  it("returns visual state for user", async () => {
    const { accessToken } = await registerAndLogin();
    const { status, data } = await fetchJson("/visual-state", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(status).toBe(200);
    expect(data.xp).toBe(0);
    expect(data.level).toBe(1);
    expect(data.equipped_item).toBeNull();
  });
});

// ========== settings PATCH ==========
describe("PATCH /settings", () => {
  it("requires auth", async () => {
    const { status } = await fetchJson("/settings", { method: "PATCH" });
    expect(status).toBe(401);
  });

  it("partially updates settings", async () => {
    const { accessToken } = await registerAndLogin();
    const { status, data } = await fetchJson("/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ theme: "dark" }),
    });
    expect(status).toBe(200);
    expect(data.settings.theme).toBe("dark");
    expect(data.settings.language).toBe("en");
  });

  it("rejects empty patch", async () => {
    const { accessToken } = await registerAndLogin();
    const { status } = await fetchJson("/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({}),
    });
    expect(status).toBe(400);
  });
});

// ========== tasks/:id/reminder ==========
describe("POST /tasks/:id/reminder", () => {
  it("requires auth", async () => {
    const { status } = await fetchJson("/tasks/1/reminder", { method: "POST" });
    expect(status).toBe(401);
  });

  it("sets reminder for active task", async () => {
    const { accessToken } = await registerAndLogin();
    const { data: taskData } = await fetchJson("/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ title: "Remind me" }),
    });
    const taskId = taskData.task.id;
    const future = new Date(Date.now() + 86400000).toISOString();
    const { status, data } = await fetchJson(`/tasks/${taskId}/reminder`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ reminder_at: future }),
    });
    expect(status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.reminder_at).toBe(future);
  });

  it("rejects reminder for completed task", async () => {
    const { accessToken } = await registerAndLogin();
    const { data: taskData } = await fetchJson("/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ title: "Done" }),
    });
    const taskId = taskData.task.id;
    await fetchJson(`/tasks/${taskId}/complete`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const future = new Date(Date.now() + 86400000).toISOString();
    const { status } = await fetchJson(`/tasks/${taskId}/reminder`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ reminder_at: future }),
    });
    expect(status).toBe(400);
  });

  it("returns 404 for other user's task", async () => {
    const tokenA = await registerAndLogin();
    const tokenB = await registerAndLogin();
    const { data: taskData } = await fetchJson("/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA.accessToken}` },
      body: JSON.stringify({ title: "Private" }),
    });
    const { status } = await fetchJson(`/tasks/${taskData.task.id}/reminder`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenB.accessToken}` },
      body: JSON.stringify({ reminder_at: new Date(Date.now() + 86400000).toISOString() }),
    });
    expect(status).toBe(404);
  });
});

// ========== admin/stats/levels ==========
describe("GET /admin/stats/levels", () => {
  it("requires auth", async () => {
    const { status } = await fetchJson("/admin/stats/levels");
    expect(status).toBe(401);
  });

  it("requires admin role", async () => {
    const { accessToken } = await registerAndLogin();
    const { status } = await fetchJson("/admin/stats/levels", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(status).toBe(403);
  });

  it("returns level distribution for admin", async () => {
    const { userId, email } = await registerAndLogin();
    await makeAdmin(userId);
    const { data: loginData } = await fetchJson("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const { status, data } = await fetchJson("/admin/stats/levels", {
      headers: { Authorization: `Bearer ${loginData.access_token}` },
    });
    expect(status).toBe(200);
    expect(Array.isArray(data.levels)).toBe(true);
  });
});

// ========== admin/stats/drops ==========
describe("GET /admin/stats/drops", () => {
  it("requires auth", async () => {
    const { status } = await fetchJson("/admin/stats/drops");
    expect(status).toBe(401);
  });

  it("requires admin role", async () => {
    const { accessToken } = await registerAndLogin();
    const { status } = await fetchJson("/admin/stats/drops", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(status).toBe(403);
  });

  it("returns drop stats for admin", async () => {
    const { userId, email } = await registerAndLogin();
    await makeAdmin(userId);
    const { data: loginData } = await fetchJson("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const { status, data } = await fetchJson("/admin/stats/drops", {
      headers: { Authorization: `Bearer ${loginData.access_token}` },
    });
    expect(status).toBe(200);
    expect(Array.isArray(data.drops)).toBe(true);
  });
});

// ========== admin/stats/tasks ==========
describe("GET /admin/stats/tasks", () => {
  it("requires auth", async () => {
    const { status } = await fetchJson("/admin/stats/tasks");
    expect(status).toBe(401);
  });

  it("requires admin role", async () => {
    const { accessToken } = await registerAndLogin();
    const { status } = await fetchJson("/admin/stats/tasks", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(status).toBe(403);
  });

  it("returns task stats for admin", async () => {
    const { userId, email } = await registerAndLogin();
    await makeAdmin(userId);
    const { data: loginData } = await fetchJson("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const { status, data } = await fetchJson("/admin/stats/tasks", {
      headers: { Authorization: `Bearer ${loginData.access_token}` },
    });
    expect(status).toBe(200);
    expect(Array.isArray(data.by_difficulty)).toBe(true);
    expect(Array.isArray(data.by_category)).toBe(true);
  });
});

// ========== admin/users/:id ==========
describe("GET /admin/users/:id", () => {
  it("requires auth", async () => {
    const { status } = await fetchJson("/admin/users/1");
    expect(status).toBe(401);
  });

  it("requires admin role", async () => {
    const { accessToken } = await registerAndLogin();
    const { status } = await fetchJson("/admin/users/1", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(status).toBe(403);
  });

  it("returns user details for admin", async () => {
    const { userId, email } = await registerAndLogin();
    await makeAdmin(userId);
    const { data: loginData } = await fetchJson("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const { status, data } = await fetchJson(`/admin/users/${userId}`, {
      headers: { Authorization: `Bearer ${loginData.access_token}` },
    });
    expect(status).toBe(200);
    expect(data.user.id).toBe(userId);
    expect(data.user.email).toBe(email);
  });

  it("returns 404 for missing user", async () => {
    const { userId, email } = await registerAndLogin();
    await makeAdmin(userId);
    const { data: loginData } = await fetchJson("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const { status } = await fetchJson("/admin/users/99999", {
      headers: { Authorization: `Bearer ${loginData.access_token}` },
    });
    expect(status).toBe(404);
  });
});

// ========== admin/item-assets ==========
describe("GET /admin/item-assets", () => {
  it("requires auth", async () => {
    const { status } = await fetchJson("/admin/item-assets");
    expect(status).toBe(401);
  });

  it("requires admin role", async () => {
    const { accessToken } = await registerAndLogin();
    const { status } = await fetchJson("/admin/item-assets", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(status).toBe(403);
  });

  it("returns item assets for admin", async () => {
    await pool.query("DELETE FROM items");
    const { userId, email } = await registerAndLogin();
    await makeAdmin(userId);
    await fetchJson("/admin/items", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${signAccessToken(userId, "admin")}` },
      body: JSON.stringify({ name: "Sword", rarity: "rare", asset_url: "https://example.com/sword.png" }),
    });
    const { data: loginData } = await fetchJson("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const { status, data } = await fetchJson("/admin/item-assets", {
      headers: { Authorization: `Bearer ${loginData.access_token}` },
    });
    expect(status).toBe(200);
    expect(Array.isArray(data.assets)).toBe(true);
    expect(data.assets.length).toBeGreaterThanOrEqual(1);
    expect(data.assets[0].asset_url).toBeDefined();
  });
});
