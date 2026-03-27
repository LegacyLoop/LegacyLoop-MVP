/**
 * NHTSA (National Highway Traffic Safety Administration) API wrapper.
 * Provides real federal government vehicle data: recalls, complaints,
 * safety ratings, and VIN decoding. All endpoints are free and require
 * no authentication.
 */

// ── Interfaces ──────────────────────────────────────────────────────

export interface RecallItem {
  campaignNumber: string;
  component: string;
  summary: string;
  consequence: string;
  remedy: string;
  reportDate: string;
}

export interface ComplaintItem {
  component: string;
  summary: string;
  dateComplaint: string;
  crash: boolean;
  fire: boolean;
  injuries: number;
  deaths: number;
}

export interface SafetyRating {
  overallRating: string;
  frontCrash: string;
  sideCrash: string;
  rollover: string;
  vehicleId: number;
}

export interface VehicleHistoryReport {
  make: string;
  model: string;
  modelYear: string;
  recalls: { count: number; items: RecallItem[] };
  complaints: { count: number; items: ComplaintItem[] };
  safetyRatings: SafetyRating | null;
  reportGeneratedAt: string;
  source: string;
}

export interface VinDecodeResult {
  make: string | null;
  model: string | null;
  year: string | null;
  trim: string | null;
  bodyClass: string | null;
  driveType: string | null;
  engineCylinders: string | null;
  engineDisplacement: string | null;
  engineHP: string | null;
  fuelType: string | null;
  transmission: string | null;
  gvwr: string | null;
  wheelBase: string | null;
  plantCity: string | null;
  plantState: string | null;
  plantCountry: string | null;
  doors: string | null;
  seats: string | null;
  seatRows: string | null;
  abs: string | null;
  esc: string | null;
  backupCamera: string | null;
  blindSpotWarning: string | null;
  forwardCollisionWarning: string | null;
  laneKeepAssist: string | null;
  adaptiveCruise: string | null;
  errorCode: string | null;
  errorText: string | null;
}

// ── Cache ───────────────────────────────────────────────────────────

const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const cache = new Map<string, { data: any; ts: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data as T;
  if (entry) cache.delete(key);
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, ts: Date.now() });
}

// ── Helpers ─────────────────────────────────────────────────────────

async function nhtsaFetch(url: string): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`NHTSA ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

// ── Public Functions ────────────────────────────────────────────────

/**
 * Fetch active recalls from NHTSA for a specific vehicle.
 * Returns an array of recall campaign details including affected
 * components, consequences, and remedies.
 */
export async function fetchRecalls(
  make: string,
  model: string,
  modelYear: string
): Promise<RecallItem[]> {
  const key = `recalls:${make}:${model}:${modelYear}`;
  const cached = getCached<RecallItem[]>(key);
  if (cached) return cached;

  try {
    const data = await nhtsaFetch(
      `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${encodeURIComponent(modelYear)}`
    );
    const items: RecallItem[] = (data.results || []).map((r: any) => ({
      campaignNumber: r.NHTSACampaignNumber || "",
      component: r.Component || "",
      summary: r.Summary || "",
      consequence: r.Consequence || "",
      remedy: r.Remedy || "",
      reportDate: r.ReportReceivedDate || "",
    }));
    setCache(key, items);
    return items;
  } catch (e) {
    console.warn("[NHTSA] fetchRecalls failed:", e);
    return [];
  }
}

/**
 * Fetch consumer complaints filed with NHTSA for a specific vehicle.
 * Returns complaint details including whether crashes, fires, injuries,
 * or deaths were reported.
 */
export async function fetchComplaints(
  make: string,
  model: string,
  modelYear: string
): Promise<ComplaintItem[]> {
  const key = `complaints:${make}:${model}:${modelYear}`;
  const cached = getCached<ComplaintItem[]>(key);
  if (cached) return cached;

  try {
    const data = await nhtsaFetch(
      `https://api.nhtsa.gov/complaints/complaintsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${encodeURIComponent(modelYear)}`
    );
    const items: ComplaintItem[] = (data.results || []).map((c: any) => ({
      component: c.components || "",
      summary: c.summary || "",
      dateComplaint: c.dateComplaintFiled || "",
      crash: c.crash === "Yes",
      fire: c.fire === "Yes",
      injuries: Number(c.numberOfInjuries) || 0,
      deaths: Number(c.numberOfDeaths) || 0,
    }));
    setCache(key, items);
    return items;
  } catch (e) {
    console.warn("[NHTSA] fetchComplaints failed:", e);
    return [];
  }
}

/**
 * Fetch NHTSA 5-star safety crash test ratings.
 * Returns overall rating plus individual crash test scores.
 * Returns null if no ratings exist for this model year.
 */
