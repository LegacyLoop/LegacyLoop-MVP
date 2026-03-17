import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const alerts = await prisma.reconAlert.findMany({
    where: {
      reconBot: { userId: user.id },
      dismissed: false,
    },
    include: {
      reconBot: {
        include: { item: { select: { id: true, title: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  return NextResponse.json({ alerts });
}
