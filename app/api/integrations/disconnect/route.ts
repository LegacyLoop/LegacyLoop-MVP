import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { platform } = await req.json();
  if (!platform) return new Response("platform required", { status: 400 });

  await prisma.connectedPlatform.updateMany({
    where: { userId: user.id, platform },
    data: { isActive: false },
  });

  return Response.json({ ok: true });
}