export async function fetchSafetyRatings(
  make: string,
  model: string,
  modelYear: string
): Promise<SafetyRating | null> {
  const key = `safety:${make}:${model}:${modelYear}`;
  const cached = getCached<SafetyRating | null>(key);
  if (cached !== null) return cached;

  try {
    const data = await nhtsaFetch(
      `https://api.nhtsa.gov/SafetyRatings/modelyear/${encodeURIComponent(modelYear)}/make/${encodeURIComponent(make)}/model/${encodeURIComponent(model)}`
    );
    const results = data.Results || [];
    if (results.length === 0) {
      setCache(key, null);
      return null;
    }
    // Pick the first result (most common variant)
    const r = results[0];
    const rating: SafetyRating = {
      overallRating: r.OverallRating || "Not Rated",
      frontCrash: r.OverallFrontCrashRating || "Not Rated",
      sideCrash: r.OverallSideCrashRating || "Not Rated",
      rollover: r.RolloverRating || "Not Rated",
      vehicleId: r.VehicleId || 0,
    };
    setCache(key, rating);
    return rating;
  } catch (e) {
    console.warn("[NHTSA] fetchSafetyRatings failed:", e);
    return null;
  }
}

/**
 * Generate a comprehensive vehicle history report by calling all three
 * NHTSA endpoints in parallel. This is a Carfax-like report built
 * entirely from real government data.
 */
export async function getVehicleHistoryReport(
  make: string,
  model: string,
  modelYear: string
): Promise<VehicleHistoryReport> {
  const [recalls, complaints, safetyRatings] = await Promise.all([
    fetchRecalls(make, model, modelYear),
    fetchComplaints(make, model, modelYear),
    fetchSafetyRatings(make, model, modelYear),
  ]);

  return {
    make,
    model,
    modelYear,
    recalls: { count: recalls.length, items: recalls },
    complaints: { count: complaints.length, items: complaints },
    safetyRatings,
    reportGeneratedAt: new Date().toISOString(),
    source: "NHTSA (National Highway Traffic Safety Administration)",
  };
}

/**
 * Decode a 17-character VIN using the NHTSA vPIC (Vehicle Product
 * Information Catalog) API. Returns structured vehicle specs including
 * make, model, year, engine, safety features, and plant information.
 */
export async function decodeVinNHTSA(vin: string): Promise<VinDecodeResult> {
  const key = `vin:${vin}`;
  const cached = getCached<VinDecodeResult>(key);
  if (cached) return cached;

  try {
    const data = await nhtsaFetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${encodeURIComponent(vin)}?format=json`
    );

    const results: Record<string, string> = {};
    for (const r of data.Results || []) {
      if (r.Value && r.Value.trim()) {
        results[r.Variable] = r.Value.trim();
      }
    }

    const decoded: VinDecodeResult = {
      make: results["Make"] || null,
      model: results["Model"] || null,
      year: results["Model Year"] || null,
      trim: results["Trim"] || null,
      bodyClass: results["Body Class"] || null,
      driveType: results["Drive Type"] || null,
      engineCylinders: results["Engine Number of Cylinders"] || null,
      engineDisplacement: results["Displacement (L)"] || null,
      engineHP: results["Engine Brake (hp) From"] || null,
      fuelType: results["Fuel Type - Primary"] || null,
      transmission: results["Transmission Style"] || null,
      gvwr: results["Gross Vehicle Weight Rating From"] || null,
      wheelBase: results["Wheel Base Type"] || null,
      plantCity: results["Plant City"] || null,
      plantState: results["Plant State"] || null,
      plantCountry: results["Plant Country"] || null,
      doors: results["Doors"] || null,
      seats: results["Number of Seats"] || null,
      seatRows: results["Number of Seat Rows"] || null,
      abs: results["Anti-lock Braking System (ABS)"] || null,
      esc: results["Electronic Stability Control (ESC)"] || null,
      backupCamera: results["Backup Camera"] || null,
      blindSpotWarning: results["Blind Spot Warning (BSW)"] || null,
      forwardCollisionWarning: results["Forward Collision Warning (FCW)"] || null,
      laneKeepAssist: results["Lane Keep System (LKS)"] || null,
      adaptiveCruise: results["Adaptive Cruise Control (ACC)"] || null,
      errorCode: results["Error Code"] || null,
      errorText: results["Error Text"] || null,
    };

    setCache(key, decoded);
    return decoded;
  } catch (e) {
    console.warn("[NHTSA] decodeVinNHTSA failed:", e);
    return {
      make: null, model: null, year: null, trim: null, bodyClass: null,
      driveType: null, engineCylinders: null, engineDisplacement: null,
      engineHP: null, fuelType: null, transmission: null, gvwr: null,
      wheelBase: null, plantCity: null, plantState: null, plantCountry: null,
      doors: null, seats: null, seatRows: null, abs: null, esc: null,
      backupCamera: null, blindSpotWarning: null, forwardCollisionWarning: null,
      laneKeepAssist: null, adaptiveCruise: null, errorCode: "FETCH_FAILED",
      errorText: String(e),
    };
  }
}
