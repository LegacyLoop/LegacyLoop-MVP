import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import MarketplaceClient from "./MarketplaceClient";

export const metadata = { title: "Add-On Marketplace — LegacyLoop" };

export default async function MarketplacePage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  let credits = await prisma.userCredits
    .findUnique({
      where: { userId: user.id },
      select: { balance: true, lifetime: true, spent: true },
    })
    .catch(() => null);

  if (!credits) {
    credits = await prisma.userCredits
      .create({
        data: { userId: user.id, balance: 0, lifetime: 0, spent: 0 },
        select: { balance: true, lifetime: true, spent: true },
      })
      .catch(() => null);
  }

  return (
    <MarketplaceClient
      initialBalance={credits?.balance ?? 0}
      lifetime={credits?.lifetime ?? 0}
      spent={credits?.spent ?? 0}
    />
  );
}
