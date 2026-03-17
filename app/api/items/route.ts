import { NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const items = await prisma.item.findMany({
      where: { userId: user.id },
      include: {
        photos: { take: 1, orderBy: { order: "asc" } },
        aiResult: { select: { rawJson: true } },
        valuation: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const result = items.map((item) => {
      let ai: any = null;
      try { ai = item.aiResult?.rawJson ? JSON.parse(item.aiResult.rawJson) : null; } catch {}
      return {
        id: item.id,
        title: item.title || ai?.item_name || `Item #${item.id.slice(0, 8)}`,
        description: item.description,
        condition: item.condition || ai?.condition_guess,
        category: ai?.category || null,
        status: item.status,
        listingPrice: item.listingPrice,
        price: item.listingPrice || (item.valuation ? Math.round((item.valuation.low + item.valuation.high) / 2) : 0),
        photo: (item.photos[0] as any)?.filePath || null,
        createdAt: item.createdAt,
      };
    });

    return NextResponse.json({ items: result });
  } catch (err: any) {
    console.error("[GET /api/items]", err);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}
