import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function safeJson(s: string | null): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

/** GET — Look up return request by token */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token || token.length < 32) return NextResponse.json({ error: "Invalid token" }, { status: 400 });

    // Find the refund_requested event with this token
    const logs = await prisma.eventLog.findMany({
      where: { eventType: "refund_requested" },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    let matchedLog: any = null;
    let matchedPayload: any = null;
    for (const log of logs) {
      const payload = safeJson(log.payload);
      if (payload?.returnToken === token) {
        matchedLog = log;
        matchedPayload = payload;
        break;
      }
    }

    if (!matchedLog) return NextResponse.json({ error: "Return request not found or expired" }, { status: 404 });

    // Get item details
    const item = await prisma.item.findUnique({
      where: { id: matchedLog.itemId },
      select: { id: true, title: true, status: true, soldAt: true, photos: { take: 1, select: { filePath: true } } },
    });

    // Check for response
    const responseLog = await prisma.eventLog.findFirst({
      where: { itemId: matchedLog.itemId, eventType: { in: ["refund_approved", "refund_denied"] }, createdAt: { gte: matchedLog.createdAt } },
      orderBy: { createdAt: "desc" },
    });
    const responsePayload = safeJson(responseLog?.payload ?? null);
    const status = responseLog?.eventType === "refund_approved" ? "APPROVED"
      : responseLog?.eventType === "refund_denied" ? "DENIED"
      : "PENDING";

    // Check 14-day return window
    const saleDate = item?.soldAt || matchedLog.createdAt;
    const daysSinceSale = Math.round((Date.now() - new Date(saleDate).getTime()) / 86400000);
    const windowOpen = daysSinceSale <= 14;

    return NextResponse.json({
      ok: true,
      itemId: matchedLog.itemId,
      itemTitle: item?.title || "Unknown Item",
      itemPhoto: item?.photos?.[0]?.filePath || null,
      reason: matchedPayload.reason,
      description: matchedPayload.description,
      refundAmount: matchedPayload.refundAmount,
      processingFee: matchedPayload.processingFee,
      saleAmount: matchedPayload.saleAmount,
      status,
      denyReason: responsePayload?.reason || null,
      daysSinceSale,
      windowOpen,
      requestedAt: matchedPayload.requestedAt || matchedLog.createdAt,
    });
  } catch (e) {
    console.error("[returns GET]", e);
    return NextResponse.json({ error: "Failed to fetch return details" }, { status: 500 });
  }
}
