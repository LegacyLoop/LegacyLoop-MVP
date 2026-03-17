import { NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

function safeJson(s: string | null | undefined): Record<string, unknown> | null {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

export async function GET() {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const items = await prisma.item.findMany({
      where: { userId: user.id, status: { in: ["LISTED", "ANALYZED", "READY", "INTERESTED"] } },
      include: { aiResult: { select: { rawJson: true } }, photos: { take: 1 } },
    });

    // Group by AI-assigned category
    const groups: Record<string, { id: string; title: string; price: number; photo: string | null; condition: string | null }[]> = {};
    for (const item of items) {
      const ai = safeJson(item.aiResult?.rawJson ?? null);
      const category = (ai?.category as string) || "Other";
      if (!groups[category]) groups[category] = [];
      groups[category].push({
        id: item.id,
        title: item.title || (ai?.item_name as string) || "Untitled",
        price: item.listingPrice || 0,
        photo: item.photos?.[0]?.filePath || null,
        condition: item.condition,
      });
    }

    const suggestions = Object.entries(groups)
      .filter(([, catItems]) => catItems.length >= 2)
      .map(([category, catItems]) => {
        const individualTotal = catItems.reduce((s, i) => s + i.price, 0);
        const suggestedPrice = Math.round(individualTotal * 0.90);
        return {
          category,
          itemCount: catItems.length,
          itemIds: catItems.map(i => i.id),
          items: catItems,
          individualTotal: Math.round(individualTotal),
          suggestedPrice,
          discountPercent: 10,
        };
      })
      .sort((a, b) => b.individualTotal - a.individualTotal);

    return NextResponse.json({ suggestions });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 });
  }
}
