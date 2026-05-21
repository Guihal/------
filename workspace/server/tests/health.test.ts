import { describe, it, expect } from "bun:test";
import { spawn } from "bun";

describe("Health endpoint", () => {
  it("returns 200 and { status: 'ok' }", async () => {
    const server = spawn(["bun", "run", "src/index.ts"], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, PORT: "3001" },
    });
    await new Promise((r) => setTimeout(r, 200));

    const resp = await fetch("http://localhost:3001/health");
    const data = await resp.json();

    expect(resp.status).toBe(200);
    expect(data.status).toBe("ok");

    server.kill();
  });

  it("unknown route returns 501", async () => {
    const server = spawn(["bun", "run", "src/index.ts"], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, PORT: "3002" },
    });
    await new Promise((r) => setTimeout(r, 200));

    const resp = await fetch("http://localhost:3002/unknown");
    const data = await resp.json();

    expect(resp.status).toBe(501);
    expect(data.error).toBe("not_implemented");

    server.kill();
  });
});
