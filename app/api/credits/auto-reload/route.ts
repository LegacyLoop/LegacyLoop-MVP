import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

const VALID_PACKS = ["pack_25", "pack_50", "pack_100", "pack_200"];

/**
 * GET /api/credits/auto-reload — returns current auto-reload settings
 * POST /api/credits/auto-reload — saves auto-reload settings
 *
 * CMD-CREDIT-AUTO-RELOAD
 */
export async function GET() {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uc = await prisma.userCredits.findUnique({
    where: { userId: user.id },
    select: { autoReloadEnabled: true, autoReloadThreshold: true, autoReloadPackId: true, autoReloadFailedAt: true },
  });

  return NextResponse.json({
    enabled: uc?.autoReloadEnabled ?? false,
    threshold: uc?.autoReloadThreshold ?? 20,
    packId: uc?.autoReloadPackId ?? "pack_25",
    failedAt: uc?.autoReloadFailedAt?.toISOString() ?? null,
  });
}

export async function POST(req: NextRequest) {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { enabled, threshold, packId } = await req.json();

    if (typeof enabled !== "boolean") {
      return NextResponse.json({ error: "enabled must be boolean" }, { status: 400 });
    }
    if (threshold !== undefined && (typeof threshold !== "number" || threshold < 10 || threshold > 200)) {
      return NextResponse.json({ error: "Threshold must be between 10 and 200" }, { status: 400 });
    }
    if (packId && !VALID_PACKS.includes(packId)) {
      return NextResponse.json({ error: "Invalid pack ID" }, { status: 400 });
    }

    // If enabling, require stripeCustomerId
    if (enabled) {
      const fullUser = await prisma.user.findUnique({ where: { id: user.id }, select: { stripeCustomerId: true } });
      if (!fullUser?.stripeCustomerId) {
        return NextResponse.json({ error: "Add a payment method first. Make a credit purchase to enable auto-reload." }, { status: 400 });
      }
    }

    await prisma.userCredits.upsert({
      where: { userId: user.id },
      update: {
        autoReloadEnabled: enabled,
        ...(threshold !== undefined ? { autoReloadThreshold: threshold } : {}),
        ...(packId ? { autoReloadPackId: packId } : {}),
        ...(enabled ? { autoReloadFailedAt: null } : {}), // Clear failed flag when re-enabling
      },
      create: {
        userId: user.id,
        balance: 0,
        lifetime: 0,
        spent: 0,
        autoReloadEnabled: enabled,
        autoReloadThreshold: threshold ?? 20,
        autoReloadPackId: packId ?? "pack_25",
      },
    });

    return NextResponse.json({
      success: true,
      enabled,
      threshold: threshold ?? 20,
      packId: packId ?? "pack_25",
    });
  } catch (err) {
    console.error("[credits/auto-reload] Error:", err);
    return NextResponse.json({ error: "Failed to save settings." }, { status: 500 });
  }
}
