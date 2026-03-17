import { prisma } from "@/lib/db";
import { ADDONS } from "@/lib/constants/pricing";

export async function seedAddons(): Promise<number> {
  let count = 0;
  for (const addon of ADDONS) {
    await prisma.addon.upsert({
      where: { addonId: addon.id },
      update: { name: addon.name, description: addon.description, credits: addon.credits, category: addon.category, isActive: true },
      create: { addonId: addon.id, name: addon.name, description: addon.description, credits: addon.credits, category: addon.category, isActive: true },
    });
    count++;
  }
  return count;
}
