/**
 * Data Foundation — Backfill Service
 *
 * Extracts structured intelligence from existing AiResult JSON blobs
 * and populates the new queryable fields on Item.
 * Also creates PriceSnapshot records from existing bot results.
 *
 * Safe: never overwrites existing structured data.
 * Safe: never throws — logs failures silently.
 */

import { prisma } from "@/lib/db";

function safeJson(raw: string | null | undefined): any {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Backfill structured intelligence for a single item.
 */
export async function backfillItemIntelligence(itemId: string): Promise<void> {
  try {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { aiResult: true },
    });
    if (!item) return;

    // ── Extract from AiResult.rawJson ──
    const ai = safeJson(item.aiResult?.rawJson);
    if (ai) {
      const updates: Record<string, string> = {};

      if (!item.category && ai.category) updates.category = String(ai.category);
      if (!item.brand && ai.brand) updates.brand = String(ai.brand);
      if (!item.era && ai.era) updates.era = String(ai.era);
      if (!item.material && ai.material) updates.material = String(ai.material);
      if (!item.maker && ai.maker) updates.maker = String(ai.maker);
      if (!item.itemStyle && ai.style) updates.itemStyle = String(ai.style);
      if (!item.countryOfOrigin && ai.country_of_origin) updates.countryOfOrigin = String(ai.country_of_origin);
      if (!item.conditionGrade && ai.condition_guess) updates.conditionGrade = String(ai.condition_guess);

      if (Object.keys(updates).length > 0) {
        await prisma.item.update({ where: { id: itemId }, data: updates });
      }
    }

    // ── Create PriceSnapshot from PRICEBOT_RESULT ──
    const priceBotLog = await prisma.eventLog.findFirst({
      where: { itemId, eventType: "PRICEBOT_RESULT" },
      orderBy: { createdAt: "desc" },
    });
    if (priceBotLog?.payload) {
      const existing = await prisma.priceSnapshot.findFirst({
        where: { itemId, source: "PRICEBOT" },
      });
      if (!existing) {
        const pd = safeJson(priceBotLog.payload);
        if (pd) {
          const pv = pd.price_validation || {};
          await prisma.priceSnapshot.create({
            data: {
              itemId,
              source: "PRICEBOT",
              priceLow: pv.revised_low != null ? Math.round(Number(pv.revised_low)) : null,
              priceHigh: pv.revised_high != null ? Math.round(Number(pv.revised_high)) : null,
              priceMedian: pv.revised_mid != null ? Math.round(Number(pv.revised_mid)) : null,
              confidence: pd.data_quality ? String(pd.data_quality).slice(0, 200) : null,
              rawPayload: priceBotLog.payload,
              createdAt: priceBotLog.createdAt,
            },
          });
        }
      }
    }

    // ── Create PriceSnapshot from RAINFOREST_RESULT ──
    const rainforestLog = await prisma.eventLog.findFirst({
      where: { itemId, eventType: "RAINFOREST_RESULT" },
      orderBy: { createdAt: "desc" },
    });
    if (rainforestLog?.payload) {
      const existing = await prisma.priceSnapshot.findFirst({
        where: { itemId, source: "RAINFOREST" },
      });
      if (!existing) {
        const rd = safeJson(rainforestLog.payload);
        if (rd?.priceRange) {
          await prisma.priceSnapshot.create({
            data: {
              itemId,
              source: "RAINFOREST",
              priceLow: rd.priceRange.low != null ? Math.round(Number(rd.priceRange.low)) : null,
              priceHigh: rd.priceRange.high != null ? Math.round(Number(rd.priceRange.high)) : null,
              priceMedian: rd.priceRange.avg != null ? Math.round(Number(rd.priceRange.avg)) : null,
              confidence: rd.resultCount ? `${rd.resultCount} Amazon listings` : null,
              rawPayload: rainforestLog.payload,
              createdAt: rainforestLog.createdAt,
            },
          });
        }
      }
    }
  } catch (err: any) {
    console.error(`[backfill] Failed for item ${itemId}:`, err.message || err);
  }
}

/**
 * Backfill all items in the database.
 */
export async function backfillAllItems(): Promise<{ total: number; processed: number }> {
  try {
    const items = await prisma.item.findMany({ select: { id: true } });
    const total = items.length;
    let processed = 0;

    for (const item of items) {
      await backfillItemIntelligence(item.id);
      processed++;
      if (processed % 10 === 0 || processed === total) {
        console.log(`[backfill] Backfilled ${processed} of ${total} items`);
      }
    }

    console.log(`[backfill] Complete — ${processed} of ${total} items processed`);
    return { total, processed };
  } catch (err: any) {
    console.error("[backfill] Failed:", err.message || err);
    return { total: 0, processed: 0 };
  }
}
