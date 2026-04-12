/**
 * Backfill garage sale prices for all items that have a valuation
 * but no garageSalePrice calculated yet.
 *
 * Usage: npx tsx scripts/backfill-garage-prices.ts
 */

import { PrismaClient } from "@prisma/client";
import { calculateGarageSalePrices } from "../lib/pricing/garage-sale";

const prisma = new PrismaClient();

async function backfill() {
  const items = await prisma.item.findMany({
    where: { garageSalePrice: null },
    include: { valuation: true },
  });

  const needsBackfill = items.filter((i) => i.valuation);
  console.log(`Found ${items.length} total items, ${needsBackfill.length} with valuation needing backfill.`);

  let count = 0;
  let skipped = 0;

  for (const item of needsBackfill) {
    try {
      const mid = (item.valuation as any)?.mid ?? Math.round((item.valuation!.low + item.valuation!.high) / 2);
      if (mid <= 0) { skipped++; continue; }

      const prices = calculateGarageSalePrices(
        mid,
        (item as any).category || "default",
        (item as any).condition || (item as any).conditionGrade || "good",
        (item as any).saleZip || undefined,
      );

      await prisma.item.update({
        where: { id: item.id },
        data: {
          garageSalePrice: prices.garageSalePrice,
          garageSalePriceHigh: prices.garageSalePriceHigh,
          quickSalePrice: prices.quickSalePrice,
          quickSalePriceHigh: prices.quickSalePriceHigh,
          garageSaleCalcAt: new Date(),
        },
      });

      console.log(`  ✅ ${item.title || item.id}: $${prices.garageSalePrice}-${prices.garageSalePriceHigh} garage, $${prices.quickSalePrice}-${prices.quickSalePriceHigh} quick`);
      count++;
    } catch (err) {
      console.warn(`  ⚠️ Failed: ${item.id}`, err);
      skipped++;
    }
  }

  console.log(`\nDone. Backfilled: ${count}, Skipped: ${skipped}`);
  await prisma.$disconnect();
}

backfill();
