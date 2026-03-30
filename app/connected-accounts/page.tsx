import { redirect } from "next/navigation";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import ConnectedAccountsClient from "./ConnectedAccountsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Connected Accounts · LegacyLoop", description: "Link your marketplace and social media accounts" };

export default async function ConnectedAccountsPage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/login");

  const platforms = await prisma.connectedPlatform.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      platform: true,
      platformUsername: true,
      isActive: true,
      lastSync: true,
    },
  });

  const serialized = platforms.map((p) => ({
    ...p,
    lastSync: p.lastSync?.toISOString() ?? null,
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <div className="section-title">Integrations</div>
      <h1 className="h2 mt-2">Connected Accounts</h1>
      <p className="muted mt-3">
        Link your selling platforms, social media, payments, and cloud storage to
        automate cross-listing, track sales, and streamline payouts.
      </p>

      <ConnectedAccountsClient connectedPlatforms={serialized} />
    </div>
  );
}
