import { prisma } from "@/lib/db";
import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://legacyloop.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const items = await prisma.item.findMany({
    where: { status: { in: ["LISTED", "INTERESTED", "ANALYZED", "READY"] } },
    select: { id: true, userId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 5000,
  }).catch(() => []);

  const users = await prisma.user.findMany({
    where: {
      items: {
        some: { status: { in: ["LISTED", "INTERESTED", "ANALYZED", "READY"] } },
      },
    },
    select: { id: true, createdAt: true },
    take: 1000,
  }).catch(() => []);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}`, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  const storeRoutes: MetadataRoute.Sitemap = users.map((u) => ({
    url: `${BASE_URL}/store/${u.id}`,
    lastModified: u.createdAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const itemRoutes: MetadataRoute.Sitemap = items.map((item) => ({
    url: `${BASE_URL}/store/${item.userId}/item/${item.id}`,
    lastModified: item.createdAt,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...storeRoutes, ...itemRoutes];
}
