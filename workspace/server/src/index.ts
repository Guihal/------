import { serve } from "bun";
import { migrate } from "./db/schema.ts";
import { handleAuth } from "./http/auth/router.ts";
import { handleTasks } from "./http/tasks/router.ts";
import { handleAdmin } from "./http/admin/router.ts";
import { handleInventory } from "./http/inventory/router.ts";
import { handleSettings } from "./http/settings/router.ts";
import { handleVisualState } from "./http/visual-state/router.ts";

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

    const tasksResp = await handleTasks(req, url.pathname);
    if (tasksResp) return tasksResp;

    const adminResp = await handleAdmin(req, url.pathname);
    if (adminResp) return adminResp;

    const inventoryResp = await handleInventory(req, url.pathname);
    if (inventoryResp) return inventoryResp;

    const settingsResp = await handleSettings(req, url.pathname);
    if (settingsResp) return settingsResp;

    const visualResp = await handleVisualState(req, url.pathname);
    if (visualResp) return visualResp;

    return Response.json(
      { error: "not_implemented", route: `${req.method} ${url.pathname}` },
      { status: 501 }
    );
  },
});
