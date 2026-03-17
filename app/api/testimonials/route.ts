import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authAdapter } from "@/lib/adapters/auth";

/**
 * GET /api/testimonials
 * Return approved testimonials (newest first, limit 50). No auth required.
 */
export async function GET() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { isApproved: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json(testimonials);
  } catch (e) {
    console.error("[testimonials] GET error:", e);
    return NextResponse.json([], { status: 200 });
  }
}

/**
 * POST /api/testimonials
 * Create a new testimonial. Auth required.
 * Body: { rating, text, itemId?, itemTitle? }
 */
export async function POST(req: Request) {
  try {
    const user = await authAdapter.getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { rating, text, itemId, itemTitle } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Review text is required" }, { status: 400 });
    }

    const ratingNum = Math.max(1, Math.min(5, Number(rating) || 5));

    const testimonial = await prisma.testimonial.create({
      data: {
        userId: user.id,
        buyerName: user.email.split("@")[0],
        rating: ratingNum,
        text: text.trim(),
        itemId: itemId || null,
        itemTitle: itemTitle || null,
        isApproved: false, // needs admin approval
        isDemo: false,
      },
    });

    return NextResponse.json(testimonial, { status: 201 });
  } catch (e) {
    console.error("[testimonials] POST error:", e);
    return NextResponse.json({ error: "Failed to create testimonial" }, { status: 500 });
  }
}
