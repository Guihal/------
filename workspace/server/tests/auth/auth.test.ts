import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { fetchJson, setupTests, teardownTests, countAuditLogs } from "./setup.ts";

describe("POST /auth/register", () => {
  beforeAll(setupTests);
  afterAll(teardownTests);

  it("creates a user and returns id + email + role", async () => {
    const email = `test-${Date.now()}@example.com`;
    const { status, data } = await fetchJson("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    expect(status).toBe(200);
    expect(data.id).toBeNumber();
    expect(data.email).toBe(email);
    expect(data.role).toBe("user");
  });

  it("rejects duplicate email with 409", async () => {
    const email = `dup-${Date.now()}@example.com`;
    await fetchJson("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const { status } = await fetchJson("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    expect(status).toBe(409);
  });

  it("rejects short password", async () => {
    const { status } = await fetchJson("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: `short-${Date.now()}@example.com`, password: "123" }),
    });
    expect(status).toBe(400);
  });

  it("rejects invalid email", async () => {
    const { status } = await fetchJson("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email", password: "secret123" }),
    });
    expect(status).toBe(400);
  });

  it("writes audit log on register", async () => {
    const before = await countAuditLogs("register");
    const email = `audit-reg-${Date.now()}@example.com`;
    await fetchJson("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const after = await countAuditLogs("register");
    expect(after).toBe(before + 1);
  });
});

describe("POST /auth/login", () => {
  beforeAll(setupTests);
  afterAll(teardownTests);

  it("returns tokens for valid credentials", async () => {
    const email = `login-${Date.now()}@example.com`;
    await fetchJson("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const { status, data } = await fetchJson("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    expect(status).toBe(200);
    expect(data.access_token).toBeString();
    expect(data.refresh_token).toBeString();
    expect(data.token_type).toBe("Bearer");
    expect(data.expires_in).toBe(900);
    expect(data.user.role).toBe("user");
  });

  it("returns 401 for bad password", async () => {
    const email = `bad-${Date.now()}@example.com`;
    await fetchJson("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const { status } = await fetchJson("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "wrong" }),
    });
    expect(status).toBe(401);
  });

  it("writes audit log on login", async () => {
    const email = `audit-login-${Date.now()}@example.com`;
    await fetchJson("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const before = await countAuditLogs("login");
    await fetchJson("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const after = await countAuditLogs("login");
    expect(after).toBe(before + 1);
  });
});

describe("POST /auth/refresh", () => {
  beforeAll(setupTests);
  afterAll(teardownTests);

  it("rotates refresh token and returns new access token", async () => {
    const email = `refresh-${Date.now()}@example.com`;
    await fetchJson("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const { data: loginData } = await fetchJson("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });

    const { status, data } = await fetchJson("/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: loginData.refresh_token }),
    });
    expect(status).toBe(200);
    expect(data.access_token).toBeString();
    expect(data.refresh_token).toBeString();
    expect(data.refresh_token).not.toBe(loginData.refresh_token);
  });

  it("returns 401 for revoked token", async () => {
    const { status } = await fetchJson("/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: "invalid.token.here" }),
    });
    expect(status).toBe(401);
  });

  it("detects reuse and invalidates all sessions", async () => {
    const email = `reuse-${Date.now()}@example.com`;
    await fetchJson("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const { data: loginData } = await fetchJson("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });

    const { data: refresh1 } = await fetchJson("/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: loginData.refresh_token }),
    });
    expect(refresh1.access_token).toBeString();

    const { status } = await fetchJson("/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: loginData.refresh_token }),
    });
    expect(status).toBe(401);

    const { status: status2 } = await fetchJson("/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh1.refresh_token }),
    });
    expect(status2).toBe(401);
  });

  it("writes audit log on refresh", async () => {
    const email = `audit-refresh-${Date.now()}@example.com`;
    await fetchJson("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const { data: loginData } = await fetchJson("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const before = await countAuditLogs("refresh");
    await fetchJson("/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: loginData.refresh_token }),
    });
    const after = await countAuditLogs("refresh");
    expect(after).toBe(before + 1);
  });
});

describe("POST /auth/logout", () => {
  beforeAll(setupTests);
  afterAll(teardownTests);

  it("returns ok even without token", async () => {
    const { status, data } = await fetchJson("/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    expect(status).toBe(200);
    expect(data.ok).toBe(true);
  });

  it("revokes the session", async () => {
    const email = `logout-${Date.now()}@example.com`;
    await fetchJson("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const { data: loginData } = await fetchJson("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    await fetchJson("/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: loginData.refresh_token }),
    });
    const { status } = await fetchJson("/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: loginData.refresh_token }),
    });
    expect(status).toBe(401);
  });

  it("writes audit log on logout", async () => {
    const email = `audit-logout-${Date.now()}@example.com`;
    await fetchJson("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const { data: loginData } = await fetchJson("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const before = await countAuditLogs("logout");
    await fetchJson("/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: loginData.refresh_token }),
    });
    const after = await countAuditLogs("logout");
    expect(after).toBe(before + 1);
  });
});

describe("GET /auth/me", () => {
  beforeAll(setupTests);
  afterAll(teardownTests);

  it("returns user info with valid Bearer token", async () => {
    const email = `me-${Date.now()}@example.com`;
    await fetchJson("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const { data: loginData } = await fetchJson("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const { status, data } = await fetchJson("/auth/me", {
      headers: { Authorization: `Bearer ${loginData.access_token}` },
    });
    expect(status).toBe(200);
    expect(data.email).toBe(email);
    expect(data.role).toBe("user");
  });

  it("returns 401 without token", async () => {
    const { status } = await fetchJson("/auth/me");
    expect(status).toBe(401);
  });
});

describe("GET /auth/users (admin)", () => {
  beforeAll(setupTests);
  afterAll(teardownTests);

  it("returns 403 for non-admin", async () => {
    const email = `user-${Date.now()}@example.com`;
    await fetchJson("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const { data: loginData } = await fetchJson("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const { status } = await fetchJson("/auth/users", {
      headers: { Authorization: `Bearer ${loginData.access_token}` },
    });
    expect(status).toBe(403);
  });
});
