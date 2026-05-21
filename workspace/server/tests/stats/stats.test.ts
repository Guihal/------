import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { spawn } from "bun";
import { pool } from "../../src/db/client.ts";
import { migrate } from "../../src/db/schema.ts";

const BASE = "http://localhost:3006";

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
  const email = `stats-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
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

beforeAll(async () => {
  await migrate();
  await pool.query("DELETE FROM user_items");
  await pool.query("DELETE FROM items");
  await pool.query("DELETE FROM tasks");
  await pool.query("DELETE FROM progressions");
  await pool.query("DELETE FROM audit_logs");
  await pool.query("DELETE FROM sessions");
  await pool.query("DELETE FROM users");
  server = spawn(["bun", "run", "src/index.ts"], {
    cwd: "/usr/projects/Диплом/workspace/server",
    stdio: ["inherit", "inherit", "inherit"],
    env: { ...process.env, PORT: "3006", DISABLE_RATE_LIMIT: "1" },
  });
  await waitForServer(`${BASE}/health`);
});

afterAll(async () => {
  server?.kill();
  await server?.exited;
});

describe("settings", () => {
  it("requires auth", async () => {
    const { status } = await fetchJson("/settings");
    expect(status).toBe(401);
  });

  it("returns default settings", async () => {
    const { accessToken } = await registerAndLogin();
    const { status, data } = await fetchJson("/settings", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(status).toBe(200);
    expect(data.settings.theme).toBe("system");
    expect(data.settings.language).toBe("en");
    expect(data.settings.notifications_enabled).toBe(true);
    expect(data.settings.reminder_time).toBeNull();
  });

  it("updates settings", async () => {
    const { accessToken } = await registerAndLogin();
    const { status, data } = await fetchJson("/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ theme: "dark", language: "ru", notifications_enabled: false, reminder_time: "09:00" }),
    });
    expect(status).toBe(200);
    expect(data.settings.theme).toBe("dark");
    expect(data.settings.language).toBe("ru");
    expect(data.settings.notifications_enabled).toBe(false);
    expect(data.settings.reminder_time).toBe("09:00");
  });

  it("rejects invalid theme", async () => {
    const { accessToken } = await registerAndLogin();
    const { status } = await fetchJson("/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ theme: "a".repeat(21) }),
    });
    expect(status).toBe(400);
  });
});

describe("admin stats", () => {
  it("requires auth", async () => {
    const { status } = await fetchJson("/admin/stats");
    expect(status).toBe(401);
  });

  it("requires admin role", async () => {
    const { accessToken } = await registerAndLogin();
    const { status } = await fetchJson("/admin/stats", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(status).toBe(403);
  });

  it("returns stats for admin", async () => {
    const { userId, email } = await registerAndLogin();
    await makeAdmin(userId);
    const { data: loginData } = await fetchJson("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const { status, data } = await fetchJson("/admin/stats", {
      headers: { Authorization: `Bearer ${loginData.access_token}` },
    });
    expect(status).toBe(200);
    expect(typeof data.stats.total_users).toBe("number");
    expect(typeof data.stats.total_tasks).toBe("number");
  });
});

describe("admin logs", () => {
  it("requires auth", async () => {
    const { status } = await fetchJson("/admin/logs");
    expect(status).toBe(401);
  });

  it("requires admin role", async () => {
    const { accessToken } = await registerAndLogin();
    const { status } = await fetchJson("/admin/logs", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(status).toBe(403);
  });

  it("returns paginated logs for admin", async () => {
    const { userId, email } = await registerAndLogin();
    await makeAdmin(userId);
    const { data: loginData } = await fetchJson("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const { status, data } = await fetchJson("/admin/logs", {
      headers: { Authorization: `Bearer ${loginData.access_token}` },
    });
    expect(status).toBe(200);
    expect(Array.isArray(data.logs)).toBe(true);
    expect(data.pagination).toBeDefined();
    expect(typeof data.pagination.total).toBe("number");
    expect(typeof data.pagination.limit).toBe("number");
    expect(typeof data.pagination.offset).toBe("number");
  });

  it("respects limit param", async () => {
    const { userId, email } = await registerAndLogin();
    await makeAdmin(userId);
    const { data: loginData } = await fetchJson("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const { data } = await fetchJson("/admin/logs?limit=5", {
      headers: { Authorization: `Bearer ${loginData.access_token}` },
    });
    expect(data.pagination.limit).toBe(5);
  });
});
