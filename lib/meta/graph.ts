/**
 * lib/meta/graph.ts — Meta Graph API client (World-A · App-Platform pivot)
 *
 * Official Graph API integration for the per-user FB Page connect flow.
 * Users OAuth-authorize Legacy-Loop; LL reads their Pages + Insights via Graph.
 *
 * WHY a dedicated client: the FB OAuth *login* callback (app/api/auth/facebook/
 * callback) only grants identity scopes. Page management (pages_show_list,
 * pages_read_engagement, read_insights) is a distinct consent whose page tokens
 * are read here. This module never logs tokens and surfaces typed results only.
 *
 * Docs: https://developers.facebook.com/docs/graph-api/reference/page/
 *       https://developers.facebook.com/docs/graph-api/overview/rate-limiting
 */

const GRAPH_VERSION = "v21.0"; // matches app/api/auth/facebook/callback
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

/* ── Types ── */

export interface MetaPage {
  id: string;
  name: string;
  accessToken: string; // page access token (long-lived when derived from LL user token)
  category: string | null;
  tasks: string[];
}

export interface MetaInsightValue {
  value: number;
  endTime: string | null;
}

export interface MetaInsightMetric {
  name: string;
  period: string;
  title: string | null;
  values: MetaInsightValue[];
}

export interface GraphUsage {
  /** % of rate-limit budget consumed (max of call_count/total_time/total_cputime). */
  percent: number;
  /** Minutes until access is regained if throttled, else 0. */
  estimatedRegainMinutes: number;
}

export interface GraphError {
  message: string;
  code: number;
  subcode: number | null;
  /** Whether a retry is sane (transient/throttle vs permanent). */
  transient: boolean;
}

export type GraphResult<T> =
  | { ok: true; data: T; usage: GraphUsage | null }
  | { ok: false; error: GraphError; usage: GraphUsage | null };

/* ── Config / guards ── */

const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 500;
// Transient/throttle error codes worth retrying (Meta canonical).
const TRANSIENT_CODES = new Set([1, 2, 4, 17, 32, 341, 368, 613]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function asString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function asNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Sleep that tolerates being stubbed in tests; no-op for non-positive ms. */
function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ── Rate-limit header parsing (X-Business-Use-Case-Usage / X-App-Usage) ── */

/**
 * Parse Meta rate-limit headers into a single worst-case usage snapshot.
 * Header shape (BUC): { "<businessId>": [{ call_count, total_cputime, total_time,
 * estimated_time_to_regain_access }] }. X-App-Usage: { call_count, total_time,
 * total_cputime }.
 */
export function parseUsage(headers: Headers): GraphUsage | null {
  const candidates: string[] = [];
  const buc = headers.get("x-business-use-case-usage");
  const app = headers.get("x-app-usage");
  const page = headers.get("x-page-usage");
  if (buc) candidates.push(buc);
  if (app) candidates.push(app);
  if (page) candidates.push(page);
  if (candidates.length === 0) return null;

  let percent = 0;
  let regain = 0;

  for (const raw of candidates) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    // BUC nests per-business arrays; App/Page usage is a flat object.
    const buckets: unknown[] = [];
    if (isRecord(parsed)) {
      for (const val of Object.values(parsed)) {
        if (Array.isArray(val)) buckets.push(...val);
        else buckets.push(val);
      }
    }
    for (const b of buckets) {
      if (!isRecord(b)) continue;
      percent = Math.max(
        percent,
        asNumber(b.call_count) ?? 0,
        asNumber(b.total_time) ?? 0,
        asNumber(b.total_cputime) ?? 0
      );
      regain = Math.max(regain, asNumber(b.estimated_time_to_regain_access) ?? 0);
    }
  }

  return { percent, estimatedRegainMinutes: regain };
}

/* ── Core fetch with backoff ── */

interface GraphFetchOpts {
  /** Query params appended to the URL. */
  params?: Record<string, string>;
  /** Bearer token (user or page access token). */
  token: string;
}

/**
 * Typed Graph GET with exponential backoff on transient errors and respect for
 * Meta's rate-limit headers. Returns a discriminated GraphResult — never throws
 * on API/network failure (throws only on programmer error: missing token).
 */
