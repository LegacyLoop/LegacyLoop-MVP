import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { itemId, platform, status, listingTitle, listingPrice, postUrl } = await req.json();
    if (!itemId || !platform || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await prisma.listingPublish.findFirst({
      where: { itemId, platform, userId: user.id },
    });

    const data: any = {
      status,
      listingTitle: listingTitle ?? undefined,
      listingPrice: listingPrice ?? undefined,
      postUrl: postUrl ?? undefined,
    };
    if (status === "COPIED") data.copiedAt = new Date();
    if (status === "POSTED" || status === "LIVE") data.postedAt = new Date();

    let record;
    if (existing) {
      record = await prisma.listingPublish.update({
        where: { id: existing.id },
        data,
      });
    } else {
      record = await prisma.listingPublish.create({
        data: { itemId, userId: user.id, platform, ...data },
      });
    }

    // Log event
    const eventType = status === "COPIED" ? "LISTING_COPIED" : status === "POSTED" ? "LISTING_POSTED" : "LISTING_STATUS_UPDATE";
    await prisma.eventLog.create({
      data: {
        itemId,
        eventType,
        payload: JSON.stringify({ platform, status, listingTitle }),
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (err: any) {
    console.error("[listings save]", err);
    return NextResponse.json({ error: "Failed to save listing status" }, { status: 500 });
  }
}
