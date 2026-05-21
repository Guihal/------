import { serve } from "bun";

const PORT = Number(process.env.PORT) || 3000;

serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/health" && req.method === "GET") {
      return Response.json({ status: "ok" });
    }

    return Response.json(
      { error: "not_implemented", route: `${req.method} ${url.pathname}` },
      { status: 501 }
    );
  },
});
