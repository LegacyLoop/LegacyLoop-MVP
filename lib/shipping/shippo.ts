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

  return (data.rates || [])
    .filter((r: any) => ALLOWED_CARRIERS.includes(r.provider?.toLowerCase()))
    .map((r: any) => ({
      carrier: r.provider,
      service: r.servicelevel?.name || r.servicelevel?.token || "Standard",
      rate: parseFloat(r.amount),
      currency: r.currency || "USD",
      estimatedDays: r.estimated_days || r.days || 5,
    }))
    .sort((a: ShippingRate, b: ShippingRate) => a.rate - b.rate);
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
    // Small items
    const base = 6 + w * 1.5;
    rates.push(
      { carrier: "USPS", service: "Priority Mail", rate: round(base * 1.4 * distFactor), currency: "USD", estimatedDays: dist < 100 ? 2 : 3, isDemo: true },
      { carrier: "USPS", service: "Ground Advantage", rate: round(base * distFactor), currency: "USD", estimatedDays: dist < 100 ? 3 : 5, isDemo: true },
      { carrier: "UPS", service: "Ground", rate: round(base * 1.6 * distFactor), currency: "USD", estimatedDays: dist < 100 ? 3 : dist < 300 ? 5 : 7, isDemo: true },
      { carrier: "FedEx", service: "Ground", rate: round(base * 1.7 * distFactor), currency: "USD", estimatedDays: dist < 100 ? 3 : dist < 300 ? 5 : 7, isDemo: true },
    );
  } else if (isLarge) {
    // Large/furniture items — no USPS Priority
    const base = 15 + w * 0.8;
    rates.push(
      { carrier: "USPS", service: "Parcel Select Ground", rate: round(base * 1.1 * distFactor), currency: "USD", estimatedDays: dist < 100 ? 5 : dist < 300 ? 7 : 10, isDemo: true },
      { carrier: "UPS", service: "Ground", rate: round(base * 1.3 * distFactor), currency: "USD", estimatedDays: dist < 100 ? 4 : dist < 300 ? 6 : 8, isDemo: true },
      { carrier: "UPS", service: "3 Day Select", rate: round(base * 2.0 * distFactor), currency: "USD", estimatedDays: 3, isDemo: true },
      { carrier: "FedEx", service: "Ground", rate: round(base * 1.35 * distFactor), currency: "USD", estimatedDays: dist < 100 ? 4 : dist < 300 ? 6 : 8, isDemo: true },
      { carrier: "FedEx", service: "Home Delivery", rate: round(base * 1.45 * distFactor), currency: "USD", estimatedDays: dist < 100 ? 3 : 5, isDemo: true },
    );
    if (distFactor < 1.5) {
      rates.push(
        { carrier: "FedEx", service: "Express Saver", rate: round(base * 2.8 * distFactor), currency: "USD", estimatedDays: 3, isDemo: true },
      );
    }
  } else {
    // Medium items
    const base = 10 + w * 1.0;
    rates.push(
      { carrier: "USPS", service: "Priority Mail", rate: round(base * 1.2 * distFactor), currency: "USD", estimatedDays: dist < 100 ? 2 : 3, isDemo: true },
      { carrier: "USPS", service: "Ground Advantage", rate: round(base * 0.85 * distFactor), currency: "USD", estimatedDays: dist < 100 ? 3 : dist < 300 ? 5 : 7, isDemo: true },
      { carrier: "UPS", service: "Ground", rate: round(base * 1.4 * distFactor), currency: "USD", estimatedDays: dist < 100 ? 3 : dist < 300 ? 5 : 7, isDemo: true },
      { carrier: "UPS", service: "3 Day Select", rate: round(base * 2.1 * distFactor), currency: "USD", estimatedDays: 3, isDemo: true },
      { carrier: "FedEx", service: "Ground", rate: round(base * 1.45 * distFactor), currency: "USD", estimatedDays: dist < 100 ? 3 : dist < 300 ? 5 : 7, isDemo: true },
      { carrier: "FedEx", service: "Home Delivery", rate: round(base * 1.55 * distFactor), currency: "USD", estimatedDays: dist < 100 ? 3 : 5, isDemo: true },
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
 * Get shipping rates. Uses Shippo API if configured, otherwise demo rates.
 */
export async function getShippingRates(
  from: ShippingAddress,
  to: ShippingAddress,
  parcel: Parcel
): Promise<{ rates: ShippingRate[]; isDemo: boolean }> {
  if (SHIPPO_TOKEN && SHIPPO_TOKEN !== "your_shippo_api_token_here") {
    try {
      const rates = await fetchShippoRates(from, to, parcel);
      console.log(`[shippo] Got ${rates.length} rates from Shippo API (${from.zip} → ${to.zip}, ${parcel.weight}lbs)`);
      return { rates, isDemo: false };
    } catch (err) {
      console.error("[shippo] Shippo API failed, falling back to demo rates:", err);
      return { rates: getDemoRates(from, to, parcel), isDemo: true };
    }
  }

  console.log("[shippo] Using demo rates — Shippo API token not configured");
  return { rates: getDemoRates(from, to, parcel), isDemo: true };
}
