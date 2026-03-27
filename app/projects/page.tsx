import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import type { Metadata } from "next";
import ProjectsClient from "./ProjectsClient";
import Breadcrumbs from "@/app/components/Breadcrumbs";

export const metadata: Metadata = { title: "Projects · LegacyLoop" };

export default async function ProjectsPage() {
  const user = await authAdapter.getSession();
  if (!user) {
    return (
      <div className="card p-8 max-w-xl mx-auto mt-10 text-center">
        <Link href="/auth/login" className="btn-primary inline-flex">Log in</Link>
      </div>
    );
  }

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    include: {
      items: {
        select: {
          id: true,
          status: true,
          listingPrice: true,
          valuation: { select: { high: true } },
          photos: { take: 1, select: { filePath: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  }).catch((e) => { console.error("[projects] projects query failed:", e); return []; });

  // Unassigned items (for adding to projects)
  const unassignedItems = await prisma.item.findMany({
    where: { userId: user.id, projectId: null, status: { not: "DRAFT" } },
    include: { photos: { take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 50,
  }).catch((e) => { console.error("[projects] unassignedItems query failed:", e); return []; });

  const serialized = projects.map((p) => {
    const itemsSold = p.items.filter((i) => ["SOLD", "SHIPPED", "COMPLETED"].includes(i.status)).length;
    const revenue = p.items
      .filter((i) => ["SOLD", "SHIPPED", "COMPLETED"].includes(i.status))
      .reduce((s, i) => s + (i.listingPrice ? Number(i.listingPrice) : (i.valuation?.high ?? 0)), 0);
    const portfolio = p.items
      .filter((i) => !["SOLD", "SHIPPED", "COMPLETED"].includes(i.status))
      .reduce((s, i) => s + (i.valuation?.high ?? 0), 0);

    return {
      id: p.id,
      type: p.type,
      name: p.name,
      description: p.description,
      startDate: p.startDate?.toISOString() ?? null,
      endDate: p.endDate?.toISOString() ?? null,
      location: p.location,
      city: p.city,
      state: p.state,
      status: p.status,
      itemCount: p.items.length,
      listedCount: p.items.filter((i) => ["LISTED", "INTERESTED", "READY"].includes(i.status)).length,
      soldCount: itemsSold,
      revenue: Math.round(revenue),
      portfolio: Math.round(portfolio),
      photoUrl: p.items.find((i) => i.photos[0])?.photos[0]?.filePath ?? null,
      createdAt: p.createdAt.toISOString(),
    };
  });

  const unassigned = unassignedItems.map((i) => ({
    id: i.id,
    title: i.title ?? `Item #${i.id.slice(0, 8)}`,
    photoUrl: i.photos[0]?.filePath ?? null,
    status: i.status,
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Projects" }]} />
      <ProjectsClient projects={serialized} unassignedItems={unassigned} />
    </div>
  );
}
