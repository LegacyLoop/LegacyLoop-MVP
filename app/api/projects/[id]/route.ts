import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { updateProjectRollup } from "@/lib/data/project-rollup";

type Params = Promise<{ id: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

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
  });

  if (!project || project.userId !== user.id) {
    return new Response("Not found", { status: 404 });
  }

  return Response.json(project);
}

export async function PATCH(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.userId !== user.id) {
    return new Response("Not found", { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const { name, description, startDate, endDate, location, city, state, status, type } = body;

  // Add item to project
  if (body.addItemId) {
    const item = await prisma.item.findUnique({ where: { id: body.addItemId } });
    if (item && item.userId === user.id) {
      await prisma.item.update({ where: { id: body.addItemId }, data: { projectId: id } });
      updateProjectRollup(id).catch(() => null);
    }
    return Response.json({ ok: true });
  }

  // Remove item from project
  if (body.removeItemId) {
    await prisma.item.update({ where: { id: body.removeItemId }, data: { projectId: null } });
    updateProjectRollup(id).catch(() => null);
    return Response.json({ ok: true });
  }

  // Bulk publish all items in project
  if (body.publishAll) {
    await prisma.item.updateMany({
      where: { projectId: id, userId: user.id, status: { in: ["ANALYZED", "READY", "DRAFT"] } },
      data: { status: "LISTED" },
    });
    return Response.json({ ok: true, action: "publishAll" });
  }

  // Sell All — mark all unsold items as SOLD with bulk pricing
  if (body.sellAll) {
    const { discountPct, bulkPrice } = body.sellAll;

    const unsoldItems = await prisma.item.findMany({
      where: {
        projectId: id,
        userId: user.id,
        status: { notIn: ["SOLD", "SHIPPED", "COMPLETED"] },
      },
      select: { id: true, listingPrice: true },
    });

    if (unsoldItems.length === 0) {
      return Response.json({ ok: false, error: "No unsold items" });
    }

    const perItemPrice = bulkPrice
      ? Math.round((bulkPrice / unsoldItems.length) * 100) / 100
      : null;

    for (const item of unsoldItems) {
      const soldPrice = perItemPrice ?? Math.round((Number(item.listingPrice) || 0) * (1 - (discountPct ?? 0) / 100));
      await prisma.item.update({
        where: { id: item.id },
        data: { status: "SOLD", soldPrice: Math.round(soldPrice) },
      });
    }

    await prisma.eventLog.create({
      data: {
        itemId: unsoldItems[0].id,
        userId: user.id,
        eventType: "SELL_ALL_BULK",
        payload: JSON.stringify({
          projectId: id,
          itemCount: unsoldItems.length,
          discountPct: discountPct ?? null,
          bulkPrice: bulkPrice ?? null,
          perItemPrice,
        }),
      },
    }).catch(() => null);

    updateProjectRollup(id).catch(() => null);

    return Response.json({
      ok: true,
      action: "sellAll",
      itemCount: unsoldItems.length,
      bulkPrice: bulkPrice ?? null,
    });
  }

  // ── Sell Department (bulk sell one category) ──
  if (body.sellDepartment) {
    const { category, discountPct, bulkPrice } = body.sellDepartment;
    if (!category) return Response.json({ error: "Category required" }, { status: 400 });

    const unsold = await prisma.item.findMany({
      where: { projectId: id, userId: user.id, status: { notIn: ["SOLD", "SHIPPED", "COMPLETED"] } },
      include: { aiResult: { select: { rawJson: true } } },
    });

    const deptItems = unsold.filter((item) => {
      try {
        const ai = item.aiResult?.rawJson ? JSON.parse(item.aiResult.rawJson) : null;
        return (ai?.category || "Other") === category;
      } catch { return false; }
    });

    if (deptItems.length === 0) {
      return Response.json({ error: "No unsold items in this department" }, { status: 400 });
    }

    const totalValue = deptItems.reduce((s, i) => s + (i.listingPrice ? Number(i.listingPrice) : 0), 0);
    const finalPrice = bulkPrice != null ? Number(bulkPrice) : Math.round(totalValue * (1 - (discountPct || 25) / 100));
    const perItem = Math.round(finalPrice / deptItems.length);

    for (const item of deptItems) {
      await prisma.item.update({ where: { id: item.id }, data: { status: "SOLD", listingPrice: perItem } });
    }

    await prisma.eventLog.create({
      data: {
        itemId: deptItems[0].id,
        userId: user.id,
        eventType: "SELL_DEPARTMENT_BULK",
        payload: JSON.stringify({ projectId: id, category, itemCount: deptItems.length, totalValue, bulkPrice: finalPrice, perItemPrice: perItem, discountPct: discountPct || Math.round((1 - finalPrice / totalValue) * 100) }),
      },
    });

    return Response.json({ ok: true, category, itemCount: deptItems.length, bulkPrice: finalPrice, perItemPrice: perItem });
  }

  // Update project fields
  const updated = await prisma.project.update({
    where: { id },
    data: {
      ...(name != null && { name: String(name).trim() }),
      ...(description != null && { description: String(description).trim() }),
      ...(startDate != null && { startDate: startDate ? new Date(startDate) : null }),
      ...(endDate != null && { endDate: endDate ? new Date(endDate) : null }),
      ...(location != null && { location: String(location).trim() }),
      ...(city != null && { city: String(city).trim() }),
      ...(state != null && { state: String(state).trim() }),
      ...(status != null && { status }),
      ...(type != null && { type }),
    },
  });

  return Response.json({ ok: true, project: updated });
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.userId !== user.id) {
    return new Response("Not found", { status: 404 });
  }

  // Unlink items
  await prisma.item.updateMany({ where: { projectId: id }, data: { projectId: null } });
  await prisma.project.delete({ where: { id } });

  return Response.json({ ok: true });
}
