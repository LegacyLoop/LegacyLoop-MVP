import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import WhiteGloveClient from "./WhiteGloveClient";

type Params = Promise<{ projectId: string }>;

export default async function WhiteGloveProjectPage({ params }: { params: Params }) {
  const { projectId } = await params;
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  const project = await prisma.whiteGloveProject.findUnique({
    where: { id: projectId },
    include: { phases: { orderBy: { phaseNumber: "asc" } } },
  }).catch((e) => { console.error("[white-glove-detail] project query failed:", e); return null; });

  if (!project || project.userId !== user.id) notFound();

  // Items associated with this project
  const items = await prisma.item.findMany({
    where: { userId: user.id },
    include: { valuation: true, antiqueCheck: true, photos: { take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 50,
  }).catch((e) => { console.error("[white-glove-detail] items query failed:", e); return []; });

  const serializedProject = {
    id: project.id,
    tier: project.tier,
    status: project.status,
    currentPhase: (project as any).currentPhase ?? "CONSULTATION",
    address: project.address,
    city: project.city,
    state: project.state,
    zip: project.zip,
    bedrooms: project.bedrooms,
    estimatedItems: project.estimatedItems,
    basePrice: project.basePrice,
    commission: project.commission,
    totalUpfront: project.totalUpfront,
    estimatedValue: project.estimatedValue,
    actualRevenue: project.actualRevenue,
    projectManager: project.projectManager,
    teamJson: (project as any).teamJson ?? "{}",
    consultDate: project.consultDate?.toISOString() ?? null,
    startDate: project.startDate?.toISOString() ?? null,
    completionDate: project.completionDate?.toISOString() ?? null,
    estimatedWeeks: project.estimatedWeeks,
    includedServicesJson: project.includedServicesJson,
    notes: project.notes,
    createdAt: project.createdAt.toISOString(),
    phases: project.phases.map((p) => ({
      id: p.id,
      phaseNumber: p.phaseNumber,
      phaseName: p.phaseName,
      status: p.status,
      startedAt: p.startedAt?.toISOString() ?? null,
      completedAt: p.completedAt?.toISOString() ?? null,
      tasksJson: p.tasksJson,
      notes: p.notes,
    })),
  };

  const serializedItems = items.map((item) => ({
    id: item.id,
    title: item.title ?? `Item #${item.id.slice(0, 6)}`,
    status: item.status,
    condition: item.condition,
    estimatedValue: (item.valuation as any)?.high ?? null,
    isAntique: item.antiqueCheck?.isAntique ?? false,
    photo: item.photos[0]?.filePath ?? null,
  }));

  return <WhiteGloveClient project={serializedProject} items={serializedItems} />;
}
