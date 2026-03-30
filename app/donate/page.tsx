import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import DonateClient from "./DonateClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Donate Items · LegacyLoop", description: "Donate unsold items to local charities and support our mission" };

export default async function DonatePage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  const items = await prisma.item.findMany({
    where: {
      userId: user.id,
      status: { notIn: ["SOLD", "SHIPPED", "COMPLETED"] },
    },
    include: { valuation: true, photos: true },
    orderBy: { createdAt: "desc" },
  }).catch((e) => { console.error("[donate] items query failed:", e); return []; });

  const serialized = items.map((item) => ({
    id: item.id,
    title: item.title || `Item #${item.id.slice(0, 8)}`,
    status: item.status,
    condition: item.condition,
    estimatedHigh: (item.valuation as any)?.high ?? null,
    photo: item.photos[0]?.filePath ?? null,
  }));

  return <DonateClient items={serialized} />;
}
