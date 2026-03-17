/**
 * Metro Shipping Estimates
 *
 * Estimates shipping costs and delivery times to the top 5 US metros.
 * Used in the pre-sale ShippingPanel to show sellers what shipping
 * would cost to major buyer markets.
 */

import { estimateShippingCost } from "@/lib/pricing/market-data";

export interface MetroEstimate {
  city: string;
  zip: string;
  estimatedCost: number;
  estimatedDays: number;
  isCheapest: boolean;
  isFastest: boolean;
}

const METROS = [
  { city: "New York, NY", zip: "100" },
  { city: "Los Angeles, CA", zip: "900" },
  { city: "Chicago, IL", zip: "606" },
  { city: "Houston, TX", zip: "770" },
  { city: "Phoenix, AZ", zip: "850" },
];

// Simplified transit-day estimation based on zip prefix distance
function estimateDays(fromZip: string, toZip: string): number {
  if (!fromZip || !toZip) return 5;
  // Same first digit = ~2-3 days, different = 4-6
  if (fromZip[0] === toZip[0]) return 2;
  // Adjacent digit regions
  const diff = Math.abs(parseInt(fromZip[0]) - parseInt(toZip[0]));
  if (diff <= 2) return 3;
  if (diff <= 4) return 4;
  return 5;
}

export function getMetroEstimates(fromZip: string | null, weightLbs: number): MetroEstimate[] {
  const from = fromZip ?? "049"; // Default to Maine

  const estimates = METROS.map((metro) => ({
    city: metro.city,
    zip: metro.zip,
    estimatedCost: Math.round(estimateShippingCost(from, metro.zip, weightLbs) * 100) / 100,
    estimatedDays: estimateDays(from, metro.zip),
    isCheapest: false,
    isFastest: false,
  }));

  // Mark cheapest and fastest
  const minCost = Math.min(...estimates.map((e) => e.estimatedCost));
  const minDays = Math.min(...estimates.map((e) => e.estimatedDays));

  for (const est of estimates) {
    if (est.estimatedCost === minCost) est.isCheapest = true;
    if (est.estimatedDays === minDays) est.isFastest = true;
  }

  return estimates;
}
