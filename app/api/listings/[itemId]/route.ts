import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { itemId } = await params;
    const records = await prisma.listingPublish.findMany({
      where: { itemId, userId: user.id },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ platforms: records });
  } catch (err: any) {
    console.error("[listings GET]", err);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}
