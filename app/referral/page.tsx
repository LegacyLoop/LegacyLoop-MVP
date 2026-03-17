import { redirect } from "next/navigation";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import ReferralClient from "./ReferralClient";

export const metadata = { title: "Referrals — LegacyLoop" };

function generateCode(userId: string): string {
  return Buffer.from(userId).toString("base64").slice(0, 8).toUpperCase();
}

export default async function ReferralPage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  const code = generateCode(user.id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const shareUrl = `${appUrl}/auth/signup?ref=${code}`;

  // Upsert referral row for this user (the "my code" row, no referredEmail)
  try {
    await prisma.referral.upsert({
      where: { code },
      create: { referrerId: user.id, code, referredEmail: null, status: "PENDING" },
      update: {},
    });
  } catch (e) {
    console.error("[referral] upsert failed:", e);
  }

  const referrals = await prisma.referral.findMany({
    where: { referrerId: user.id, referredEmail: { not: null } },
    orderBy: { createdAt: "desc" },
  }).catch((e) => { console.error("[referral] findMany failed:", e); return []; });

  const serialized = referrals.map((r) => ({
    id: r.id,
    referredEmail: r.referredEmail,
    status: r.status,
    rewardCredits: r.rewardCredits,
    createdAt: r.createdAt.toISOString(),
    usedAt: r.usedAt?.toISOString() ?? null,
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <div className="section-title">Referral Program</div>
        <h1 className="h2 mt-1">Refer a Friend</h1>
        <p className="muted mt-2">Both you and your friend get 25 free credits when they sign up.</p>
      </div>
      <ReferralClient code={code} shareUrl={shareUrl} referrals={serialized} />
    </div>
  );
}
