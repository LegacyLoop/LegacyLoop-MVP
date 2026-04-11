/**
 * Referral Redemption Helper — shared by signup + /api/referrals/redeem
 * Awards credits to REFERRER, marks referral USED, fires n8n WF22.
 * Never throws — returns { success: false } on any error.
 *
 * CMD-SIGNUP-REFERRAL-WIRE
 */

import { prisma } from "@/lib/db";
import { addCredits } from "@/lib/credits";
import { n8nReferralUsed } from "@/lib/n8n";

export interface RedeemResult {
  success: boolean;
  creditsAwarded?: number;
  error?: string;
}

/**
 * Redeem a referral code for a user.
 * @param code — the referral code (case-insensitive, trimmed)
 * @param newUser — the user redeeming the code { id, email }
 * @param options.skipDuplicateCheck — skip "already redeemed" check (for signup where user just created)
 */
export async function redeemReferralCode(
  code: string,
  newUser: { id: string; email: string },
  options?: { skipDuplicateCheck?: boolean },
): Promise<RedeemResult> {
  try {
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) return { success: false, error: "Empty code" };

    // Find the referral
    const referral = await prisma.referral.findUnique({ where: { code: trimmedCode } });
    if (!referral) return { success: false, error: "Code not found" };

    // Already used
    if (referral.status === "USED") return { success: false, error: "Already used" };

    // Can't use own code
    if (referral.referrerId === newUser.id) return { success: false, error: "Own code" };

    // Check if this user already redeemed any referral (skip for fresh signup)
    if (!options?.skipDuplicateCheck) {
      const alreadyRedeemed = await prisma.referral.findFirst({
        where: { referredEmail: newUser.email, status: "USED" },
      });
      if (alreadyRedeemed) return { success: false, error: "Already redeemed" };
    }

    const creditsAwarded = referral.rewardCredits;

    // Find referrer
    const referrer = await prisma.user.findUnique({
      where: { id: referral.referrerId },
      select: { id: true, email: true, displayName: true },
    });

    // Award credits to REFERRER
    if (referrer) {
      await addCredits(referrer.id, creditsAwarded, `Referral reward — ${newUser.email} used your code!`, "bonus");
    }

    // Mark referral as USED
    await prisma.referral.update({
      where: { id: referral.id },
      data: { status: "USED", referredEmail: newUser.email, usedAt: new Date() },
    });

    // n8n: WF22 referral used (fire-and-forget)
    if (referrer) {
      n8nReferralUsed(
        referrer.email,
        referrer.displayName?.split(" ")[0] ?? "",
        newUser.email,
        creditsAwarded,
      );
    }

    return { success: true, creditsAwarded };
  } catch (err) {
    console.error("[referrals] redeemReferralCode error:", err);
    return { success: false, error: "Redemption failed" };
  }
}
