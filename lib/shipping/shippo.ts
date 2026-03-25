/**
 * Shippo API integration for real carrier rates.
 * Falls back to realistic demo rates when SHIPPO_API_TOKEN is not configured.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ShippingAddress {
  street?: string;
  city?: string;
  state?: string;
  zip: string;
  country?: string;
}

export interface Parcel {
  length: number; // inches
  width: number;
  height: number;
  weight: number; // lbs
}

export interface ShippingRate {
  carrier: string;
  service: string;
  rate: number;
  currency: string;
  estimatedDays: number;
  isDemo?: boolean;
}

export interface FreightQuote {
  carrier: string;
  service: string;
  totalCost: number;
  transitDays: string;
  includedServices: string[];
  extraOptions: string[];
  isDemo?: boolean;
}

// ─── Shippo API (live mode) ─────────────────────────────────────────────────

const SHIPPO_TOKEN = process.env.SHIPPO_API_KEY || process.env.SHIPPO_API_TOKEN || "";
const SHIPPO_BASE = "https://api.goshippo.com";

async function fetchShippoRates(
  from: ShippingAddress,
  to: ShippingAddress,
  parcel: Parcel
): Promise<ShippingRate[]> {
  const res = await fetch(`${SHIPPO_BASE}/shipments`, {
    method: "POST",
    headers: {
      Authorization: `ShippoToken ${SHIPPO_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      address_from: {
        street1: from.street || "123 Main St",
        city: from.city || "Waterville",
        state: from.state || "ME",
        zip: from.zip,
        country: from.country || "US",
      },
      address_to: {
        street1: to.street || "456 Buyer St",
        city: to.city || "New York",
        state: to.state || "NY",
        zip: to.zip,
        country: to.country || "US",
      },
      parcels: [
        {
          length: String(parcel.length),
          width: String(parcel.width),
          height: String(parcel.height),
          distance_unit: "in",
          weight: String(parcel.weight),
          mass_unit: "lb",
        },
      ],
      async: false,
    }),
  });

  if (!res.ok) throw new Error(`Shippo API error: ${res.status}`);
  const data = await res.json();

  const ALLOWED_CARRIERS = ["usps", "ups", "fedex"];

  const mapped = (data.rates || [])
    .filter((r: any) => ALLOWED_CARRIERS.includes(r.provider?.toLowerCase()))
    .map((r: any) => ({
      carrier: r.provider,
      service: r.servicelevel?.name || r.servicelevel?.token || "Standard",
      rate: parseFloat(r.amount),
      currency: r.currency || "USD",
      estimatedDays: r.estimated_days || r.days || 5,
    }))
    .filter((r: ShippingRate) => r.rate > 0)
    .sort((a: ShippingRate, b: ShippingRate) => a.rate - b.rate);

  console.log(`[shippo] ${mapped.length} live rates:`, mapped.map((r: ShippingRate) => `${r.carrier} ${r.service} $${r.rate}`).join(" | "));
  return mapped;
}

// ─── Demo rates ─────────────────────────────────────────────────────────────

function zipDistance(fromZip: string, toZip: string): number {
  const f = parseInt(fromZip.slice(0, 3)) || 0;
  const t = parseInt(toZip.slice(0, 3)) || 0;
  return Math.abs(f - t);
}

function getDemoRates(
  from: ShippingAddress,
  to: ShippingAddress,
  parcel: Parcel
): ShippingRate[] {
  const dist = zipDistance(from.zip, to.zip);
  // Dimensional weight: L×W×H / 139 (UPS/FedEx standard)
  const dimWeight = (parcel.length * parcel.width * parcel.height) / 139;
  const w = Math.max(parcel.weight, dimWeight); // Billable weight
  const vol = parcel.length * parcel.width * parcel.height;
  const isLarge = vol > 5000 || w > 30;
  const isSmall = vol < 1500 && w < 5;

  // Distance factor: 1.0 (same region) to 2.0 (cross-country)
  const distFactor = 1 + Math.min(dist / 500, 1.0);

  const rates: ShippingRate[] = [];

  if (isSmall) {
    // Small items — 14 services across USPS/UPS/FedEx
    const base = 6 + w * 1.5;
    rates.push(
      { carrier: "USPS", service: "Ground Advantage", rate: round(base * distFactor), currency: "USD", estimatedDays: dist < 100 ? 3 : 5, isDemo: true },
      { carrier: "USPS", service: "First Class Package", rate: round(base * 0.85 * distFactor), currency: "USD", estimatedDays: dist < 100 ? 3 : 5, isDemo: true },
      { carrier: "USPS", service: "Priority Mail", rate: round(base * 1.4 * distFactor), currency: "USD", estimatedDays: dist < 100 ? 2 : 3, isDemo: true },
      { carrier: "USPS", service: "Priority Mail Express", rate: round(base * 3.0 * distFactor), currency: "USD", estimatedDays: 1, isDemo: true },
      { carrier: "UPS", service: "Ground", rate: round(base * 1.6 * distFactor), currency: "USD", estimatedDays: dist < 100 ? 3 : dist < 300 ? 5 : 7, isDemo: true },
      { carrier: "UPS", service: "3 Day Select", rate: round(base * 2.2 * distFactor), currency: "USD", estimatedDays: 3, isDemo: true },
      { carrier: "UPS", service: "2nd Day Air", rate: round(base * 2.5 * distFactor), currency: "USD", estimatedDays: 2, isDemo: true },
      { carrier: "UPS", service: "Next Day Air Saver", rate: round(base * 3.4 * distFactor), currency: "USD", estimatedDays: 1, isDemo: true },
      { carrier: "UPS", service: "Next Day Air", rate: round(base * 4.0 * distFactor), currency: "USD", estimatedDays: 1, isDemo: true },
      { carrier: "FedEx", service: "Ground", rate: round(base * 1.7 * distFactor), currency: "USD", estimatedDays: dist < 100 ? 3 : dist < 300 ? 5 : 7, isDemo: true },
      { carrier: "FedEx", service: "Home Delivery", rate: round(base * 1.8 * distFactor), currency: "USD", estimatedDays: dist < 100 ? 3 : 5, isDemo: true },
      { carrier: "FedEx", service: "Express Saver", rate: round(base * 2.3 * distFactor), currency: "USD", estimatedDays: 3, isDemo: true },
      { carrier: "FedEx", service: "2Day", rate: round(base * 2.8 * distFactor), currency: "USD", estimatedDays: 2, isDemo: true },
      { carrier: "FedEx", service: "Standard Overnight", rate: round(base * 3.8 * distFactor), currency: "USD", estimatedDays: 1, isDemo: true },
    );
  } else if (isLarge) {
    // Large/furniture items — 11 services across USPS/UPS/FedEx
    const base = 15 + w * 0.8;
    rates.push(
      { carrier: "USPS", service: "Parcel Select Ground", rate: round(base * 1.1 * distFactor), currency: "USD", estimatedDays: dist < 100 ? 5 : dist < 300 ? 7 : 10, isDemo: true },
      { carrier: "USPS", service: "Priority Mail", rate: round(base * 1.5 * distFactor), currency: "USD", estimatedDays: dist < 100 ? 2 : 3, isDemo: true },
      { carrier: "UPS", service: "Ground", rate: round(base * 1.3 * distFactor), currency: "USD", estimatedDays: dist < 100 ? 4 : dist < 300 ? 6 : 8, isDemo: true },
      { carrier: "UPS", service: "3 Day Select", rate: round(base * 2.0 * distFactor), currency: "USD", estimatedDays: 3, isDemo: true },
      { carrier: "UPS", service: "2nd Day Air", rate: round(base * 2.5 * distFactor), currency: "USD", estimatedDays: 2, isDemo: true },
      { carrier: "UPS", service: "Next Day Air Saver", rate: round(base * 3.5 * distFactor), currency: "USD", estimatedDays: 1, isDemo: true },
      { carrier: "FedEx", service: "Ground", rate: round(base * 1.35 * distFactor), currency: "USD", estimatedDays: dist < 100 ? 4 : dist < 300 ? 6 : 8, isDemo: true },
      { carrier: "FedEx", service: "Home Delivery", rate: round(base * 1.45 * distFactor), currency: "USD", estimatedDays: dist < 100 ? 3 : 5, isDemo: true },
      { carrier: "FedEx", service: "Express Saver", rate: round(base * 2.8 * distFactor), currency: "USD", estimatedDays: 3, isDemo: true },
      { carrier: "FedEx", service: "2Day", rate: round(base * 2.8 * distFactor), currency: "USD", estimatedDays: 2, isDemo: true },
      { carrier: "FedEx", service: "Standard Overnight", rate: round(base * 3.8 * distFactor), currency: "USD", estimatedDays: 1, isDemo: true },
    );
  } else {
    // Medium items — 13 services across USPS/UPS/FedEx
    const base = 10 + w * 1.0;
    rates.push(
      { carrier: "USPS", service: "Ground Advantage", rate: round(base * 0.85 * distFactor), currency: "USD", estimatedDays: dist < 100 ? 3 : dist < 300 ? 5 : 7, isDemo: true },
      { carrier: "USPS", service: "Priority Mail", rate: round(base * 1.2 * distFactor), currency: "USD", estimatedDays: dist < 100 ? 2 : 3, isDemo: true },
      { carrier: "USPS", service: "Priority Mail Express", rate: round(base * 2.8 * distFactor), currency: "USD", estimatedDays: 1, isDemo: true },
      { carrier: "UPS", service: "Ground", rate: round(base * 1.4 * distFactor), currency: "USD", estimatedDays: dist < 100 ? 3 : dist < 300 ? 5 : 7, isDemo: true },
      { carrier: "UPS", service: "3 Day Select", rate: round(base * 2.1 * distFactor), currency: "USD", estimatedDays: 3, isDemo: true },
      { carrier: "UPS", service: "2nd Day Air", rate: round(base * 2.4 * distFactor), currency: "USD", estimatedDays: 2, isDemo: true },
      { carrier: "UPS", service: "Next Day Air Saver", rate: round(base * 3.2 * distFactor), currency: "USD", estimatedDays: 1, isDemo: true },
      { carrier: "UPS", service: "Next Day Air", rate: round(base * 3.8 * distFactor), currency: "USD", estimatedDays: 1, isDemo: true },
      { carrier: "FedEx", service: "Ground", rate: round(base * 1.45 * distFactor), currency: "USD", estimatedDays: dist < 100 ? 3 : dist < 300 ? 5 : 7, isDemo: true },
      { carrier: "FedEx", service: "Home Delivery", rate: round(base * 1.55 * distFactor), currency: "USD", estimatedDays: dist < 100 ? 3 : 5, isDemo: true },
      { carrier: "FedEx", service: "Express Saver", rate: round(base * 2.3 * distFactor), currency: "USD", estimatedDays: 3, isDemo: true },
      { carrier: "FedEx", service: "2Day", rate: round(base * 2.6 * distFactor), currency: "USD", estimatedDays: 2, isDemo: true },
      { carrier: "FedEx", service: "Standard Overnight", rate: round(base * 3.5 * distFactor), currency: "USD", estimatedDays: 1, isDemo: true },
    );
  }

  return rates.sort((a, b) => a.rate - b.rate);
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

// ─── LTL Freight (always demo for now) ──────────────────────────────────────

export function getLTLFreightQuotes(
  originZip: string,
  destZip: string,
  weightLbs: number,
  dimensions: { length: number; width: number; height: number },
  packagingType: string
): FreightQuote[] {
  const dist = zipDistance(originZip, destZip);
  const distMult = 1 + Math.min(dist / 400, 1.2);
  const base = 120 + weightLbs * 0.45 * distMult;

  return [
    {
      carrier: "XPO Logistics",
      service: "Standard LTL",
      totalCost: round(base * 1.05),
      transitDays: dist < 200 ? "5-7" : "7-10",
      includedServices: ["Liftgate delivery", "Residential delivery", "Basic liability coverage"],
      extraOptions: ["Inside delivery +$65", "Appointment delivery +$35"],
      isDemo: true,
    },
    {
      carrier: "Estes Express",
      service: "Standard LTL",
      totalCost: round(base * 0.95),
      transitDays: dist < 200 ? "5-8" : "8-12",
      includedServices: ["Appointment delivery available", "Basic liability coverage"],
      extraOptions: ["Liftgate +$55", "Inside delivery +$75", "Blanket wrap +$40"],
      isDemo: true,
    },
    {
      carrier: "Old Dominion",
      service: "Priority LTL",
      totalCost: round(base * 1.15),
      transitDays: dist < 200 ? "4-6" : "5-8",
      includedServices: ["Liftgate delivery", "Guaranteed transit time", "Enhanced liability coverage"],
      extraOptions: ["White glove delivery +$75", "Inside placement +$50"],
      isDemo: true,
    },
    {
      carrier: "SAIA",
      service: "Standard LTL",
      totalCost: round(base * 1.0),
      transitDays: dist < 200 ? "6-8" : "6-10",
      includedServices: ["Residential delivery included", "Basic liability coverage"],
      extraOptions: ["Liftgate +$50", "Appointment +$30"],
      isDemo: true,
    },
  ].sort((a, b) => a.totalCost - b.totalCost);
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Get shipping rates. Uses Shippo API if configured, supplemented
 * with demo rates for any carrier+service combos Shippo didn't cover.
 * This ensures users always see comprehensive carrier options (11-14 services)
 * with real prices where available and smart estimates for the rest.
 */
