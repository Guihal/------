import { spawn } from "bun";
import { pool } from "../../src/db/client.ts";
import { migrate } from "../../src/db/schema.ts";
import { clearRateLimit } from "../../src/http/auth/router.ts";

export const BASE = "http://localhost:3003";

export async function fetchWithTimeout(url: string, opts?: RequestInit, timeoutMs = 3000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJson(path: string, opts?: RequestInit) {
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

export let server: ReturnType<typeof spawn>;

export async function setupTests() {
  await migrate();
  await pool.query("DELETE FROM audit_logs");
  await pool.query("DELETE FROM sessions");
  await pool.query("DELETE FROM users");
  clearRateLimit();
  server = spawn(["bun", "run", "src/index.ts"], {
    stdio: ["inherit", "inherit", "inherit"],
    env: { ...process.env, PORT: "3003", DISABLE_RATE_LIMIT: "1" },
  });
  await waitForServer(`${BASE}/health`);
}

export async function teardownTests() {
  server?.kill();
  await server?.exited;
}

export async function countAuditLogs(action: string) {
  const rows = await pool.query(
    `SELECT COUNT(*)::int AS cnt FROM audit_logs WHERE action = $1`,
    [action]
  );
  return (rows.rows[0] as { cnt: number }).cnt;
}
