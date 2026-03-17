/**
 * Simple in-memory rate limiter
 * Not for production scale — use Redis in production.
 */
const store = new Map<string, { count: number; resetAt: number }>();

// Clean up old entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of store) {
      if (val.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  login: { maxRequests: 5, windowMs: 60_000 },
  signup: { maxRequests: 3, windowMs: 60_000 },
  analyze: { maxRequests: 10, windowMs: 60_000 },
  payments: { maxRequests: 5, windowMs: 60_000 },
};

export function checkRateLimit(
  key: string,
  identifier: string,
  config?: RateLimitConfig
): { allowed: boolean; remaining: number; resetIn: number } {
  const cfg = config || RATE_LIMITS[key] || { maxRequests: 30, windowMs: 60_000 };
  const storeKey = `${key}:${identifier}`;
  const now = Date.now();

  const entry = store.get(storeKey);

  if (!entry || entry.resetAt < now) {
    store.set(storeKey, { count: 1, resetAt: now + cfg.windowMs });
    return { allowed: true, remaining: cfg.maxRequests - 1, resetIn: cfg.windowMs };
  }

  if (entry.count >= cfg.maxRequests) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, remaining: cfg.maxRequests - entry.count, resetIn: entry.resetAt - now };
}

/** Helper to get client IP from request */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
