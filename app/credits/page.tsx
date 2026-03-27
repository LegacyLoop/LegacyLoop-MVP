import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import CreditsClient from "./CreditsClient";
import Breadcrumbs from "@/app/components/Breadcrumbs";

export const metadata = { title: "Credits — LegacyLoop" };

export default async function CreditsPage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  let credits = await prisma.userCredits.findUnique({
    where: { userId: user.id },
    include: { transactions: { orderBy: { createdAt: "desc" }, take: 30 } },
  }).catch((e) => { console.error("[credits] findUnique failed:", e); return null; });

  if (!credits) {
    credits = await prisma.userCredits.create({
      data: { userId: user.id, balance: 0, lifetime: 0, spent: 0 },
      include: { transactions: true },
    }).catch((e) => { console.error("[credits] create failed:", e); return null; });
  }

  return (
    <>
    <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Credits" }]} />
    <CreditsClient
      initialBalance={credits?.balance ?? 0}
      lifetime={credits?.lifetime ?? 0}
      spent={credits?.spent ?? 0}
      transactions={(credits?.transactions ?? []).map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        balance: t.balance,
        description: t.description,
        paymentAmount: t.paymentAmount,
        createdAt: t.createdAt.toISOString(),
      }))}
    />
    </>
  );
}
