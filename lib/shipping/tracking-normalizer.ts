/**
 * Tracking Status Normalizer
 * Maps raw carrier API responses to LegacyLoop's 5-status state machine.
 *
 * Statuses: CREATED → PICKED_UP → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
 *
 * To add a new carrier: add a normalize function and register it
 * in normalizeTrackingResponse().
 */

export type NormalizedStatus =
  | "CREATED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED";

export type NormalizedTracking = {
  status: NormalizedStatus;
  timestamp: string;
  location: string | null;
  description: string | null;
  carrier: string;
  raw: any; // preserve full carrier response for data retention
};

export const STATUS_ORDER: NormalizedStatus[] = [
  "CREATED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

// ── FedEx Normalization ──────────────────────────────────────────

// FedEx status codes → our statuses
// Reference: FedEx Track API v1 response.output.completeTrackResults
const FEDEX_STATUS_MAP: Record<string, NormalizedStatus> = {
  // Pre-shipment / label created
  OC: "CREATED",
  PU: "PICKED_UP",
  PX: "PICKED_UP",
  AA: "PICKED_UP",
  // In transit
  IT: "IN_TRANSIT",
  IX: "IN_TRANSIT",
  AR: "IN_TRANSIT",
  DP: "IN_TRANSIT",
  TR: "IN_TRANSIT",
  CC: "IN_TRANSIT",
  CD: "IN_TRANSIT",
  CH: "IN_TRANSIT",
  DE: "IN_TRANSIT",
  // Out for delivery
  OD: "OUT_FOR_DELIVERY",
  FD: "OUT_FOR_DELIVERY",
  // Delivered
  DL: "DELIVERED",
};

export function normalizeFedEx(raw: any): NormalizedTracking | null {
  try {
    // FedEx v1 response: output.completeTrackResults[0].trackResults[0]
    const results = raw?.output?.completeTrackResults;
    if (!results?.length) return null;

    const trackResult = results[0]?.trackResults?.[0];
    if (!trackResult) return null;

    const latestStatus = trackResult.latestStatusDetail;
    const statusCode =
      latestStatus?.code || trackResult.statusDetail?.code || "";
    const scanEvents =
      trackResult.scanEvents || trackResult.dateAndTimes || [];

    // Get the latest scan event for timestamp/location
    const latestEvent = scanEvents[0];
    const location = latestEvent?.scanLocation
      ? `${latestEvent.scanLocation.city || ""}, ${latestEvent.scanLocation.stateOrProvinceCode || ""}`.replace(
          /^, |, $/g,
          ""
        )
      : latestStatus?.ancillaryDetails?.[0]?.location || null;

    const timestamp =
      latestEvent?.date ||
      latestStatus?.derivedStatusTimestamp ||
      new Date().toISOString();

    const status = FEDEX_STATUS_MAP[statusCode] || "IN_TRANSIT";

    return {
      status,
      timestamp,
      location: location || null,
      description:
        latestStatus?.description || latestEvent?.eventDescription || null,
      carrier: "FedEx",
      raw,
    };
  } catch (e) {
    console.error("[TrackingNormalizer] FedEx parse error:", e);
    return null;
  }
}

// ── ShipEngine Normalization ─────────────────────────────────────

// ShipEngine status_code values → our statuses
const SHIPENGINE_STATUS_MAP: Record<string, NormalizedStatus> = {
  AC: "CREATED",
  IT: "IN_TRANSIT",
  PU: "PICKED_UP",
  AT: "IN_TRANSIT",
  SF: "IN_TRANSIT",
  DE: "IN_TRANSIT",
  EX: "IN_TRANSIT",
  OD: "OUT_FOR_DELIVERY",
  NY: "OUT_FOR_DELIVERY",
  DL: "DELIVERED",
  UN: "IN_TRANSIT",
};

export function normalizeShipEngine(raw: any): NormalizedTracking | null {
  try {
    // ShipEngine response has tracking_number, status_code, events[]
    const statusCode = raw?.status_code || "";
    const events = raw?.events || [];
    const latestEvent = events[0];

    const location = latestEvent?.city_locality
      ? `${latestEvent.city_locality}, ${latestEvent.state_province || ""}`.replace(
          /^, |, $/g,
          ""
        )
      : null;

    const timestamp =
      latestEvent?.occurred_at ||
      latestEvent?.carrier_occurred_at ||
      new Date().toISOString();

    const status = SHIPENGINE_STATUS_MAP[statusCode] || "IN_TRANSIT";

    return {
      status,
      timestamp,
      location,
      description:
        latestEvent?.description || raw?.status_description || null,
      carrier: raw?.carrier_name || "ShipEngine",
      raw,
    };
  } catch (e) {
    console.error("[TrackingNormalizer] ShipEngine parse error:", e);
    return null;
  }
}

// ── Shippo Normalization ─────────────────────────────────────────

// Shippo tracking_status.status values → our statuses
const SHIPPO_STATUS_MAP: Record<string, NormalizedStatus> = {
  PRE_TRANSIT: "CREATED",
  TRANSIT: "IN_TRANSIT",
  DELIVERED: "DELIVERED",
  RETURNED: "IN_TRANSIT",
  FAILURE: "IN_TRANSIT",
  UNKNOWN: "IN_TRANSIT",
};

export function normalizeShippo(raw: any): NormalizedTracking | null {
  try {
    const trackingStatus = raw?.tracking_status;
    if (!trackingStatus) return null;

    const shippoStatus = trackingStatus.status || "";
    const location = trackingStatus.location
      ? `${trackingStatus.location.city || ""}, ${trackingStatus.location.state || ""}`.replace(
          /^, |, $/g,
          ""
        )
      : null;

    return {
      status: SHIPPO_STATUS_MAP[shippoStatus] || "IN_TRANSIT",
      timestamp: trackingStatus.status_date || new Date().toISOString(),
      location,
      description: trackingStatus.status_details || null,
      carrier: raw?.carrier || "Shippo",
      raw,
    };
  } catch (e) {
    console.error("[TrackingNormalizer] Shippo parse error:", e);
    return null;
  }
}

// ── Unified Normalizer ───────────────────────────────────────────

export function normalizeTrackingResponse(
  carrier: string,
  raw: any
): NormalizedTracking | null {
  const carrierLower = carrier.toLowerCase();

  if (carrierLower.includes("fedex")) return normalizeFedEx(raw);
  if (carrierLower.includes("shipengine")) return normalizeShipEngine(raw);
  if (
    carrierLower.includes("shippo") ||
    carrierLower.includes("usps") ||
    carrierLower.includes("ups") ||
    carrierLower.includes("dhl")
  ) {
    return normalizeShippo(raw);
  }

  // Unknown carrier — return null, caller uses existing DB status
  console.warn(
    `[TrackingNormalizer] No normalizer for carrier: ${carrier}`
  );
  return null;
}

// ── Status Comparison Helper ─────────────────────────────────────

export function isStatusAdvance(
  current: string,
  incoming: NormalizedStatus
): boolean {
  const currentIdx = STATUS_ORDER.indexOf(current as NormalizedStatus);
  const incomingIdx = STATUS_ORDER.indexOf(incoming);
  return incomingIdx > currentIdx;
}
