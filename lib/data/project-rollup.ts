/**
 * Project Financial Rollup Service
 *
 * Recomputes cached rollup fields on Project from its items.
 * Fire-and-forget, try/catch, never throws.
 */

import { prisma } from "@/lib/db";

export async function updateProjectRollup(projectId: string): Promise<void> {
  try {
    const items = await prisma.item.findMany({
      where: { projectId },
      select: {
        status: true,
        listingPrice: true,
        soldPrice: true,
      },
    });

    const itemCount = items.length;
    const soldItems = items.filter((i) => ["SOLD", "SHIPPED", "COMPLETED"].includes(i.status));
    const soldCount = soldItems.length;

    const totalValue = items.reduce((sum, i) => {
      const price = i.listingPrice ?? 0;
      return sum + price;
    }, 0);

    const totalRevenue = soldItems.reduce((sum, i) => {
      const price = i.soldPrice ?? i.listingPrice ?? 0;
      return sum + price;
    }, 0);

    await prisma.project.update({
      where: { id: projectId },
      data: { itemCount, totalValue, soldCount, totalRevenue },
    });

    console.log(`[project-rollup] Updated project ${projectId}: ${itemCount} items, $${totalRevenue} revenue`);
  } catch (err: any) {
    console.error(`[project-rollup] Failed for project ${projectId}:`, err.message || err);
  }
}

/**
 * Recompute rollups for all projects (for backfill).
 */
export async function updateAllProjectRollups(): Promise<number> {
  try {
    const projects = await prisma.project.findMany({ select: { id: true } });
    for (const p of projects) {
      await updateProjectRollup(p.id);
    }
    console.log(`[project-rollup] Backfilled ${projects.length} projects`);
    return projects.length;
  } catch (err: any) {
    console.error("[project-rollup] Backfill failed:", err.message || err);
    return 0;
  }
}
