export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): boolean {
  return password.length >= 6 && password.length <= 72;
}

export function getClientIp(req: Request): string | undefined {
  const trustedProxy = process.env.TRUSTED_PROXY;
  if (trustedProxy === "1") {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim();
      if (first) return first;
    }
  }
  return (req as Request & { remoteAddress?: string }).remoteAddress ?? undefined;
}

export function getBearer(req: Request): string | undefined {
  const h = req.headers.get("authorization");
  if (!h) return undefined;
  const [scheme, token] = h.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return undefined;
  return token;
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export function bad(message: string, status = 400): Response {
  return json({ error: message }, status);
}

export function unauthorized(message = "Unauthorized"): Response {
  return json({ error: message }, 401);
}
