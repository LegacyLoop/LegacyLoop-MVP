import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { verifyAddress, isEasyPostConfigured } from "@/lib/shipping/easypost";

/**
 * POST /api/shipping/verify-address
 *
 * Verify a shipping address using EasyPost.
 * Returns verification status, residential flag, and corrected fields.
 *
 * Body: { street1, city, state, zip, street2?, country? }
 *
 * Used by:
 *   - ShippingPanel buyer address form (future frontend integration)
 *   - Shipping Center wizard (future frontend integration)
 *   - Label creation flow (validate before purchasing label)
 */
export async function POST(req: NextRequest) {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isEasyPostConfigured()) {
    return NextResponse.json({
      verified: false,
      residential: null,
      message: "Address verification not configured",
      configured: false,
    });
  }

  const body = await req.json().catch(() => ({}));
  const { street1, city, state, zip, street2, country } = body;

  if (!zip) {
    return NextResponse.json({ error: "zip is required" }, { status: 400 });
  }

  const result = await verifyAddress(
    street1 || "",
    city || "",
    state || "",
    zip,
    street2 || "",
    country || "US"
  );

  return NextResponse.json({
    verified: result.verified,
    residential: result.residential,
    correctedZip: result.correctedZip,
    correctedCity: result.correctedCity,
    correctedState: result.correctedState,
    correctedStreet: result.correctedStreet,
    message: result.message,
    configured: true,
  });
}
