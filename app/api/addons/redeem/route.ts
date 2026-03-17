import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { ADDONS, isDemoMode } from "@/lib/constants/pricing";
import { checkCredits, deductCredits } from "@/lib/credits";

export async function POST(req: NextRequest) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { addonId, itemId } = await req.json();
    const addon = ADDONS.find((a) => a.id === addonId);
    if (!addon) return NextResponse.json({ error: "Add-on not found" }, { status: 404 });

    if (!isDemoMode()) {
      const cc = await checkCredits(user.id, addon.credits);
      if (!cc.hasEnough) {
        return NextResponse.json({
          error: "insufficient_credits",
          message: `Not enough credits to redeem ${addon.name}.`,
          balance: cc.balance,
          required: addon.credits,
          buyUrl: "/credits",
        }, { status: 402 });
      }
      await deductCredits(user.id, addon.credits, `Add-on: ${addon.name}`, itemId ?? undefined);
    }

    // Duplicate purchase check
    const existing = await prisma.userAddon.findFirst({
      where: { userId: user.id, addonId: addon.id, ...(itemId ? { itemId } : {}) },
    });
    if (existing) {
      return NextResponse.json({ error: "You already have this add-on" + (itemId ? " for this item" : "") }, { status: 400 });
    }

    const userAddon = await prisma.userAddon.create({
      data: {
        userId: user.id,
        addonId: addon.id,
        itemId: itemId ?? null,
        status: "PENDING",
        creditsCost: addon.credits,
        redeemedAt: new Date(),
      },
    });

    // EventLog requires itemId — only create when an item is associated
    if (itemId) {
      await prisma.eventLog.create({
        data: {
          itemId,
          eventType: "ADDON_PURCHASE",
          payload: JSON.stringify({ addonId: addon.id, addonName: addon.name, credits: addon.credits, purchaseId: userAddon.id }),
        },
      });
    }

    // Job queue trigger for AI add-ons
    const AI_ADDONS = ["ai_listing_optimizer", "buyer_outreach_blast", "ai_market_report"];
    if (itemId && AI_ADDONS.includes(addon.id)) {
      await prisma.eventLog.create({
        data: {
          itemId,
          eventType: "ADDON_JOB_QUEUED",
          payload: JSON.stringify({ addonId: addon.id, addonName: addon.name, userId: user.id, status: "PENDING" }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      addon,
      purchaseId: userAddon.id,
      message: "Add-on redeemed. Our team will follow up within 24 hours.",
    });
  } catch (err: any) {
    console.error("[addons/redeem]", err);
    return NextResponse.json({ error: "Failed to redeem add-on" }, { status: 500 });
  }
}
