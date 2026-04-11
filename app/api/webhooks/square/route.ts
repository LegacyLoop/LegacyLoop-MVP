import { NextResponse } from "next/server";

/**
 * DEPRECATED — Square webhooks removed. Stripe webhook at /api/webhooks/stripe.
 * This handler returns 410 Gone for any remaining Square webhook deliveries.
 */
export async function POST() {
  return NextResponse.json({ error: "Square webhooks deprecated. Use Stripe." }, { status: 410 });
}
