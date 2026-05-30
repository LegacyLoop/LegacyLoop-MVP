import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

/**
 * Connect / refresh a platform integration for the current user.
 *
 * Backward-compatible: existing callers send { platform, username }.
 * App-Platform (W25-META-L3): FB/IG callers may additionally send a `settings`
 * object (e.g. selected Page id + page access token + page metadata), which is
 * merged into ConnectedPlatform.settingsJson without clobbering prior keys.
 */
export async function POST(req: NextRequest) {
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { platform, username, settings } = await req.json();
  if (!platform) return new Response("platform required", { status: 400 });

  // Merge incoming settings into the existing settingsJson (additive · never clobber).
  let settingsJson: string | undefined;
  if (settings && typeof settings === "object") {
    const existing = await prisma.connectedPlatform.findUnique({
      where: { userId_platform: { userId: user.id, platform } },
      select: { settingsJson: true },
    });
    let base: Record<string, unknown> = {};
    if (existing?.settingsJson) {
      try {
        const parsed = JSON.parse(existing.settingsJson);
        if (parsed && typeof parsed === "object") base = parsed as Record<string, unknown>;
      } catch {
        // Corrupt prior settings — start clean rather than fail the connect.
        base = {};
      }
    }
    settingsJson = JSON.stringify({ ...base, ...(settings as Record<string, unknown>) });
  }

  await prisma.connectedPlatform.upsert({
    where: { userId_platform: { userId: user.id, platform } },
    create: {
      userId: user.id,
      platform,
      platformUsername: username ?? null,
      isActive: true,
      lastSync: new Date(),
      ...(settingsJson !== undefined ? { settingsJson } : {}),
    },
    update: {
      platformUsername: username ?? null,
      isActive: true,
      lastSync: new Date(),
      ...(settingsJson !== undefined ? { settingsJson } : {}),
    },
  });

  return Response.json({ ok: true, platform });
}
