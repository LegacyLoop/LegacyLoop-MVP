// SCHEMA ADDITION REQUIRED — See P4.2 report
// Add SoldPriceRecord model to prisma/schema.prisma before activating
// Until schema is approved: writes to EventLog using existing pattern

import { prisma } from "@/lib/db";

interface SoldPriceData {
  itemId: string;
  userId: string;
  soldPrice: number;
  estimatedValue: number | null;
  priceDelta: number | null;
  soldVia: string;
  category: string | null;
  condition: string | null;
  soldAt: Date;
}

export async function logSoldPrice(data: SoldPriceData): Promise<void> {
  try {
    await prisma.eventLog.create({
      data: {
        itemId: data.itemId,
        eventType: "SOLD_PRICE_LOG",
        payload: JSON.stringify({
          userId: data.userId,
          soldPrice: data.soldPrice,
          estimatedValue: data.estimatedValue,
          priceDelta: data.priceDelta,
          soldVia: data.soldVia,
          category: data.category,
          condition: data.condition,
          soldAt: data.soldAt.toISOString(),
          // Future: when SoldPriceRecord model is approved,
          // this data will be written there instead
        }),
      },
    });
    console.log(`[sold-price-log] Recorded: $${data.soldPrice} for item ${data.itemId} (delta: ${data.priceDelta !== null ? `$${data.priceDelta}` : "N/A"})`);
  } catch (err: any) {
    console.error(`[sold-price-log] Failed for item ${data.itemId}:`, err.message || err);
  }
}
