import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProjectDetailClient from "./ProjectDetailClient";
import { safeJson } from "@/lib/utils/json";

type Params = Promise<{ id: string }>;

export default async function ProjectDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const user = await authAdapter.getSession();
  if (!user) return <div className="card p-8 max-w-xl mx-auto mt-10"><Link href="/auth/login" className="btn-primary">Log in</Link></div>;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          photos: { take: 1 },
          valuation: true,
          antiqueCheck: true,
          aiResult: true,
          conversations: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  }).catch((e) => { console.error("[project-detail] project query failed:", e); return null; });

  if (!project || project.userId !== user.id) notFound();

  // Items that can be added to this project
  const availableItems = await prisma.item.findMany({
    where: { userId: user.id, projectId: null },
    include: { photos: { take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 50,
  }).catch((e) => { console.error("[project-detail] availableItems query failed:", e); return []; });

  const itemsSold = project.items.filter((i) => ["SOLD", "SHIPPED", "COMPLETED"].includes(i.status));
  const revenue = itemsSold.reduce((s, i) => s + (i.listingPrice ? Number(i.listingPrice) : (i.valuation?.high ?? 0)), 0);
  const portfolio = project.items.filter((i) => !["SOLD", "SHIPPED", "COMPLETED"].includes(i.status))
    .reduce((s, i) => s + (i.valuation?.high ?? 0), 0);

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const serializedItems = project.items.map((i) => {
    const ai = safeJson(i.aiResult?.rawJson);
    return {
      id: i.id,
      title: i.title || ai?.item_name || `Item #${i.id.slice(0, 8)}`,
      status: i.status,
      photoUrl: i.photos[0]?.filePath ?? null,
      isAntique: i.antiqueCheck?.isAntique ?? false,
      valuationHigh: i.valuation?.high ?? null,
      listingPrice: i.listingPrice ? Number(i.listingPrice) : null,
      convCount: i.conversations.length,
    };
  });

  const serializedAvailable = availableItems.map((i) => ({
    id: i.id,
    title: i.title ?? `Item #${i.id.slice(0, 8)}`,
    photoUrl: i.photos[0]?.filePath ?? null,
    status: i.status,
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <ProjectDetailClient
        project={{
          id: project.id,
          type: project.type,
          name: project.name,
          description: project.description,
          startDate: project.startDate?.toISOString() ?? null,
          endDate: project.endDate?.toISOString() ?? null,
          city: project.city,
          state: project.state,
          status: project.status,
          itemCount: project.items.length,
          soldCount: itemsSold.length,
          revenue: Math.round(revenue),
          portfolio: Math.round(portfolio),
          publicUrl: `${BASE_URL}/sale/${project.id}`,
        }}
        items={serializedItems}
        availableItems={serializedAvailable}
      />
    </div>
  );
}
