import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";

/** POST /api/shipping/freight — request LTL freight quote or schedule pickup */
export async function POST(req: NextRequest) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    if (action === "quote") {
      const { weight, length, width, height, fromZip, toZip } = body;
      if (!weight || !fromZip || !toZip) {
        return NextResponse.json({ error: "weight, fromZip, toZip required" }, { status: 400 });
      }

      const w = Number(weight);
      const cubicFt = (Number(length || 48) * Number(width || 40) * Number(height || 36)) / 1728;
      const density = w / cubicFt;

      // Estimate freight class from density
      let freightClass = 70;
      if (density < 1) freightClass = 400;
      else if (density < 2) freightClass = 300;
      else if (density < 4) freightClass = 175;
      else if (density < 6) freightClass = 125;
      else if (density < 8) freightClass = 100;
      else if (density < 10) freightClass = 92.5;
      else if (density < 12) freightClass = 85;
      else if (density < 15) freightClass = 77.5;

      // Estimate cost based on weight + distance
      const distanceFactor = Math.abs(parseInt(fromZip.slice(0, 3)) - parseInt(toZip.slice(0, 3))) * 0.15 + 1;
      const baseCost = 75 + w * 0.45 * distanceFactor;

      const carriers = [
        { carrier: "XPO Logistics", service: "LTL Standard", price: Math.round(baseCost * 100) / 100, transit: "5-7 business days", guaranteed: false },
        { carrier: "Estes Express", service: "LTL Economy", price: Math.round(baseCost * 0.92 * 100) / 100, transit: "7-10 business days", guaranteed: false },
        { carrier: "Old Dominion", service: "LTL Priority", price: Math.round(baseCost * 1.15 * 100) / 100, transit: "3-5 business days", guaranteed: true },
      ];

      return NextResponse.json({
        freightClass,
        density: Math.round(density * 10) / 10,
        cubicFeet: Math.round(cubicFt * 10) / 10,
        carriers,
        requirements: {
          liftgate: w > 100,
          insideDelivery: false,
          appointmentRequired: false,
        },
      });
    }

    if (action === "schedule") {
      const { carrier, pickupDate, itemId } = body;
      if (!carrier || !pickupDate) {
        return NextResponse.json({ error: "carrier, pickupDate required" }, { status: 400 });
      }

      // Demo mode: return mock confirmation
      const confirmationNumber = `FRT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      return NextResponse.json({
        confirmed: true,
        confirmationNumber,
        carrier,
        pickupDate,
        pickupWindow: "8:00 AM - 5:00 PM",
        estimatedDelivery: new Date(new Date(pickupDate).getTime() + 7 * 86400000).toISOString().slice(0, 10),
        instructions: "Item must be palletized or crated. Driver will call 30 minutes before arrival.",
      });
    }

    return NextResponse.json({ error: "Invalid action. Use 'quote' or 'schedule'" }, { status: 400 });
  } catch (e) {
    console.error("[shipping/freight] error:", e);
    return NextResponse.json({ error: "Failed to process freight request" }, { status: 500 });
  }
}
