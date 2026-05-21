import { serve } from "bun";
import { migrate } from "./db/migrate.ts";
import { handleAuth } from "./http/auth/router.ts";

const PORT = Number(process.env.PORT) || 3000;

// Run migrations on startup (best-effort; do not block if DB unavailable in dev)
migrate().catch((err) => {
  console.error("Migration failed:", err.message);
});

serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/health" && req.method === "GET") {
      return Response.json({ status: "ok" });
    }

    const authResp = await handleAuth(req, url.pathname);
    if (authResp) return authResp;

    return Response.json(
      { error: "not_implemented", route: `${req.method} ${url.pathname}` },
      { status: 501 }
    );
  },
});
