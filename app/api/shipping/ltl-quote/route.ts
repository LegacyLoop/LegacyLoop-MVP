import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { getShipEngineRateEstimate } from "@/lib/shipping/shipengine-ltl";
import { getFedExLTLQuote } from "@/lib/shipping/fedex-ltl";
import { getFreightQuoteMidpoints } from "@/lib/shipping/freight-estimates";

/**
 * POST /api/shipping/ltl-quote
 * Get LTL freight quotes from multiple sources:
 * 1. ShipEngine (live carriers when connected)
 * 2. FedEx Freight (real API, sandbox mode)
 * 3. Freight estimate engine (all 6 carriers, calculated estimates)
 *
 * Live quotes take priority per carrier. Estimates fill gaps.
 */
export async function POST(req: NextRequest) {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { fromZip, toZip, weight, length, width, height, freightClass, description, packaging } = body;

  if (!toZip) {
    return NextResponse.json({ error: "toZip required" }, { status: 400 });
  }

  const allQuotes: any[] = [];
  let hasLive = false;

  // 1. Try ShipEngine
  try {
    const seQuotes = await getShipEngineRateEstimate({
      ship_from: {
        company_name: "LegacyLoop Seller",
        address_line1: "123 Main St",
        city_locality: "Portland",
        state_province: "ME",
        postal_code: fromZip || "04901",
      },
      ship_to: {
        company_name: "Buyer",
        address_line1: "456 Destination St",
        city_locality: "Destination",
        state_province: "NY",
        postal_code: toZip,
      },
      packages: [{
        weight: { value: Number(weight) || 100, unit: "pound" },
        dimensions: {
          length: Number(length) || 48,
          width: Number(width) || 40,
          height: Number(height) || 36,
          unit: "inch",
        },
        freight_class: freightClass || "70",
        description: description || "Household goods",
      }],
    });
    for (const q of seQuotes) {
      allQuotes.push({ ...q, source: "shipengine" });
      if (q.isLive) hasLive = true;
    }
  } catch (e) {
    console.error("[ltl-quote] ShipEngine error:", e);
  }

  // 2. Try FedEx LTL
  try {
    const fedexQuote = await getFedExLTLQuote({
      shipper: {
        streetLines: ["123 Main St"],
        city: "Portland",
        stateOrProvinceCode: "ME",
        postalCode: fromZip || "04901",
        countryCode: "US",
      },
      recipient: {
        streetLines: ["456 Destination St"],
        city: "Destination",
        stateOrProvinceCode: "NY",
        postalCode: toZip,
        countryCode: "US",
      },
      commodities: [{
        description: description || "Household goods",
        weight: { units: "LB", value: Number(weight) || 100 },
        dimensions: { length: Number(length) || 48, width: Number(width) || 40, height: Number(height) || 36, units: "IN" },
        freightClass: freightClass || "70",
        pieces: 1,
        packaging: "PALLET",
      }],
    });
    if (fedexQuote) {
      allQuotes.push({
        quote_id: fedexQuote.quoteId,
        carrier: fedexQuote.carrier,
        service: fedexQuote.service,
        total_amount: fedexQuote.totalCharge,
        currency: fedexQuote.currency,
        transit_days: fedexQuote.transitDays,
        valid_until: new Date(Date.now() + 86400000 * 7).toISOString(),
        charges: fedexQuote.surcharges.length > 0 ? fedexQuote.surcharges : [{ description: "Freight", amount: fedexQuote.totalCharge }],
        isLive: fedexQuote.isLive,
        source: "fedex",
      });
      hasLive = true;
    }
  } catch (e) {
    console.error("[ltl-quote] FedEx error:", e);
  }

  // 3. Supplement with freight estimate engine (all 6 carriers incl FedEx Freight)
  const estimateQuotes = getFreightQuoteMidpoints({
    weight: Number(weight) || 100,
    lengthIn: Number(length) || 48,
    widthIn: Number(width) || 40,
    heightIn: Number(height) || 36,
    fromZip: fromZip || "04901",
    toZip: toZip,
    residential: false,
    liftgate: false,
  });

  // Merge: live quotes take priority over estimates for same carrier
  const liveCarriers = new Set(allQuotes.map(q => (q.carrier || "").toLowerCase()));
  for (const eq of estimateQuotes) {
    if (!liveCarriers.has(eq.carrier.toLowerCase())) {
      allQuotes.push({
        quote_id: `est-${eq.carrier.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
        carrier: eq.carrier,
        service: eq.service,
        total_amount: eq.total_amount,
        currency: "USD",
        transit_days: eq.transit_days,
        valid_until: new Date(Date.now() + 86400000 * 7).toISOString(),
        charges: [
          { description: "Freight", amount: eq.total_amount },
          ...(eq.accessorials.residential > 0 ? [{ description: "Residential Surcharge", amount: eq.accessorials.residential }] : []),
          ...(eq.accessorials.liftgate > 0 ? [{ description: "Liftgate Surcharge", amount: eq.accessorials.liftgate }] : []),
        ],
        isLive: false,
        source: "estimate",
      });
    }
  }

  console.log(`[ltl-quote] Returning ${allQuotes.length} quotes: ${allQuotes.filter(q => q.isLive).length} live, ${allQuotes.filter(q => !q.isLive).length} estimated`);

  return NextResponse.json({
    quotes: allQuotes.sort((a, b) => (a.total_amount || 0) - (b.total_amount || 0)),
    source: hasLive ? "live" : "estimated",
    isLive: hasLive,
    liveCount: allQuotes.filter(q => q.isLive).length,
    estimatedCount: allQuotes.filter(q => !q.isLive).length,
  });
}
