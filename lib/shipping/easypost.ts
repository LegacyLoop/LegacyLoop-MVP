/**
 * EasyPost Integration — Address Verification + Backup Carrier Rates
 *
 * EasyPost provides:
 *   1. Address verification (deliverability check, residential detection)
 *   2. Backup carrier rate shopping (USPS, UPS, FedEx via EasyPost accounts)
 *
 * Architecture role:
 *   - Shippo = PRIMARY carrier rates (most services, best coverage)
 *   - EasyPost = BACKUP carrier rates (fills gaps Shippo misses)
 *   - EasyPost = Address verification layer (validates before shipping)
 *
 * Uses EasyPost REST API v2 directly via fetch — no npm package needed.
 * Test keys start with "EZTK" and use sandbox automatically.
 */

const EASYPOST_API_KEY =
  process.env.EASYPOST_TEST_API_KEY || process.env.EASYPOST_API_KEY || "";
const EASYPOST_BASE = "https://api.easypost.com/v2";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AddressVerificationResult = {
  verified: boolean;
  residential: boolean | null;
  correctedZip: string | null;
  correctedCity: string | null;
  correctedState: string | null;
  correctedStreet: string | null;
  message: string;
  raw: any;
};

export type EasyPostRate = {
  carrier: string;
  service: string;
  rate: number;
  currency: string;
  estimatedDays: number;
  isLive: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Basic ${Buffer.from(EASYPOST_API_KEY + ":").toString("base64")}`,
    "Content-Type": "application/json",
  };
}

function isConfigured(): boolean {
  return (
    !!EASYPOST_API_KEY &&
    EASYPOST_API_KEY !== "your_easypost_api_key_here" &&
    EASYPOST_API_KEY.length > 10
  );
}

// ─── Address Verification ─────────────────────────────────────────────────────

/**
 * Verify a shipping address using EasyPost.
 * Returns verification status, residential flag, and corrected fields.
 *
 * Use cases:
 *   - Validate buyer address before generating shipping label
 *   - Detect residential vs commercial (affects carrier rates)
 *   - Correct minor address typos/formatting
 */
export async function verifyAddress(
  street1: string,
  city: string,
  state: string,
  zip: string,
  street2?: string,
  country?: string
): Promise<AddressVerificationResult> {
  const empty: AddressVerificationResult = {
    verified: false,
    residential: null,
    correctedZip: null,
    correctedCity: null,
    correctedState: null,
    correctedStreet: null,
    message: "",
    raw: null,
  };

  if (!isConfigured()) {
    console.log("[easypost] Address verification skipped — no API key configured");
    return { ...empty, message: "EasyPost not configured" };
  }

  try {
    const res = await fetch(`${EASYPOST_BASE}/addresses`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        address: {
          street1,
          street2: street2 || "",
          city,
          state,
          zip,
          country: country || "US",
          verify: ["delivery"],
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(
        "[easypost] Address verification API error:",
        res.status,
        errText.slice(0, 300)
      );
      return { ...empty, message: `API error: ${res.status}` };
    }

    const data = await res.json();
    const verifications = data.verifications?.delivery;
    const isVerified = verifications?.success === true;
    const isResidential = data.residential ?? null;
    const errors = verifications?.errors || [];
    const errorMsg = errors.length > 0 ? errors[0].message : "";

    console.log(
      `[easypost] Address verified: ${isVerified} | Residential: ${isResidential} | ${data.street1 || street1}, ${data.city || city} ${data.state || state} ${data.zip || zip}${errorMsg ? ` | Error: ${errorMsg}` : ""}`
    );

    return {
      verified: isVerified,
      residential: isResidential,
      correctedZip: data.zip || null,
      correctedCity: data.city || null,
      correctedState: data.state || null,
      correctedStreet: data.street1 || null,
      message: isVerified
        ? "Address verified"
        : errorMsg || "Verification failed",
      raw: data,
    };
  } catch (err) {
    console.error("[easypost] Address verification exception:", err);
    return { ...empty, message: "Exception during verification" };
  }
}

// ─── Backup Carrier Rates ─────────────────────────────────────────────────────

/**
 * Get shipping rates from EasyPost as a backup carrier source.
 * Returns rates from all available carriers connected to our EasyPost account.
 *
 * EasyPost test keys include USPS by default. Production keys can add
 * UPS, FedEx, DHL, and other carriers via the EasyPost dashboard.
 *
 * These rates supplement Shippo (primary). The dedupe logic in
 * rates/route.ts and estimate/route.ts handles overlapping services.
 */
export async function getEasyPostRates(
  fromZip: string,
  toZip: string,
  weightLbs: number,
  lengthIn: number,
  widthIn: number,
  heightIn: number
): Promise<EasyPostRate[]> {
  if (!isConfigured()) {
    console.log("[easypost] Rate request skipped — no API key configured");
    return [];
  }

  try {
    const res = await fetch(`${EASYPOST_BASE}/shipments`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        shipment: {
          from_address: {
            street1: "123 Main St",
            city: "Portland",
            state: "ME",
            zip: fromZip,
            country: "US",
          },
          to_address: {
            street1: "456 Destination St",
            city: "New York",
            state: "NY",
            zip: toZip,
            country: "US",
          },
          parcel: {
            length: lengthIn,
            width: widthIn,
            height: heightIn,
            weight: Math.round(weightLbs * 16), // EasyPost uses ounces
          },
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(
        "[easypost] Rate request API error:",
        res.status,
        errText.slice(0, 300)
      );
      return [];
    }

    const data = await res.json();
    const rates = data.rates || [];

    // Normalize carrier names — EasyPost uses "UPSDAP" for UPS
    const CARRIER_MAP: Record<string, string> = {
      UPSDAP: "UPS",
      USPSFirst: "USPS",
      USPSParcelSelect: "USPS",
      USPSPriorityMail: "USPS",
      FedExDefault: "FedEx",
      FedExSmartPost: "FedEx",
    };

    const ALLOWED_CARRIERS = ["usps", "ups", "fedex", "upsdap", "fedexdefault", "fedexsmartpost"];

    const mapped: EasyPostRate[] = rates
      .filter((r: any) =>
        ALLOWED_CARRIERS.includes((r.carrier || "").toLowerCase())
      )
      .map((r: any) => ({
        carrier: CARRIER_MAP[r.carrier] || r.carrier,
        service: r.service || "Standard",
        rate: parseFloat(r.rate) || 0,
        currency: r.currency || "USD",
        estimatedDays: r.est_delivery_days || r.delivery_days || 5,
        isLive: true,
      }))
      .filter((r: EasyPostRate) => r.rate > 0)
      .sort((a: EasyPostRate, b: EasyPostRate) => a.rate - b.rate);

    console.log(
      `[easypost] ${mapped.length} backup rates (${fromZip} → ${toZip}, ${weightLbs}lbs): ${mapped.map((r) => `${r.carrier} ${r.service} $${r.rate}`).join(" | ") || "none"}`
    );

    return mapped;
  } catch (err) {
    console.error("[easypost] Rate request exception:", err);
    return [];
  }
}

// ─── Convenience Exports ──────────────────────────────────────────────────────

/**
 * Quick check if EasyPost is configured and available.
 */
export function isEasyPostConfigured(): boolean {
  return isConfigured();
}
