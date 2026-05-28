import { timingSafeEqual } from "node:crypto";

export function validateProxyAuth(headerValue: string | null): boolean {
  const secret = process.env.SCRAPER_PROXY_SECRET;
  if (!secret || !headerValue) return false;
  const a = Buffer.from(secret, "utf-8");
  const b = Buffer.from(headerValue, "utf-8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
