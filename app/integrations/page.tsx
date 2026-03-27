import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import IntegrationsClient from "./IntegrationsClient";
import Breadcrumbs from "@/app/components/Breadcrumbs";

export const metadata = { title: "Platform Integrations — LegacyLoop" };

export default async function IntegrationsPage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  const platforms = await prisma.connectedPlatform.findMany({
    where: { userId: user.id },
  }).catch((e) => { console.error("[integrations] platforms query failed:", e); return []; });

  return (
    <>
    <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Integrations" }]} />
    <IntegrationsClient
      connectedPlatforms={platforms.map((p) => ({
        platform: p.platform,
        platformUsername: p.platformUsername,
        isActive: p.isActive,
        lastSync: p.lastSync?.toISOString() ?? null,
      }))}
    />
    </>
  );
}
