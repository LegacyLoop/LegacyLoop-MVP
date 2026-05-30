// fb-army · POST envelope to T3b proxy fb-army adapter
// Proxy secret read from DROPLET env · NEVER repo · BINDING #9

import type { IngestPayload } from "./envelope.js";

const DEFAULT_PROXY_URL = "https://app.legacy-loop.com/api/scrapers/proxy";

export type IngestResult = {
  ok: boolean;
  status: number;
  body: string;
};

export async function ingestToProxy(payload: IngestPayload): Promise<IngestResult> {
  const url = process.env.FB_ARMY_PROXY_ENDPOINT ?? DEFAULT_PROXY_URL;
  const secret = process.env.SCRAPER_PROXY_SECRET;
  if (!secret) {
    return {
      ok: false,
      status: 0,
      body: "SCRAPER_PROXY_SECRET absent · cannot POST to T3b proxy (BINDING #9 droplet env required)",
    };
  }

  const body = JSON.stringify({
    provider: "fb-army",
    operation: "ingest",
    params: payload,
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Scraper-Proxy-Token": secret,
        "User-Agent": "fb-army-droplet/0.1",
      },
      body,
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, body: text.slice(0, 1000) };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      body: `fetch-fail: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}
