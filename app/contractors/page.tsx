import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import ContractorsClient from "./ContractorsClient";

export default async function ContractorsPage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  const contractors = await prisma.contractor.findMany({
    orderBy: [{ available: "desc" }, { rating: "desc" }],
  }).catch((e) => { console.error("[contractors] contractors query failed:", e); return []; });

  const jobs = await prisma.contractorJob.findMany({
    orderBy: { scheduledDate: "desc" },
    take: 20,
  }).catch((e) => { console.error("[contractors] jobs query failed:", e); return []; });

  const serialized = contractors.map((c) => ({
    id: c.id,
    type: c.type,
    company: c.company,
    contactName: c.contactName,
    phone: c.phone,
    email: c.email,
    serviceArea: c.serviceArea,
    ratesJson: c.ratesJson,
    rating: c.rating,
    reviewCount: c.reviewCount,
    available: c.available,
    notes: c.notes,
  }));

  const serializedJobs = jobs.map((j) => ({
    id: j.id,
    contractorId: j.contractorId,
    projectId: j.projectId,
    jobType: j.jobType,
    scheduledDate: j.scheduledDate.toISOString(),
    completedDate: j.completedDate?.toISOString() ?? null,
    cost: j.cost,
    paid: j.paid,
    notes: j.notes,
  }));

  return <ContractorsClient contractors={serialized} jobs={serializedJobs} />;
}
