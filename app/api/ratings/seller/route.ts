import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

/**
 * POST /api/ratings/seller
 * Submit seller experience rating after sale completion.
 * Stores to EventLog as SELLER_RATING.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await authAdapter.getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { itemId, rating, comment } = body;

    if (!itemId || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "itemId and rating (1-5) are required" },
        { status: 400 }
      );
    }

    // Verify item belongs to user
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { userId: true },
    });
    if (!item || item.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check for existing rating
    const existing = await prisma.eventLog.findFirst({
      where: { itemId, eventType: "SELLER_RATING" },
    });
    if (existing) {
      return NextResponse.json({ error: "Rating already submitted" }, { status: 409 });
    }

    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "SELLER_RATING",
        payload: JSON.stringify({
          rating,
          comment: comment || null,
          userId: user.id,
          submittedAt: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("[ratings/seller]", e);
    return NextResponse.json({ error: "Failed to submit rating" }, { status: 500 });
  }
}
