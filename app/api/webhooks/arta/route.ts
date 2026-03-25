import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/webhooks/arta
 * Receives webhook events from Arta.
 *
 * Events: quote.ready, shipment.created, shipment.collected,
 *         shipment.in_transit, shipment.delivered, shipment.exception
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body?.event_type || body?.type || "unknown";
    const resourceId = body?.resource?.id || body?.data?.id || "unknown";

    console.log(`[arta-webhook] Event: ${event}`, JSON.stringify({
      resource_id: resourceId,
      status: body?.resource?.status || body?.data?.status,
      timestamp: new Date().toISOString(),
    }));

    switch (event) {
      case "quote.ready":
        console.log(`[arta-webhook] Quote ready: ${resourceId}`);
        break;
      case "shipment.created":
        console.log(`[arta-webhook] Shipment created: ${resourceId}`);
        break;
      case "shipment.collected":
        console.log(`[arta-webhook] Shipment collected: ${resourceId}`);
        break;
      case "shipment.in_transit":
        console.log(`[arta-webhook] Shipment in transit: ${resourceId}`);
        break;
      case "shipment.delivered":
        console.log(`[arta-webhook] Shipment delivered: ${resourceId}`);
        break;
      case "shipment.exception":
        console.error(`[arta-webhook] Shipment exception: ${resourceId}`, body);
        break;
      default:
        console.log(`[arta-webhook] Unhandled event: ${event}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error("[arta-webhook] Parse error:", (err as Error).message);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
