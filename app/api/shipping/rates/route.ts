import { authAdapter } from "@/lib/adapters/auth";
import { getShippingRates } from "@/lib/shipping/shippo";
import { getFedExParcelRates } from "@/lib/shipping/fedex-parcel";

export async function POST(req: Request) {
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { fromZip, toZip, weight = 2, length = 12, width = 10, height = 6 } = body;

  if (!fromZip || !toZip) {
    return new Response("Missing fromZip or toZip", { status: 400 });
  }

  // Run Shippo + FedEx Parcel in parallel
  const [shippoResult, fedexRates] = await Promise.all([
    getShippingRates(
      { zip: String(fromZip) },
      { zip: String(toZip) },
      { length: Number(length), width: Number(width), height: Number(height), weight: Number(weight) },
    ).catch(() => ({ rates: [] as any[], isDemo: true })),
    getFedExParcelRates(
      String(fromZip), String(toZip),
      Number(weight), Number(length), Number(width), Number(height),
    ).catch(() => []),
  ]);

  // Merge rates — Shippo + FedEx direct
  const allRates = [
    ...shippoResult.rates.map((r: any) => ({
      ...r,
      source: shippoResult.isDemo ? "demo" : "shippo",
    })),
    ...fedexRates.map((r) => ({
      provider: r.carrier,
      servicelevel_name: r.service,
      amount: String(r.rate),
      estimated_days: r.estimatedDays,
      currency: r.currency,
      source: "fedex",
      isLive: r.isLive,
    })),
  ];

  // Dedupe — prefer FedEx direct over Shippo's FedEx rates, keep cheapest per carrier+service
  const seen = new Map<string, any>();
  for (const r of allRates) {
    const key = `${(r.provider || r.carrier || "").toLowerCase()}_${(r.servicelevel_name || r.service || "").toLowerCase()}`;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, r);
    } else {
      const existingPrice = parseFloat(existing.amount || existing.rate || "0");
      const newPrice = parseFloat(r.amount || r.rate || "0");
      if (r.source === "fedex" && existing.source !== "fedex") {
        // Prefer FedEx direct over Shippo's FedEx rates
        seen.set(key, r);
      } else if (r.source === existing.source && newPrice < existingPrice && newPrice > 0) {
        // Same source — keep cheaper rate
        seen.set(key, r);
      }
    }
  }

  const deduped = Array.from(seen.values());

  return Response.json({
    rates: deduped,
    isDemo: shippoResult.isDemo && fedexRates.length === 0,
    isMock: shippoResult.isDemo && fedexRates.length === 0,
    rateSource: fedexRates.length > 0 ? "shippo+fedex" : shippoResult.isDemo ? "demo" : "shippo",
    fedexLive: fedexRates.length > 0,
  });
}
