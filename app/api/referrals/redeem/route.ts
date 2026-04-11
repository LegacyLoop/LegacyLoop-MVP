import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { redeemReferralCode } from "@/lib/referrals";

/**
 * POST /api/referrals/redeem
 * Redeems a referral code for the authenticated user.
 * Awards credits to the REFERRER. Marks referral as USED.
 * Fires WF22 to n8n (fire-and-forget).
 *
 * Body: { code: string }
 *
 * CMD-N8N-COMPLETE → CMD-SIGNUP-REFERRAL-WIRE (refactored to shared helper)
 */
export async function POST(req: NextRequest) {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { code } = await req.json().catch(() => ({ code: null }));

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Referral code is required" }, { status: 400 });
    }

    const result = await redeemReferralCode(code, { id: user.id, email: user.email });

    if (!result.success) {
      const errorMessages: Record<string, string> = {
        "Code not found": "Referral code not found",
        "Already used": "This referral code has already been used",
        "Own code": "You cannot redeem your own referral code",
        "Already redeemed": "You have already redeemed a referral code",
      };
      return NextResponse.json(
        { error: errorMessages[result.error || ""] || "Failed to redeem referral code" },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, creditsAwarded: result.creditsAwarded });
  } catch (err) {
    console.error("[referrals/redeem] Error:", err);
    return NextResponse.json({ error: "Failed to redeem referral code" }, { status: 500 });
  }
}
