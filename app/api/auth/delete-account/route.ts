import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { confirmEmail } = body;

  if (!confirmEmail || confirmEmail.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json({ error: "Email confirmation does not match." }, { status: 400 });
  }

  console.log(`[ACCOUNT DELETION] Initiated at ${new Date().toISOString()} for userId=${user.id} email=${user.email}`);

  try {
    // Get user's items for nested deletions
    const userItems = await prisma.item.findMany({ where: { userId: user.id }, select: { id: true } });
    const itemIds = userItems.map((i) => i.id);

    // 1. Delete nested item relations
    if (itemIds.length > 0) {
      await prisma.offerEvent.deleteMany({ where: { offer: { itemId: { in: itemIds } } } });
      await prisma.offer.deleteMany({ where: { itemId: { in: itemIds } } });
      await prisma.listingPublish.deleteMany({ where: { itemId: { in: itemIds } } });
      await prisma.priceSnapshot.deleteMany({ where: { itemId: { in: itemIds } } });
      await prisma.itemDocument.deleteMany({ where: { itemId: { in: itemIds } } });
      await prisma.message.deleteMany({ where: { conversation: { itemId: { in: itemIds } } } });
      await prisma.conversation.deleteMany({ where: { itemId: { in: itemIds } } });
      await prisma.buyerLead.deleteMany({ where: { itemId: { in: itemIds } } });
      await prisma.buyerBot.deleteMany({ where: { itemId: { in: itemIds } } });
      await prisma.reconAlert.deleteMany({ where: { reconBot: { itemId: { in: itemIds } } } });
      await prisma.reconBot.deleteMany({ where: { itemId: { in: itemIds } } });
      await prisma.shipmentLabel.deleteMany({ where: { itemId: { in: itemIds } } });
      await prisma.itemEngagementMetrics.deleteMany({ where: { itemId: { in: itemIds } } });
      await prisma.eventLog.deleteMany({ where: { itemId: { in: itemIds } } });
      await prisma.marketComp.deleteMany({ where: { itemId: { in: itemIds } } });
      await prisma.antiqueCheck.deleteMany({ where: { itemId: { in: itemIds } } });
      await prisma.valuation.deleteMany({ where: { itemId: { in: itemIds } } });
      await prisma.aiResult.deleteMany({ where: { itemId: { in: itemIds } } });
      await prisma.itemPhoto.deleteMany({ where: { itemId: { in: itemIds } } });
    }

    // 2. Delete items
    await prisma.item.deleteMany({ where: { userId: user.id } });

    // 3. Delete user-level relations
    const uc = await prisma.userCredits.findUnique({ where: { userId: user.id } });
    if (uc) {
      await prisma.creditTransaction.deleteMany({ where: { userCreditsId: uc.id } });
      await prisma.userCredits.delete({ where: { userId: user.id } });
    }

    // WhiteGlove cascade
    const wgProjects = await prisma.whiteGloveProject.findMany({ where: { userId: user.id }, select: { id: true } });
    if (wgProjects.length > 0) {
      const wgIds = wgProjects.map((p) => p.id);
      await prisma.whiteGlovePhase.deleteMany({ where: { projectId: { in: wgIds } } });
      await prisma.whiteGloveProject.deleteMany({ where: { userId: user.id } });
    }

    await prisma.userAddon.deleteMany({ where: { userId: user.id } });
    await prisma.connectedPlatform.deleteMany({ where: { userId: user.id } });
    await prisma.subscription.deleteMany({ where: { userId: user.id } });
    await prisma.subscriptionChange.deleteMany({ where: { userId: user.id } });
    await prisma.transaction.deleteMany({ where: { userId: user.id } });
    await prisma.project.deleteMany({ where: { userId: user.id } });
    await prisma.notification.deleteMany({ where: { userId: user.id } });
    await prisma.referral.deleteMany({ where: { referrerId: user.id } });
    await prisma.passwordReset.deleteMany({ where: { userId: user.id } });
    await prisma.paymentLedger.deleteMany({ where: { userId: user.id } });
    await prisma.sellerEarnings.deleteMany({ where: { userId: user.id } });
    await prisma.userEvent.deleteMany({ where: { userId: user.id } });
    await prisma.dataCollectionConsent.deleteMany({ where: { userId: user.id } });
    await prisma.heroVerification.deleteMany({ where: { userId: user.id } });

    // 4. Delete the user
    await prisma.user.delete({ where: { id: user.id } });

    // 5. Clear auth cookie
    const jar = await cookies();
    jar.delete("auth-token");

    console.log(`[ACCOUNT DELETION] Complete for userId=${user.id}`);

    return NextResponse.json({ ok: true, message: "Account and all data permanently deleted." });
  } catch (err: unknown) {
    console.error("[ACCOUNT DELETION] Failed:", err);
    return NextResponse.json({ error: "Account deletion failed. Please contact support." }, { status: 500 });
  }
}
