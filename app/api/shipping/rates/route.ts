import { authAdapter } from "@/lib/adapters/auth";
import { getShippingRates } from "@/lib/shipping/shippo";
import { getFedExParcelRates } from "@/lib/shipping/fedex-parcel";
import { getEasyPostRates } from "@/lib/shipping/easypost";

export async function POST(req: Request) {
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { fromZip, toZip, weight = 2, length = 12, width = 10, height = 6, category } = body;

  if (!fromZip || !toZip) {
    return new Response("Missing fromZip or toZip", { status: 400 });
  }

  // Skip parcel rates for local-only categories
  if (category) {
    const LOCAL_ONLY = ["vehicle", "boat", "motorcycle", "atv", "mower",
      "tractor", "trailer", "rv", "hot tub", "piano", "pool table",
      "riding mower", "lawn mower", "snowmobile", "jet ski",
      "go-kart", "snowblower", "camper", "kayak", "canoe"];
    const catLower = String(category).toLowerCase();
    if (LOCAL_ONLY.some((term: string) => catLower.includes(term))) {
      console.log(`[shipping-rates] Skipping parcel rates for local-only category: ${category}`);
      return Response.json({
        rates: [],
        localOnly: true,
        message: "This item is recommended for local pickup only. Too large or heavy for parcel carriers.",
        category,
      });
    }
  }

  // Run Shippo + FedEx Parcel + EasyPost in parallel
  const [shippoResult, fedexRates, easypostRates] = await Promise.all([
    getShippingRates(
      { zip: String(fromZip) },
      { zip: String(toZip) },
      { length: Number(length), width: Number(width), height: Number(height), weight: Number(weight) },
    ).catch(() => ({ rates: [] as any[], isDemo: true })),
    getFedExParcelRates(
      String(fromZip), String(toZip),
      Number(weight), Number(length), Number(width), Number(height),
    ).catch(() => []),
    getEasyPostRates(
      String(fromZip), String(toZip),
      Number(weight), Number(length), Number(width), Number(height),
    ).catch(() => []),
  ]);

  // Merge rates — Shippo + FedEx direct + EasyPost backup
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
    ...easypostRates.map((r) => ({
      provider: r.carrier,
      servicelevel_name: r.service,
      amount: String(r.rate),
      estimated_days: r.estimatedDays,
      currency: r.currency,
      source: "easypost",
      isLive: r.isLive,
    })),
  ];

  // Normalize service names across providers for clean dedupe
  const normalizeService = (svc: string): string => {
    const s = (svc || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    // Map EasyPost/FedEx service variants to canonical names
    const MAP: Record<string, string> = {
      fedexground: "ground",
      fedex_ground: "ground",
      ground: "ground",
      homedelivery: "homedelivery",
      fedexhomedelivery: "homedelivery",
      fedex2day: "2day",
      "2day": "2day",
      fedexexpresssaver: "expresssaver",
      expresssaver: "expresssaver",
      fedexstandardovernight: "standardovernight",
      standardovernight: "standardovernight",
      fedexpriority: "priority",
      priorityovernight: "priorityovernight",
      fedexfirstovernight: "firstovernight",
      firstovernight: "firstovernight",
      smartpost: "smartpost",
      fedex_smart_post: "smartpost",
      upsground: "ground",
      upssaver: "saver",
      upsgroundsaver: "groundsaver",
      ups3dayselect: "3dayselect",
      "3dayselect": "3dayselect",
      ups2nddayair: "2nddayair",
      "2nddayair": "2nddayair",
      upsnextdayair: "nextdayair",
      nextdayair: "nextdayair",
      upsnextdayairsaver: "nextdayairsaver",
      nextdayairsaver: "nextdayairsaver",
      upsnextdayairearly: "nextdayairearly",
      upsnextdayairearlyam: "nextdayairearlyam",
      nextdayairearlyam: "nextdayairearlyam",
      parcelselect: "parcelselect",
      groundadvantage: "groundadvantage",
      priority: "priority",
      prioritymail: "priority",
      express: "express",
      prioritymailexpress: "express",
      firstclass: "firstclass",
      first: "firstclass",
    };
    return MAP[s] || s;
  };

  // Dedupe — prefer FedEx direct over Shippo's FedEx rates, keep cheapest per carrier+service
  const seen = new Map<string, any>();
  for (const r of allRates) {
    const carrier = (r.provider || r.carrier || "").toLowerCase();
    const service = normalizeService(r.servicelevel_name || r.service || "");
    const key = `${carrier}_${service}`;
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

  console.log(`[shipping/rates] ${deduped.length} rates → UI: Shippo(${shippoResult.rates.length}) + FedEx-direct(${fedexRates.length}) + EasyPost(${easypostRates.length}) → deduped(${deduped.length})`);

  return Response.json({
    rates: deduped,
    isDemo: shippoResult.isDemo && fedexRates.length === 0 && easypostRates.length === 0,
    isMock: shippoResult.isDemo && fedexRates.length === 0 && easypostRates.length === 0,
    rateSource: [
      shippoResult.isDemo ? "demo" : "shippo",
      fedexRates.length > 0 ? "fedex" : null,
      easypostRates.length > 0 ? "easypost" : null,
    ].filter(Boolean).join("+"),
    fedexLive: fedexRates.length > 0,
    easypostLive: easypostRates.length > 0,
  });
}
