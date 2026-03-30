import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import SubscriptionClient from "./SubscriptionClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Subscription Plans · LegacyLoop", description: "Manage your plan, upgrade, or view billing history" };

export default async function SubscriptionPage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  const subscription = await prisma.subscription.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  }).catch((e) => { console.error("[subscription] findFirst failed:", e); return null; });

  const [itemCount, projectCount] = await Promise.all([
    prisma.item.count({ where: { userId: user.id } }).catch(() => 0),
    prisma.project.count({ where: { userId: user.id } }).catch(() => 0),
  ]);

  const changes = await prisma.subscriptionChange.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  }).catch((e) => { console.error("[subscription] changes query failed:", e); return []; });

  const serializedSub = subscription
    ? {
        id: subscription.id,
        tier: subscription.tier,
        price: subscription.price,
        status: subscription.status,
        billingPeriod: subscription.billingPeriod,
        currentPeriodStart: subscription.currentPeriodStart.toISOString(),
        currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
      }
    : null;

  const serializedChanges = changes.map((c) => ({
    id: c.id,
    fromTier: c.fromTier,
    toTier: c.toTier,
    changeType: c.changeType,
    amountPaid: c.amountPaid,
    daysUsed: c.daysUsed,
    daysRemaining: c.daysRemaining,
    proratedRefund: c.proratedRefund,
    creditIssued: c.creditIssued,
    refundMethod: c.refundMethod,
    reason: c.reason,
    refundStatus: c.refundStatus,
    changeDate: c.changeDate.toISOString(),
  }));

  return <SubscriptionClient subscription={serializedSub} changes={serializedChanges} itemCount={itemCount} projectCount={projectCount} />;
}
