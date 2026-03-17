import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

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

  const creditsToAward = declined ? 0 : dataCollection ? 100 : 0;

  // Upsert consent record
  await prisma.dataCollectionConsent.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      dataCollection,
      aiTraining,
      marketResearch,
      anonymousSharing,
      creditsEarned: creditsToAward,
      consentedAt: declined ? undefined : new Date(),
    },
    update: {
      dataCollection,
      aiTraining,
      marketResearch,
      anonymousSharing,
      creditsEarned: creditsToAward,
      consentedAt: declined ? undefined : new Date(),
      revokedAt: declined ? new Date() : undefined,
    },
  });

  // Award 100 credits if user consented (bonus incentive)
  if (!declined && dataCollection && creditsToAward > 0) {
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

  return NextResponse.json({ ok: true, creditsAwarded: creditsToAward });
}
