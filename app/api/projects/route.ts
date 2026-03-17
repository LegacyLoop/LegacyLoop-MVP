import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { logUserEvent } from "@/lib/data/user-events";

export async function GET() {
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

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
  });

  return Response.json(projects);
}

export async function POST(req: Request) {
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { type, name, description, startDate, endDate, location, city, state } = body;

  if (!name?.trim()) return new Response("Name required", { status: 400 });

  const project = await prisma.project.create({
    data: {
      userId: user.id,
      type: type ?? "ESTATE_SALE",
      name: String(name).trim(),
      description: description ? String(description).trim() : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      location: location ? String(location).trim() : null,
      city: city ? String(city).trim() : null,
      state: state ? String(state).trim() : null,
      status: "DRAFT",
    },
  });

  logUserEvent(user.id, "SALE_CREATED", { metadata: { projectId: project.id } }).catch(() => null);

  return Response.json({ ok: true, project });
}
