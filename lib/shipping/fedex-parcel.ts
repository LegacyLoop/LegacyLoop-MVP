/**
 * FedEx Parcel Shipping API Integration
 * Uses FedEx REST API for parcel rate quotes.
 *
 * SEPARATE credentials from FedEx LTL.
 * Same OAuth2 flow, different API key + secret.
 *
 * Auth: OAuth2 client_credentials
 * Sandbox: https://apis-sandbox.fedex.com
 * Production: https://apis.fedex.com
 *
 * NO FAKE FALLBACK — only real API rates.
 * If auth or rates fail, returns empty array.
 */

const FEDEX_API_KEY = process.env.FEDEX_PARCEL_API_KEY || "";
const FEDEX_SECRET = process.env.FEDEX_PARCEL_SECRET_KEY || "";
const FEDEX_URL = process.env.FEDEX_PARCEL_URL || "https://apis-sandbox.fedex.com";
const FEDEX_ACCOUNT = process.env.FEDEX_ACCOUNT_NUMBER || "";

let cachedToken: { token: string; expiresAt: number } | null = null;

// ─── OAuth2 Auth ────────────────────────────────────────────────────────────

async function getAuthToken(): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }
  if (!FEDEX_API_KEY || !FEDEX_SECRET) {
    console.log("[FedEx Parcel] No API key or secret configured — skipping FedEx rates");
    return null;
  }
  if (!FEDEX_ACCOUNT) {
    console.log("[FedEx Parcel] No account number configured (FEDEX_ACCOUNT_NUMBER) — skipping");
    return null;
  }

  console.log("[FedEx Parcel] === AUTH ATTEMPT ===");
  console.log("[FedEx Parcel] URL:", `${FEDEX_URL}/oauth/token`);
  console.log("[FedEx Parcel] API Key present:", !!FEDEX_API_KEY, "length:", FEDEX_API_KEY.length);
  console.log("[FedEx Parcel] Secret present:", !!FEDEX_SECRET, "length:", FEDEX_SECRET.length);

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
      console.error("[FedEx Parcel] Auth FAILED — status:", res.status, "body:", body.slice(0, 500));
      return null;
    }
    const data = await res.json();
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000) - 60000,
    };
    console.log("[FedEx Parcel] Auth SUCCESS — token received, expires in", data.expires_in, "seconds");
    return cachedToken.token;
  } catch (e) {
    console.error("[FedEx Parcel] Auth error:", e);
    return null;
  }
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FedExParcelRate {
  carrier: string;
  service: string;
  rate: number;
  currency: string;
  estimatedDays: number;
  isLive: boolean;
}

// ─── Service Name Map ───────────────────────────────────────────────────────

const SERVICE_MAP: Record<string, string> = {
  FEDEX_GROUND: "FedEx Ground",
  GROUND_HOME_DELIVERY: "FedEx Home Delivery",
  FEDEX_EXPRESS_SAVER: "FedEx Express Saver",
  FEDEX_2_DAY: "FedEx 2Day",
  FEDEX_2_DAY_AM: "FedEx 2Day AM",
  STANDARD_OVERNIGHT: "Standard Overnight",
  PRIORITY_OVERNIGHT: "Priority Overnight",
  FIRST_OVERNIGHT: "First Overnight",
};

function estimateTransitDays(serviceType: string): number {
  if (serviceType.includes("OVERNIGHT") || serviceType.includes("FIRST")) return 1;
  if (serviceType.includes("2_DAY")) return 2;
  if (serviceType.includes("EXPRESS_SAVER")) return 3;
  if (serviceType.includes("GROUND") || serviceType.includes("HOME")) return 5;
  return 3;
}

// ─── Get FedEx Parcel Rates (real API only — no fake fallback) ──────────────

export async function getFedExParcelRates(
  fromZip: string,
  toZip: string,
  weight: number,
  length: number,
  width: number,
  height: number,
): Promise<FedExParcelRate[]> {
  const token = await getAuthToken();
  if (!token) {
    console.log("[FedEx Parcel] No auth token — returning empty (no fake rates)");
    return [];
  }

  console.log("[FedEx Parcel] === RATE REQUEST ===");
  console.log("[FedEx Parcel] Token available:", !!token);
  console.log(`[FedEx Parcel] Route: ${fromZip} \u2192 ${toZip}, ${weight}lbs, ${length}x${width}x${height}in`);

  try {
    const reqBody = {
      accountNumber: { value: FEDEX_ACCOUNT },
      requestedShipment: {
        shipper: {
          address: { postalCode: fromZip, countryCode: "US" },
        },
        recipient: {
          address: { postalCode: toZip, countryCode: "US", residential: true },
        },
        pickupType: "DROPOFF_AT_FEDEX_LOCATION",
        rateRequestType: ["LIST", "ACCOUNT"],
        shippingChargesPayment: {
          paymentType: "SENDER",
          payor: {
            responsibleParty: {
              accountNumber: { value: FEDEX_ACCOUNT },
            },
          },
        },
        requestedPackageLineItems: [{
          weight: { units: "LB", value: Math.max(1, weight) },
          dimensions: {
            length: Math.max(1, Math.ceil(length)),
            width: Math.max(1, Math.ceil(width)),
            height: Math.max(1, Math.ceil(height)),
            units: "IN",
          },
        }],
      },
    };

    console.log("[FedEx Parcel] Request body:", JSON.stringify(reqBody).slice(0, 500));
    console.log("[FedEx Parcel] Account:", FEDEX_ACCOUNT, "| Payment block: included");

    const rateUrl = `${FEDEX_URL}/rate/v1/rates/quotes`;
    const res = await fetch(rateUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-locale": "en_US",
      },
      body: JSON.stringify(reqBody),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[FedEx Parcel] FULL ERROR:", {
        status: res.status,
        statusText: res.statusText,
        body: errText.slice(0, 1000),
        url: rateUrl,
      });
      return [];
    }

    const data = await res.json();
    console.log("[FedEx Parcel] Response keys:", Object.keys(data));
    console.log("[FedEx Parcel] output?.rateReplyDetails count:", data.output?.rateReplyDetails?.length ?? 0);

    const rates: FedExParcelRate[] = [];

    for (const detail of (data.output?.rateReplyDetails || [])) {
      const shipDetail = detail.ratedShipmentDetails?.[0];
      if (!shipDetail) continue;

      const charge = shipDetail.totalNetCharge ?? shipDetail.totalNetFedExCharge ?? 0;
      const amount = typeof charge === "number" ? charge : parseFloat(charge) || 0;
      if (amount <= 0) continue;

      const serviceType = detail.serviceType || "";
      const transitDays = detail.commit?.dateDetail?.dayCount
        ?? detail.commit?.transitDays?.amount
        ?? estimateTransitDays(serviceType);

      rates.push({
        carrier: "FedEx",
        service: SERVICE_MAP[serviceType] || serviceType.replace(/_/g, " "),
        rate: amount,
        currency: "USD",
        estimatedDays: typeof transitDays === "number" ? transitDays : parseInt(transitDays) || estimateTransitDays(serviceType),
        isLive: true,
      });
    }

    if (rates.length === 0) {
      console.log("[FedEx Parcel] API returned 0 parseable rates — response sample:", JSON.stringify(data).slice(0, 500));
      return [];
    }

    console.log(`[FedEx Parcel] Got ${rates.length} LIVE rates for ${fromZip} \u2192 ${toZip}`);
    return rates.sort((a, b) => a.rate - b.rate);
  } catch (e) {
    console.error("[FedEx Parcel] Rate request exception:", e);
    return [];
  }
}
