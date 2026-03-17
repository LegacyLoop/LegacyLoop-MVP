import { NextRequest, NextResponse } from "next/server";
import { getItemEnrichmentContext } from "@/lib/enrichment";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const enrichment = await getItemEnrichmentContext(itemId);
    return NextResponse.json({
      priorRunCount: enrichment.summary.priorRunCount,
      confidenceLevel: enrichment.summary.confidenceLevel,
      hasEnrichment: enrichment.hasEnrichment,
      sources: {
        analyzeBot: !!enrichment.summary.analyzeBotFindings,
        priceBot: !!enrichment.summary.priceBotFindings,
        antiqueBot: !!enrichment.summary.antiqueBotFindings,
        collectiblesBot: !!enrichment.summary.collectiblesBotFindings,
        carBot: !!enrichment.summary.carBotFindings,
        reconBot: !!enrichment.summary.reconBotFindings,
        listBot: !!enrichment.summary.listBotFindings,
        buyerBot: !!enrichment.summary.buyerBotFindings,
        photoBot: !!enrichment.summary.photoBotFindings,
        megaBot: !!enrichment.summary.megaBotFindings,
      },
    });
  } catch {
    return NextResponse.json({
      priorRunCount: 0,
      confidenceLevel: "none",
      hasEnrichment: false,
    });
  }
}
