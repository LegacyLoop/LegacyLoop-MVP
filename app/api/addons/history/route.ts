import { NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const purchases = await prisma.userAddon.findMany({
      where: { userId: user.id },
      include: { addon: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ purchases });
  } catch (err: any) {
    console.error("[addons/history]", err);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
