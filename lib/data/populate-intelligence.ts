/**
 * Data Foundation — Forward-Looking Intelligence Populator
 *
 * Called after bot runs to populate structured fields on Item.
 * Also creates PriceSnapshot records for pricing history.
 *
 * All functions: fire-and-forget, try/catch, never throw.
 */

import { prisma } from "@/lib/db";

/**
 * Populate structured Item fields from AI analysis output.
 * Only updates fields that are currently null.
 */
export async function populateFromAnalysis(
  itemId: string,
  aiResult: Record<string, unknown>
): Promise<void> {
  try {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: {
        category: true,
        brand: true,
        era: true,
        material: true,
        maker: true,
        itemStyle: true,
        countryOfOrigin: true,
        conditionGrade: true,
      },
    });
    if (!item) return;

    const updates: Record<string, string> = {};

    if (!item.category && aiResult.category) updates.category = String(aiResult.category);
    if (!item.brand && aiResult.brand) updates.brand = String(aiResult.brand);
    if (!item.era && aiResult.era) updates.era = String(aiResult.era);
    if (!item.material && aiResult.material) updates.material = String(aiResult.material);
    if (!item.maker && aiResult.maker) updates.maker = String(aiResult.maker);
    if (!item.itemStyle && aiResult.style) updates.itemStyle = String(aiResult.style);
    if (!item.countryOfOrigin && aiResult.country_of_origin) updates.countryOfOrigin = String(aiResult.country_of_origin);
    if (!item.conditionGrade && aiResult.condition_guess) updates.conditionGrade = String(aiResult.condition_guess);

    if (Object.keys(updates).length > 0) {
      await prisma.item.update({ where: { id: itemId }, data: updates });
      console.log(`[populate] Updated ${Object.keys(updates).length} intelligence fields for item ${itemId}`);
    }
  } catch (err: any) {
    console.error(`[populate] populateFromAnalysis failed for ${itemId}:`, err.message || err);
  }
}

/**
 * Create a PriceSnapshot from PriceBot results.
 */
export async function populateFromPriceBot(
  itemId: string,
  priceBotPayload: Record<string, unknown>
): Promise<void> {
  try {
    const pv = (priceBotPayload.price_validation || {}) as Record<string, unknown>;

    await prisma.priceSnapshot.create({
      data: {
        itemId,
        source: "PRICEBOT",
        priceLow: pv.revised_low != null ? Math.round(Number(pv.revised_low)) : null,
        priceHigh: pv.revised_high != null ? Math.round(Number(pv.revised_high)) : null,
        priceMedian: pv.revised_mid != null ? Math.round(Number(pv.revised_mid)) : null,
        confidence: priceBotPayload.data_quality ? String(priceBotPayload.data_quality).slice(0, 200) : null,
      },
    });
    console.log(`[populate] PriceSnapshot PRICEBOT created for item ${itemId}`);
  } catch (err: any) {
    console.error(`[populate] populateFromPriceBot failed for ${itemId}:`, err.message || err);
  }
}

/**
 * Create a PriceSnapshot from Rainforest/Amazon results.
 */
export async function populateFromRainforest(
  itemId: string,
  rainforestPayload: Record<string, unknown>
): Promise<void> {
  try {
    const pr = (rainforestPayload.priceRange || {}) as Record<string, unknown>;
    if (!pr.low && !pr.high) return;

    await prisma.priceSnapshot.create({
      data: {
        itemId,
        source: "RAINFOREST",
        priceLow: pr.low != null ? Math.round(Number(pr.low)) : null,
        priceHigh: pr.high != null ? Math.round(Number(pr.high)) : null,
        priceMedian: pr.avg != null ? Math.round(Number(pr.avg)) : null,
        confidence: rainforestPayload.resultCount ? `${rainforestPayload.resultCount} Amazon listings` : null,
      },
    });
    console.log(`[populate] PriceSnapshot RAINFOREST created for item ${itemId}`);
  } catch (err: any) {
    console.error(`[populate] populateFromRainforest failed for ${itemId}:`, err.message || err);
  }
}

/**
 * Record the actual sold price when an item is marked SOLD.
 */
export async function populateSoldPrice(
  itemId: string,
  soldPrice: number,
  soldAt: Date
): Promise<void> {
  try {
    await prisma.item.update({
      where: { id: itemId },
      data: {
        soldPrice: Math.round(soldPrice),
        soldAt,
      },
    });
    console.log(`[populate] Sold price $${soldPrice} recorded for item ${itemId}`);
  } catch (err: any) {
    console.error(`[populate] populateSoldPrice failed for ${itemId}:`, err.message || err);
  }
}
