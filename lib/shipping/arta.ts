/**
 * Arta API Client — White-Glove Shipping for High-Value Items
 *
 * Arta provides museum-grade shipping services used by Christie's,
 * Sotheby's, and major galleries. LegacyLoop integrates Arta for
 * premium, antique, and high-value items.
 *
 * API: https://api.arta.io
 * Auth: ARTA_APIKey <token>
 */

const ARTA_BASE = process.env.ARTA_API_BASE_URL || "https://api.arta.io";
const ARTA_KEY = process.env.ARTA_API_KEY || "";
const ARTA_VERSION = process.env.ARTA_API_VERSION || "2021-01-01";
const ARTA_TIMEOUT = Number(process.env.ARTA_QUOTE_TIMEOUT_MS) || 6000;

// ─── Types ──────────────────────────────────────────────────────

export interface ArtaObject {
  subtype: string;
  width: number;
  height: number;
  depth: number;
  weight: number;
  value: number;
  value_currency: string;
  unit_of_measurement: string;
}

export interface ArtaLocation {
  address_line_1?: string;
  city?: string;
  region?: string;
  postal_code: string;
  country: string;
  contacts?: { name: string; email_address?: string; phone_number?: string }[];
}

export interface ArtaQuoteRequest {
  origin: ArtaLocation;
  destination: ArtaLocation;
  objects: ArtaObject[];
  internal_reference?: string;
  insurance?: string;
}

export interface ArtaServiceOption {
  quote_type: string;
  total: number;
  total_currency: string;
  included_services: string[];
  included_insurance_policy?: {
    amount: number;
    amount_currency: string;
    id: string;
  } | null;
  is_estimated: boolean;
  detail?: string;
}

export interface ArtaQuoteResponse {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  quote_type?: string;
  quotes: ArtaServiceOption[];
  shortcode?: string;
  hosted_session_url?: string;
  expires_at?: string;
}

interface ArtaError {
  errors: { detail: string }[];
}

// ─── API Helpers ────────────────────────────────────────────────

async function artaFetch<T>(
  endpoint: string,
  options: { method?: string; body?: unknown } = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  const { method = "GET", body } = options;

  if (!ARTA_KEY) {
    console.error("[arta] No ARTA_API_KEY configured");
    return { data: null, error: "Arta API key not configured", status: 0 };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ARTA_TIMEOUT);
  const startTime = Date.now();

  try {
    const res = await fetch(`${ARTA_BASE}${endpoint}`, {
      method,
      headers: {
        "Authorization": `ARTA_APIKey ${ARTA_KEY}`,
        "Content-Type": "application/json",
        "Arta-API-Version": ARTA_VERSION,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const elapsed = Date.now() - startTime;
    const json = await res.json();
    console.log(`[arta] ${method} ${endpoint} → ${res.status} (${elapsed}ms)`);

    if (!res.ok) {
      const errMsg = (json as ArtaError)?.errors?.[0]?.detail || `HTTP ${res.status}`;
      console.error(`[arta] Error: ${errMsg}`, JSON.stringify(json).slice(0, 500));
      return { data: null, error: errMsg, status: res.status };
    }

    return { data: json as T, error: null, status: res.status };
  } catch (err: unknown) {
    const elapsed = Date.now() - startTime;
    if ((err as Error).name === "AbortError") {
      console.error(`[arta] Request timed out after ${ARTA_TIMEOUT}ms`);
      return { data: null, error: `Arta request timed out (${ARTA_TIMEOUT}ms)`, status: 0 };
    }
    console.error(`[arta] Fetch error (${elapsed}ms):`, (err as Error).message);
    return { data: null, error: (err as Error).message, status: 0 };
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Public API ─────────────────────────────────────────────────

export async function getArtaQuote(
  request: ArtaQuoteRequest
): Promise<{ quotes: ArtaServiceOption[]; requestId: string | null; error: string | null; hosted_session_url?: string }> {
  console.log(`[arta] Requesting quote for ${request.objects.length} object(s)`,
    `${request.origin.postal_code} → ${request.destination.postal_code}`);

  const { data, error } = await artaFetch<ArtaQuoteResponse>("/requests", {
    method: "POST",
    body: { request },
  });

  if (error || !data) {
    return { quotes: [], requestId: null, error: error || "No response from Arta" };
  }

  console.log(`[arta] Quote ${data.id}: ${data.status}, ${data.quotes?.length || 0} options`,
    data.quotes?.map(q => `${q.quote_type}=$${q.total}`).join(", "));

  return {
    quotes: data.quotes || [],
    requestId: data.id,
    error: null,
    hosted_session_url: data.hosted_session_url,
  };
}

export async function getArtaRequest(requestId: string): Promise<{
  data: ArtaQuoteResponse | null;
  error: string | null;
}> {
  const { data, error } = await artaFetch<ArtaQuoteResponse>(`/requests/${requestId}`);
  return { data, error };
}

export function isArtaEligible(item: {
  valueLow?: number | null;
  valueHigh?: number | null;
  isFragile?: boolean;
  aiShippingDifficulty?: string | null;
  category?: string | null;
  isAntique?: boolean;
}): boolean {
  const valMid = ((item.valueLow || 0) + (item.valueHigh || 0)) / 2;
  const isPremium = valMid > 2000;
  const isHighValue = valMid > 500;

  if (isPremium) return true;
  if (isHighValue && item.isAntique) return true;
  if (isHighValue && item.isFragile) return true;
  if (isHighValue && (item.aiShippingDifficulty === "Difficult" || item.aiShippingDifficulty === "Freight only")) return true;

  const artCategories = ["art", "antique", "collectible", "fine art", "sculpture", "painting"];
  if (isHighValue && item.category && artCategories.includes(item.category.toLowerCase())) return true;

  return false;
}

export function buildArtaRequest(item: {
  title?: string;
  category?: string | null;
  aiWeightLbs?: number | null;
  shippingWeight?: number | null;
  aiDimsEstimate?: string | null;
  shippingLength?: number | null;
  shippingWidth?: number | null;
  shippingHeight?: number | null;
  valueLow?: number | null;
  valueHigh?: number | null;
  id?: string;
}, origin: { zip: string }, destination: { zip: string }): ArtaQuoteRequest {
  const weight = item.shippingWeight || item.aiWeightLbs || 20;
  let length = item.shippingLength || 24;
  let width = item.shippingWidth || 18;
  let height = item.shippingHeight || 18;

  if (!item.shippingLength && item.aiDimsEstimate) {
    const match = item.aiDimsEstimate.match(/(\d+(?:\.\d+)?)\s*[x\u00D7X]\s*(\d+(?:\.\d+)?)\s*[x\u00D7X]\s*(\d+(?:\.\d+)?)/);
    if (match) {
      length = parseFloat(match[1]);
      width = parseFloat(match[2]);
      height = parseFloat(match[3]);
    }
  }

  const valMid = ((item.valueLow || 0) + (item.valueHigh || 0)) / 2;

  return {
    origin: { postal_code: origin.zip, country: "US" },
    destination: { postal_code: destination.zip, country: "US" },
    objects: [{
      subtype: item.title || item.category || "Antique / Collectible",
      width,
      height,
      depth: length,
      weight,
      value: Math.round(valMid * 100) / 100,
      value_currency: "USD",
      unit_of_measurement: "in",
    }],
    internal_reference: item.id || undefined,
    insurance: "arta_transit_insurance",
  };
}
