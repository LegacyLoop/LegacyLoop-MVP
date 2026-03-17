import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

type Params = Promise<{ itemId: string }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { itemId } = await params;
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bot = await prisma.reconBot.findFirst({
    where: { itemId, userId: user.id },
    include: {
      alerts: {
        where: { dismissed: false },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ bot: bot ?? null });
}
