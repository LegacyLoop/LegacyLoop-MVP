import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { isDemoMode } from "@/lib/constants/pricing";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { itemId } = await params;

    const item = await prisma.item.findUnique({ where: { id: itemId }, select: { userId: true } });
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (item.userId !== user.id && !isDemoMode()) return NextResponse.json({ error: "Not your item" }, { status: 403 });

    const proposals = await prisma.eventLog.findMany({
      where: { itemId, eventType: "TRADE_PROPOSED" },
      orderBy: { createdAt: "desc" },
    });

    const responses = await prisma.eventLog.findMany({
      where: { itemId, eventType: "TRADE_RESPONDED" },
    });

    const responseMap: Record<string, any> = {};
    for (const r of responses) {
      const data = JSON.parse(r.payload || "{}");
      if (data.tradeId) responseMap[data.tradeId] = data;
    }

    const result = proposals.map((p) => {
      const data = JSON.parse(p.payload || "{}");
      const response = responseMap[p.id];
      return {
        id: p.id,
        ...data,
        status: response?.action || data.status || "PENDING",
        sellerResponse: response || null,
        createdAt: p.createdAt,
      };
    });

    return NextResponse.json({ proposals: result });
  } catch (err: any) {
    console.error("[trades GET]", err);
    return NextResponse.json({ error: "Failed to fetch trade proposals" }, { status: 500 });
  }
}
