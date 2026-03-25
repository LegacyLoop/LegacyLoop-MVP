/**
 * Simulated LTL Freight Calculator
 *
 * Returns estimated freight shipping costs from 3 LTL carriers
 * for large/heavy items that exceed parcel limits.
 */

export interface FreightEstimate {
  carrier: string;
  service: string;
  costLow: number;
  costHigh: number;
  transitDays: { min: number; max: number };
  residentialSurcharge: number;
  liftgateSurcharge: number;
  deliveryNotification: number;
  totalLow: number;
  totalHigh: number;
  /** Total with all standard services (residential + liftgate + notification) */
  allInLow: number;
  allInHigh: number;
}

export interface FreightInput {
  weight: number; // lbs
  lengthIn: number; // inches
  widthIn: number;
  heightIn: number;
  fromZip?: string;
  toZip?: string;
  residential?: boolean;
  liftgate?: boolean;
}

interface CarrierProfile {
  name: string;
  service: string;
  baseCost: number;
  perLbOverThreshold: number;
  threshold: number;
  residentialSurcharge: number;
  liftgateSurcharge: number;
  deliveryNotification: number;
  transitMin: number;
  transitMax: number;
}

const CARRIERS: CarrierProfile[] = [
  {
    name: "XPO Logistics",
    service: "LTL Standard",
    baseCost: 189,
    perLbOverThreshold: 0.45,
    threshold: 100,
    residentialSurcharge: 75,
    liftgateSurcharge: 95,
    deliveryNotification: 15,
    transitMin: 3,
    transitMax: 7,
  },
  {
    name: "Old Dominion",
    service: "LTL Economy",
    baseCost: 159,
    perLbOverThreshold: 0.38,
    threshold: 100,
    residentialSurcharge: 65,
    liftgateSurcharge: 85,
    deliveryNotification: 12,
    transitMin: 5,
    transitMax: 10,
  },
  {
    name: "R+L Carriers",
    service: "LTL Value",
    baseCost: 139,
    perLbOverThreshold: 0.32,
    threshold: 100,
    residentialSurcharge: 55,
    liftgateSurcharge: 75,
    deliveryNotification: 10,
    transitMin: 7,
    transitMax: 14,
  },
  {
    name: "Estes Express",
    service: "LTL Standard",
    baseCost: 169,
    perLbOverThreshold: 0.40,
    threshold: 100,
    residentialSurcharge: 65,
    liftgateSurcharge: 85,
    deliveryNotification: 12,
    transitMin: 4,
    transitMax: 8,
  },
  {
    name: "SAIA",
    service: "LTL Standard",
    baseCost: 175,
    perLbOverThreshold: 0.42,
    threshold: 100,
    residentialSurcharge: 70,
    liftgateSurcharge: 90,
    deliveryNotification: 12,
    transitMin: 5,
    transitMax: 9,
  },
  {
    name: "FedEx Freight",
    service: "FedEx Freight Economy",
    baseCost: 199,
    perLbOverThreshold: 0.48,
    threshold: 100,
    residentialSurcharge: 80,
    liftgateSurcharge: 95,
    deliveryNotification: 15,
    transitMin: 3,
    transitMax: 7,
  },
];

export function getFreightEstimates(input: FreightInput): FreightEstimate[] {
  const { weight, residential = false, liftgate = false } = input;

  return CARRIERS.map((carrier) => {
    // Base cost + per-lb charge for weight over threshold
    const overWeight = Math.max(0, weight - carrier.threshold);
    const baseCost = carrier.baseCost + overWeight * carrier.perLbOverThreshold;

    // Low/high range: 80% and 120% of calculated cost
    const costLow = Math.round(baseCost * 0.8 * 100) / 100;
    const costHigh = Math.round(baseCost * 1.2 * 100) / 100;

    // Surcharges (only applied if flags are set)
    const resSurcharge = residential ? carrier.residentialSurcharge : 0;
    const liftSurcharge = liftgate ? carrier.liftgateSurcharge : 0;
    const notifSurcharge = carrier.deliveryNotification;

    const totalLow = Math.round((costLow + resSurcharge + liftSurcharge) * 100) / 100;
    const totalHigh = Math.round((costHigh + resSurcharge + liftSurcharge) * 100) / 100;

    // All-in pricing: includes residential + liftgate + delivery notification
    const allInLow = Math.round((costLow + carrier.residentialSurcharge + carrier.liftgateSurcharge + notifSurcharge) * 100) / 100;
    const allInHigh = Math.round((costHigh + carrier.residentialSurcharge + carrier.liftgateSurcharge + notifSurcharge) * 100) / 100;

    return {
      carrier: carrier.name,
      service: carrier.service,
      costLow,
      costHigh,
      transitDays: { min: carrier.transitMin, max: carrier.transitMax },
      residentialSurcharge: resSurcharge,
      liftgateSurcharge: liftSurcharge,
      deliveryNotification: notifSurcharge,
      totalLow,
      totalHigh,
      allInLow,
      allInHigh,
    };
  });
}

/**
 * Get midpoint freight estimates formatted for the LTL quote API.
 * Returns single-price quotes from all 6 carriers.
 * These are calculated estimates based on real carrier pricing formulas.
 */
export function getFreightQuoteMidpoints(input: FreightInput): {
  carrier: string;
  service: string;
  total_amount: number;
  transit_days: number;
  accessorials: { residential: number; liftgate: number; notification: number };
  isLive: false;
  source: "estimate";
}[] {
  const estimates = getFreightEstimates(input);
  return estimates.map(est => ({
    carrier: est.carrier,
    service: est.service,
    total_amount: Math.round((est.totalLow + est.totalHigh) / 2 * 100) / 100,
    transit_days: Math.round((est.transitDays.min + est.transitDays.max) / 2),
    accessorials: {
      residential: est.residentialSurcharge,
      liftgate: est.liftgateSurcharge,
      notification: est.deliveryNotification,
    },
    isLive: false as const,
    source: "estimate" as const,
  }));
}
