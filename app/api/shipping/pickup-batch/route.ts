import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

/** POST /api/shipping/pickup-batch — batch fetch pickup statuses for multiple items */
export async function POST(req: NextRequest) {
  try {
    const user = await authAdapter.getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemIds } = (await req.json()) as { itemIds: string[] };
    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid itemIds array" },
        { status: 400 },
      );
    }

    const safeJson = (s: string | null) => {
      if (!s) return null;
      try {
        return JSON.parse(s);
      } catch {
        return s;
      }
    };

    // Fetch all items in a single query
    const items = await prisma.item.findMany({
      where: {
        id: { in: itemIds },
        userId: user.id,
      },
      select: {
        id: true,
        pickupStatus: true,
        pickupConfirmedAt: true,
        pickupCompletedAt: true,
        pickupInviteSentAt: true,
        pickupScheduledAt: true,
        pickupLocation: true,
        pickupNotes: true,
        pickupTimeSlots: true,
        pickupBuyerTimeSlot: true,
        pickupBuyerMessage: true,
        pickupContactMethod: true,
        pickupPaymentMethod: true,
        pickupHandoffCode: true,
        pickupConfirmedBy: true,
        pickupRadius: true,
        saleZip: true,
        listingPrice: true,
      },
    });

    // Build response map
    const statuses: Record<string, any> = {};
    for (const item of items) {
      statuses[item.id] = {
        itemId: item.id,
        status: item.pickupStatus,
        confirmedAt: item.pickupConfirmedAt?.toISOString() ?? null,
        completedAt: item.pickupCompletedAt?.toISOString() ?? null,
        inviteSentAt: item.pickupInviteSentAt?.toISOString() ?? null,
        scheduledAt: item.pickupScheduledAt?.toISOString() ?? null,
        location: safeJson(item.pickupLocation),
        notes: item.pickupNotes,
        timeSlots: safeJson(item.pickupTimeSlots),
        buyerTimeSlot: item.pickupBuyerTimeSlot,
        buyerMessage: item.pickupBuyerMessage,
        contactMethod: item.pickupContactMethod,
        paymentMethod: item.pickupPaymentMethod,
        handoffCode: item.pickupHandoffCode,
        confirmedBy: item.pickupConfirmedBy,
        radius: item.pickupRadius,
        saleZip: item.saleZip,
        price: (item as any).listingPrice ?? null,
      };
    }

    console.log(
      `[pickup-batch] Returned ${items.length} statuses for ${itemIds.length} requested items`,
    );

    return NextResponse.json({
      statuses,
      count: items.length,
    });
  } catch (error) {
    console.error("[pickup-batch] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
