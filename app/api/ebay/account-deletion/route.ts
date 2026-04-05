import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";

/* ═══════════════════════════════════════════════════════════════════════
   eBay Marketplace Account Deletion — COMPLIANCE REQUIREMENT

   GET  — eBay sends a challenge to verify endpoint ownership
   POST — eBay notifies when a user deletes their eBay account

   Endpoint URL: https://legacy-loop.com/api/ebay/account-deletion
   ═══════════════════════════════════════════════════════════════════════ */

const VERIFICATION_TOKEN = process.env.EBAY_VERIFICATION_TOKEN || "";
const ENDPOINT_URL = process.env.EBAY_DELETION_ENDPOINT_URL || "https://app.legacy-loop.com/api/ebay/account-deletion";

/**
 * GET — eBay challenge-response verification.
 * eBay sends ?challenge_code=xxx and expects back:
 *   { challengeResponse: sha256(challenge_code + verificationToken + endpointUrl) }
 */
export async function GET(req: NextRequest) {
  const challengeCode = req.nextUrl.searchParams.get("challenge_code");
  if (!challengeCode) {
    return NextResponse.json({ error: "Missing challenge_code" }, { status: 400 });
  }

  const hash = crypto
    .createHash("sha256")
    .update(challengeCode + VERIFICATION_TOKEN + ENDPOINT_URL)
    .digest("hex");

  return NextResponse.json({ challengeResponse: hash });
}

/**
 * POST — eBay account deletion notification.
 * When an eBay user deletes their account, eBay sends us
 * their userId so we can clean up our stored data.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ebayUserId = body?.metadata?.userId;

    if (ebayUserId) {
      // Deactivate any ConnectedPlatform records tied to this eBay user
      await prisma.connectedPlatform.updateMany({
        where: {
          platform: "ebay",
          platformUsername: ebayUserId,
        },
        data: {
          isActive: false,
          settingsJson: "{}",        // Clear stored tokens
          lastSync: new Date(),
        },
      });

      console.log("[eBay] Account deletion processed for eBay user:", ebayUserId);
    }

    return NextResponse.json({ status: "ok" });
  } catch (err: any) {
    console.error("[eBay] Account deletion error:", err.message);
    // Always return 200 to eBay — they retry on failures
    return NextResponse.json({ status: "ok" });
  }
}