export async function graphGet<T>(
  path: string,
  opts: GraphFetchOpts,
  parse: (data: unknown) => T
): Promise<GraphResult<T>> {
  if (!opts.token) throw new Error("graphGet: access token required");

  const qs = new URLSearchParams(opts.params ?? {});
  const url = `${GRAPH_BASE}/${path.replace(/^\//, "")}${qs.toString() ? `?${qs}` : ""}`;

  let lastUsage: GraphUsage | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${opts.token}` },
      });
    } catch (e) {
      // Network error — treat as transient, back off and retry.
      if (attempt < MAX_RETRIES) {
        await sleep(BASE_BACKOFF_MS * 2 ** attempt);
        continue;
      }
      const message = e instanceof Error ? e.message : "network error";
      return { ok: false, error: { message, code: -1, subcode: null, transient: true }, usage: lastUsage };
    }

    lastUsage = parseUsage(res.headers);

    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = null;
    }

    if (res.ok && isRecord(body) && !("error" in body)) {
      return { ok: true, data: parse(body), usage: lastUsage };
    }

    // Extract Graph error envelope.
    const errObj = isRecord(body) && isRecord(body.error) ? body.error : null;
    const code = (errObj && asNumber(errObj.code)) ?? res.status;
    const subcode = errObj ? asNumber(errObj.error_subcode) : null;
    const message =
      (errObj && asString(errObj.message)) ?? `Graph request failed (HTTP ${res.status})`;
    const throttled =
      res.status === 429 ||
      TRANSIENT_CODES.has(code) ||
      (lastUsage !== null && lastUsage.percent >= 100);

    if (throttled && attempt < MAX_RETRIES) {
      // Prefer Meta's regain hint when present; else exponential backoff.
      const regainMs = lastUsage && lastUsage.estimatedRegainMinutes > 0
        ? lastUsage.estimatedRegainMinutes * 60_000
        : BASE_BACKOFF_MS * 2 ** attempt;
      await sleep(Math.min(regainMs, 60_000)); // cap single wait at 60s
      continue;
    }

    return {
      ok: false,
      error: { message, code, subcode, transient: throttled },
      usage: lastUsage,
    };
  }

  return {
    ok: false,
    error: { message: "retries exhausted", code: -1, subcode: null, transient: true },
    usage: lastUsage,
  };
}

/* ── High-level Graph operations ── */

/**
 * Exchange a short-lived user token for a long-lived one (~60 days).
 * Requires app credentials (FACEBOOK_CLIENT_ID / FACEBOOK_CLIENT_SECRET).
 */
export async function exchangeLongLivedToken(
  shortToken: string
): Promise<GraphResult<{ accessToken: string; expiresInSeconds: number | null }>> {
  const clientId = process.env.FACEBOOK_CLIENT_ID;
  const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return {
      ok: false,
      error: { message: "FACEBOOK_CLIENT_ID/SECRET not configured", code: -1, subcode: null, transient: false },
      usage: null,
    };
  }
  // The exchange endpoint authenticates via query params, not a bearer token;
  // we pass the short token as the "token" to satisfy the fetch contract.
  return graphGet(
    "oauth/access_token",
    {
      token: shortToken,
      params: {
        grant_type: "fb_exchange_token",
        client_id: clientId,
        client_secret: clientSecret,
        fb_exchange_token: shortToken,
      },
    },
    (body) => {
      const rec = isRecord(body) ? body : {};
      return {
        accessToken: asString(rec.access_token) ?? "",
        expiresInSeconds: asNumber(rec.expires_in),
      };
    }
  );
}

/** List the Pages the authorizing user manages (with per-page access tokens). */
export async function listPages(userToken: string): Promise<GraphResult<MetaPage[]>> {
  return graphGet(
    "me/accounts",
    { token: userToken, params: { fields: "id,name,access_token,category,tasks" } },
    (body) => {
      const rec = isRecord(body) ? body : {};
      const data = Array.isArray(rec.data) ? rec.data : [];
      const pages: MetaPage[] = [];
      for (const p of data) {
        if (!isRecord(p)) continue;
        const id = asString(p.id);
        const token = asString(p.access_token);
        if (!id || !token) continue;
        pages.push({
          id,
          name: asString(p.name) ?? "(unnamed page)",
          accessToken: token,
          category: asString(p.category),
          tasks: Array.isArray(p.tasks) ? p.tasks.filter((t): t is string => typeof t === "string") : [],
        });
      }
      return pages;
    }
  );
}

/** Read engagement insights for a Page (defaults: daily impressions + engaged users). */
export async function getPageInsights(
  pageId: string,
  pageToken: string,
  metrics: string[] = ["page_impressions", "page_engaged_users"],
  period = "day"
): Promise<GraphResult<MetaInsightMetric[]>> {
  return graphGet(
    `${encodeURIComponent(pageId)}/insights`,
    { token: pageToken, params: { metric: metrics.join(","), period } },
    (body) => {
      const rec = isRecord(body) ? body : {};
      const data = Array.isArray(rec.data) ? rec.data : [];
      const out: MetaInsightMetric[] = [];
      for (const m of data) {
        if (!isRecord(m)) continue;
        const name = asString(m.name);
        if (!name) continue;
        const values: MetaInsightValue[] = [];
        if (Array.isArray(m.values)) {
          for (const v of m.values) {
            if (!isRecord(v)) continue;
            values.push({
              value: asNumber(v.value) ?? 0,
              endTime: asString(v.end_time),
            });
          }
        }
        out.push({
          name,
          period: asString(m.period) ?? period,
          title: asString(m.title),
          values,
        });
      }
      return out;
    }
  );
}
