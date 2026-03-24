/**
 * FedEx LTL Freight API Integration
 * Uses FedEx REST API v1 for LTL freight quotes.
 *
 * Auth: OAuth2 client_credentials flow
 * Sandbox: https://apis-sandbox.fedex.com
 * Production: https://apis.fedex.com
 */

const FEDEX_API_KEY = process.env.FEDEX_LTL_API_KEY || process.env.FEDEX_API_KEY || "";
const FEDEX_SECRET = process.env.FEDEX_LTL_SECRET_KEY || process.env.FEDEX_SECRET_KEY || "";
const FEDEX_URL = process.env.FEDEX_LTL_URL || "https://apis-sandbox.fedex.com";

let cachedToken: { token: string; expiresAt: number } | null = null;

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FedExLTLAddress {
  streetLines: string[];
  city: string;
  stateOrProvinceCode: string;
  postalCode: string;
  countryCode: string;
  residential?: boolean;
}

export interface FedExLTLQuoteRequest {
  shipper: FedExLTLAddress;
  recipient: FedExLTLAddress;
  commodities: {
    description: string;
    weight: { units: "LB"; value: number };
    dimensions: { length: number; width: number; height: number; units: "IN" };
    freightClass: string;
    pieces: number;
    packaging: string;
  }[];
  serviceType?: string;
}

export interface FedExLTLQuote {
  carrier: string;
  service: string;
  totalCharge: number;
  currency: string;
  transitDays: number;
  quoteId: string;
  surcharges: { description: string; amount: number }[];
  isLive: boolean;
}

// ─── OAuth2 Auth ────────────────────────────────────────────────────────────

async function getAuthToken(): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }
  if (!FEDEX_API_KEY || !FEDEX_SECRET) {
    console.log("[FedEx LTL] No API key or secret configured");
    return null;
  }

  console.log("[FedEx LTL] === AUTH ATTEMPT ===");
  console.log("[FedEx LTL] URL:", `${FEDEX_URL}/oauth/token`);
  console.log("[FedEx LTL] API Key present:", !!FEDEX_API_KEY, "length:", FEDEX_API_KEY.length);
  console.log("[FedEx LTL] Secret present:", !!FEDEX_SECRET, "length:", FEDEX_SECRET.length);

  try {
    const res = await fetch(`${FEDEX_URL}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: FEDEX_API_KEY,
        client_secret: FEDEX_SECRET,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[FedEx LTL] Auth FAILED — status:", res.status, "body:", body.slice(0, 500));
      return null;
    }
    const data = await res.json();
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000) - 60000,
    };
    console.log("[FedEx LTL] Auth SUCCESS — token received, expires in", data.expires_in, "seconds");
    return cachedToken.token;
  } catch (e) {
    console.error("[FedEx LTL] Auth error:", e);
    return null;
  }
}

// ─── Get LTL Freight Rate ───────────────────────────────────────────────────

export async function getFedExLTLQuote(req: FedExLTLQuoteRequest): Promise<FedExLTLQuote | null> {
  const token = await getAuthToken();
  if (!token) return null;

  console.log("[FedEx LTL] === RATE REQUEST ===");
  console.log("[FedEx LTL] Token available:", !!token);
  console.log("[FedEx LTL] Request URL:", `${FEDEX_URL}/rate/v1/rates/quotes`);

  try {
    const res = await fetch(`${FEDEX_URL}/rate/v1/rates/quotes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-locale": "en_US",
      },
      body: JSON.stringify({
        accountNumber: { value: "" },
        requestedShipment: {
          shipper: { address: req.shipper },
          recipient: { address: req.recipient },
          serviceType: req.serviceType || "FEDEX_FREIGHT_ECONOMY",
          requestedPackageLineItems: req.commodities.map((c) => ({
            weight: c.weight,
            dimensions: c.dimensions,
            subPackagingType: c.packaging || "PALLET",
            groupPackageCount: c.pieces,
            contentRecord: { received: false, description: c.description },
          })),
          rateRequestType: ["LIST", "ACCOUNT"],
          pickupType: "USE_SCHEDULED_PICKUP",
          freightShipmentDetail: {
            role: "SHIPPER",
            freightShipmentLineItems: req.commodities.map((c) => ({
              freightClass: `CLASS_${c.freightClass}`,
              weight: c.weight,
              dimensions: c.dimensions,
              pieces: c.pieces,
              description: c.description,
              packaging: c.packaging || "PALLET",
            })),
          },
        },
      }),
    });

    console.log("[FedEx LTL] Rate response status:", res.status);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[FedEx LTL] FULL ERROR:", { status: res.status, statusText: res.statusText, body: errText.slice(0, 1000), url: `${FEDEX_URL}/rate/v1/rates/quotes` });
      return null;
    }

    const data = await res.json();
    console.log("[FedEx LTL] Response keys:", Object.keys(data));
    console.log("[FedEx LTL] rateReplyDetails count:", data.output?.rateReplyDetails?.length ?? 0);
    const rate = data.output?.rateReplyDetails?.[0];
    if (!rate) {
      console.log("[FedEx LTL] No rate reply details in response");
      return null;
    }

    const totalCharge = rate.ratedShipmentDetails?.[0]?.totalNetCharge ??
      rate.ratedShipmentDetails?.[0]?.totalNetFedExCharge ?? 0;
    const surcharges = (rate.ratedShipmentDetails?.[0]?.shipmentRateDetail?.surCharges || [])
      .map((s: any) => ({ description: s.description || s.type, amount: s.amount?.amount || 0 }));

    console.log(`[FedEx LTL] Got quote: $${totalCharge} via ${rate.serviceType}`);

    return {
      carrier: "FedEx Freight",
      service: (rate.serviceType || "FEDEX_FREIGHT_ECONOMY").replace(/_/g, " "),
      totalCharge: typeof totalCharge === "number" ? totalCharge : parseFloat(totalCharge) || 0,
      currency: "USD",
      transitDays: rate.commit?.transitDays?.amount || rate.commit?.dateDetail?.dayCount || 5,
      quoteId: data.transactionId || `fedex-${Date.now()}`,
      surcharges,
      isLive: true,
    };
  } catch (e) {
    console.error("[FedEx LTL] Quote failed:", e);
    return null;
  }
}

// ─── Track FedEx Freight ────────────────────────────────────────────────────

export async function trackFedExFreight(trackingNumber: string): Promise<any> {
  const token = await getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(`${FEDEX_URL}/track/v1/trackingnumbers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        trackingInfo: [{ trackingNumberInfo: { trackingNumber } }],
        includeDetailedScans: true,
      }),
    });
    return await res.json();
  } catch (e) {
    console.error("[FedEx LTL] Track failed:", e);
    return null;
  }
}
