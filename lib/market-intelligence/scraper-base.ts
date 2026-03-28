import type { MarketComp } from "./types";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
];

let uaIdx = 0;
function rotateUA(): string {
  const ua = USER_AGENTS[uaIdx % USER_AGENTS.length];
  uaIdx++;
  return ua;
}

// Response cache — 24h TTL
const htmlCache = new Map<string, { html: string; fetchedAt: number }>();
const CACHE_TTL = 86400000;

// Rate limiter — 1 req/sec per domain
const lastRequest = new Map<string, number>();

function getDomain(url: string): string {
  try { return new URL(url).hostname; } catch { return url; }
}

async function waitForRateLimit(url: string): Promise<void> {
  const domain = getDomain(url);
  const last = lastRequest.get(domain) || 0;
  const wait = Math.max(0, 1000 - (Date.now() - last));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequest.set(domain, Date.now());
}

export async function fetchWithRetry(url: string, options?: RequestInit): Promise<string> {
  // Check cache
  const cached = htmlCache.get(url);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) return cached.html;

  await waitForRateLimit(url);

  let lastErr: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 2000));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: { "User-Agent": rotateUA(), ...(options?.headers || {}) },
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      htmlCache.set(url, { html, fetchedAt: Date.now() });
      return html;
    } catch (e: any) {
      clearTimeout(timeout);
      lastErr = e;
      console.warn(`[scraper] Attempt ${attempt + 1}/3 failed for ${getDomain(url)}: ${e.message}`);
    }
  }
  throw lastErr || new Error("fetchWithRetry failed");
}

export function parsePrice(text: string): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[^0-9.,]/g, "").replace(/,/g, "");
  const n = parseFloat(cleaned);
  return isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

export function parseDate(text: string): string {
  if (!text) return "Unknown";
  // Try ISO format
  const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];
  // Try MM/DD/YYYY
  const mdy = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2, "0")}-${mdy[2].padStart(2, "0")}`;
  // Try "Month DD, YYYY"
  const months: Record<string, string> = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };
  const named = text.match(/(\w{3})\w*\s+(\d{1,2}),?\s+(\d{4})/i);
  if (named) {
    const m = months[named[1].toLowerCase().slice(0, 3)];
    if (m) return `${named[3]}-${m}-${named[2].padStart(2, "0")}`;
  }
  return text.trim().slice(0, 10);
}

export function deduplicateComps(comps: MarketComp[]): MarketComp[] {
  const seen = new Set<string>();
  return comps.filter((c) => {
    const key = `${c.price}:${c.item.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 40)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
