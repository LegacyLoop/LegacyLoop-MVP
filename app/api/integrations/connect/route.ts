import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { platform, username } = await req.json();
  if (!platform) return new Response("platform required", { status: 400 });

  await prisma.connectedPlatform.upsert({
    where: { userId_platform: { userId: user.id, platform } },
    create: {
      userId: user.id,
      platform,
      platformUsername: username ?? null,
      isActive: true,
      lastSync: new Date(),
    },
    update: {
      platformUsername: username ?? null,
      isActive: true,
      lastSync: new Date(),
    },
  });

  return Response.json({ ok: true, platform });
}
