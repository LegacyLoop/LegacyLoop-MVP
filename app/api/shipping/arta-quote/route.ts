import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { getArtaQuote, buildArtaRequest, isArtaEligible } from "@/lib/shipping/arta";

/**
 * POST /api/shipping/arta-quote
 * Get white-glove shipping quotes from Arta for qualifying items.
 */
export async function POST(req: NextRequest) {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { item, fromZip, toZip } = body;

    if (!toZip) {
      return NextResponse.json({ error: "Destination zip required" }, { status: 400 });
    }

    if (!isArtaEligible(item || {})) {
      console.log(`[arta-quote] Item ${item?.id} not eligible for Arta`);
      return NextResponse.json({
        eligible: false,
        quotes: [],
        message: "Item does not meet Arta white-glove eligibility criteria",
      });
    }

    const artaReq = buildArtaRequest(
      item || {},
      { zip: fromZip || "04901" },
      { zip: toZip }
    );

    console.log(`[arta-quote] Requesting for item ${item?.id}:`,
      `$${artaReq.objects[0]?.value} value,`,
      `${artaReq.objects[0]?.weight}lbs,`,
      `${fromZip || "04901"} → ${toZip}`);

    const result = await getArtaQuote(artaReq);

    if (result.error) {
      console.error(`[arta-quote] Error: ${result.error}`);
      return NextResponse.json({
        eligible: true,
        quotes: [],
        error: result.error,
        requestId: result.requestId,
        source: "arta",
        isLive: false,
      });
    }

    const formattedQuotes = result.quotes.map(q => ({
      quote_type: q.quote_type,
      total: q.total,
      currency: q.total_currency || "USD",
      services: q.included_services || [],
      insurance: q.included_insurance_policy || null,
      is_estimated: q.is_estimated,
      detail: q.detail || null,
      source: "arta",
      isLive: true,
    }));

    console.log(`[arta-quote] Success: ${formattedQuotes.length} options`,
      formattedQuotes.map(q => `${q.quote_type}=$${q.total}`).join(", "));

    return NextResponse.json({
      eligible: true,
      quotes: formattedQuotes,
      requestId: result.requestId,
      hosted_session_url: result.hosted_session_url || null,
      source: "arta",
      isLive: true,
      artaMode: process.env.ARTA_MODE || "test",
    });
  } catch (err: unknown) {
    console.error("[arta-quote] Unhandled error:", (err as Error).message);
    return NextResponse.json(
      { error: "Failed to get Arta quote", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
