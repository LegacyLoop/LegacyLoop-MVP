import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

/**
 * POST /api/consent
 *
 * Upserts the user's data collection consent preferences.
 *
 * Behavior:
 * - Each of the 4 consent flags is independently controllable
 * - Awards 100 credits on FIRST acceptance of dataCollection (idempotent)
 * - Credits are NEVER clawed back on revocation
 * - Declined users get revokedAt timestamp set
 * - All preferences are revocable and re-settable
 */
export async function POST(req: NextRequest) {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const {
    dataCollection = false,
    aiTraining = false,
    marketResearch = false,
    anonymousSharing = false,
    declined = false,
  } = body;

  // Check if user already consented (for idempotent credit award)
  const priorConsent = await prisma.dataCollectionConsent.findUnique({
    where: { userId: user.id },
  });
  const alreadyConsented = priorConsent?.dataCollection === true;

  // Determine credits to award — only on first dataCollection acceptance
  const shouldAwardCredits = !declined && dataCollection && !alreadyConsented;
  const creditsToAward = shouldAwardCredits ? 100 : 0;

  // Preserve previously earned credits on update/revocation
  const existingCredits = priorConsent?.creditsEarned ?? 0;

  // Upsert consent record
  await prisma.dataCollectionConsent.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      dataCollection: declined ? false : dataCollection,
      aiTraining: declined ? false : aiTraining,
      marketResearch: declined ? false : marketResearch,
      anonymousSharing: declined ? false : anonymousSharing,
      creditsEarned: creditsToAward,
      consentedAt: declined ? undefined : new Date(),
      revokedAt: declined ? new Date() : undefined,
    },
    update: {
      dataCollection: declined ? false : dataCollection,
      aiTraining: declined ? false : aiTraining,
      marketResearch: declined ? false : marketResearch,
      anonymousSharing: declined ? false : anonymousSharing,
      // Never reduce creditsEarned — credits are not clawed back
      creditsEarned: Math.max(existingCredits, existingCredits + creditsToAward),
      consentedAt: declined ? undefined : new Date(),
      revokedAt: declined ? new Date() : undefined,
    },
  });

  // Award 100 credits ONLY on first consent (idempotent — never double-award)
  let actualCreditsAwarded = 0;

  if (shouldAwardCredits && creditsToAward > 0) {
    actualCreditsAwarded = creditsToAward;
    const existing = await prisma.userCredits.findUnique({
      where: { userId: user.id },
    });

    if (existing) {
      await prisma.userCredits.update({
        where: { userId: user.id },
        data: {
          balance: { increment: creditsToAward },
          lifetime: { increment: creditsToAward },
          transactions: {
            create: {
              type: "bonus",
              amount: creditsToAward,
              balance: existing.balance + creditsToAward,
              description: "Data sharing bonus — thank you!",
            },
          },
        },
      });
    } else {
      await prisma.userCredits.create({
        data: {
          userId: user.id,
          balance: creditsToAward,
          lifetime: creditsToAward,
          transactions: {
            create: {
              type: "bonus",
              amount: creditsToAward,
              balance: creditsToAward,
              description: "Data sharing bonus — thank you!",
            },
          },
        },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    creditsAwarded: actualCreditsAwarded,
    alreadyConsented,
  });
}