export async function getShippingRates(
  from: ShippingAddress,
  to: ShippingAddress,
  parcel: Parcel
): Promise<{ rates: ShippingRate[]; isDemo: boolean }> {
  // Always generate demo rates — used as supplement or standalone fallback
  const demoRates = getDemoRates(from, to, parcel);

  if (SHIPPO_TOKEN && SHIPPO_TOKEN !== "your_shippo_api_token_here") {
    try {
      const liveRates = await fetchShippoRates(from, to, parcel);
      console.log(`[shippo] Got ${liveRates.length} live rates from Shippo API (${from.zip} → ${to.zip}, ${parcel.weight}lbs)`);

      if (liveRates.length === 0) {
        console.log("[shippo] Shippo returned 0 rates — using full demo set");
        return { rates: demoRates, isDemo: true };
      }

      // Build a set of carrier+service keys from live rates
      const liveKeys = new Set(
        liveRates.map((r) => `${r.carrier.toLowerCase()}_${r.service.toLowerCase()}`)
      );

      // Supplement: add demo rates for any service NOT covered by live rates
      const supplemental = demoRates.filter(
        (d) => !liveKeys.has(`${d.carrier.toLowerCase()}_${d.service.toLowerCase()}`)
      );

      const combined = [
        ...liveRates,         // Real prices — no isDemo flag
        ...supplemental,      // Estimated prices — already have isDemo: true
      ].sort((a, b) => a.rate - b.rate);

      console.log(
        `[shippo] Hybrid rates: ${liveRates.length} live + ${supplemental.length} estimated = ${combined.length} total`
      );

      // isDemo: false when we have ANY live rates (hybrid mode)
      return { rates: combined, isDemo: false };
    } catch (err) {
      console.error("[shippo] Shippo API failed, falling back to demo rates:", err);
      return { rates: demoRates, isDemo: true };
    }
  }

  console.log("[shippo] Using demo rates — Shippo API token not configured");
  return { rates: demoRates, isDemo: true };
}
