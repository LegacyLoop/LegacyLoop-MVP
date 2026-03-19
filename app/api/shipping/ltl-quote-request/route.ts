import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { sendEmail } from "@/lib/email/send";
import { ltlQuoteRequestEmail } from "@/lib/email/templates";

/**
 * POST /api/shipping/ltl-quote-request
 * Captures LTL freight quote request data and logs it.
 * Sends email to shipping@legacy-loop.com and logs to file as backup.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      itemId, originZip, destZip, weight,
      dimensions, freightClass, commodity, packaging,
      stackable, declaredValue, accessorials, instructions,
    } = body;

    if (!itemId || !destZip) {
      return NextResponse.json({ error: "itemId and destZip required" }, { status: 400 });
    }

    const quoteData = {
      timestamp: new Date().toISOString(),
      requestedBy: user.email,
      userId: user.id,
      itemId,
      originZip: originZip || "Not provided",
      destinationZip: destZip,
      weight: weight || "Not provided",
      dimensions: dimensions
        ? `${dimensions.length}×${dimensions.width}×${dimensions.height} in`
        : "Not provided",
      freightClass: freightClass === "auto" ? "Auto-calculate" : `Class ${freightClass}`,
      commodityType: commodity || "Not specified",
      packagingType: packaging || "Not specified",
      stackable: stackable ? "Yes" : "No",
      declaredValue: declaredValue ? `$${declaredValue}` : "Not declared",
      accessorials: {
        residential: accessorials?.residential ? "Yes" : "No",
        liftgate: accessorials?.liftgate ? "Yes" : "No",
        notifyBeforeDelivery: accessorials?.notifyBeforeDelivery ? "Yes" : "No",
        blanketWrap: accessorials?.blanketWrap ? "Yes" : "No",
        insideDelivery: accessorials?.insideDelivery ? "Yes" : "No",
        whiteGlove: accessorials?.whiteGlove ? "Yes" : "No",
      },
      specialInstructions: instructions || "None",
    };

    // Format for console + email
    const formatted = [
      "═══ LTL FREIGHT QUOTE REQUEST ═══",
      `Date: ${quoteData.timestamp}`,
      `Requested by: ${quoteData.requestedBy}`,
      `Item ID: ${quoteData.itemId}`,
      "",
      "── Shipment Details ──",
      `Origin ZIP: ${quoteData.originZip}`,
      `Destination ZIP: ${quoteData.destinationZip}`,
      `Weight: ${quoteData.weight} lbs`,
      `Dimensions: ${quoteData.dimensions}`,
      `Freight Class: ${quoteData.freightClass}`,
      `Commodity: ${quoteData.commodityType}`,
      `Packaging: ${quoteData.packagingType}`,
      `Stackable: ${quoteData.stackable}`,
      `Declared Value: ${quoteData.declaredValue}`,
      "",
      "── Accessorials ──",
      `Residential: ${quoteData.accessorials.residential}`,
      `Liftgate: ${quoteData.accessorials.liftgate}`,
      `Notify before delivery: ${quoteData.accessorials.notifyBeforeDelivery}`,
      `Blanket wrap: ${quoteData.accessorials.blanketWrap}`,
      `Inside delivery: ${quoteData.accessorials.insideDelivery}`,
      `White glove: ${quoteData.accessorials.whiteGlove}`,
      "",
      `Special Instructions: ${quoteData.specialInstructions}`,
      "═══════════════════════════════",
    ].join("\n");

    // Log to console
    console.log("\n📋 LTL FREIGHT QUOTE REQUEST → shipping@legacy-loop.com");
    console.log(formatted);

    // Save to temp file as backup
    try {
      const dir = join(tmpdir(), "ltl-quote-requests");
      await mkdir(dir, { recursive: true });
      const filename = `quote-${itemId}-${Date.now()}.json`;
      await writeFile(
        join(dir, filename),
        JSON.stringify({ ...quoteData, formattedEmail: formatted }, null, 2),
      );
      console.log(`📁 Quote saved to: ${join(dir, filename)}`);
    } catch (fileErr) {
      console.error("Failed to save quote file:", fileErr);
    }

    // Send quote request email to shipping team
    const quoteEmail = ltlQuoteRequestEmail(
      quoteData.requestedBy, quoteData.itemId,
      quoteData.originZip, quoteData.destinationZip,
      String(quoteData.weight), formatted
    );
    sendEmail({
      to: "shipping@legacy-loop.com",
      from: "shipping@legacy-loop.com",
      fromName: "LegacyLoop Shipping",
      ...quoteEmail,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Quote request submitted. Our freight team will respond within 24 hours.",
      referenceId: `LTL-${Date.now().toString(36).toUpperCase()}`,
    });
  } catch (e) {
    console.error("[shipping/ltl-quote-request] error:", e);
    return NextResponse.json({ error: "Failed to submit quote request" }, { status: 500 });
  }
}
