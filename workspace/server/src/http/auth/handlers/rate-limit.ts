const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 15_000;
const MAX_REQUESTS = 5;

export function checkRateLimit(key: string): { allowed: boolean; retryAfter?: number } {
  if (process.env.DISABLE_RATE_LIMIT === "1") return { allowed: true };

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { allowed: true };
}

export function clearRateLimit(): void {
  store.clear();
}
