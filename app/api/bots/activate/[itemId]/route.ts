/**
 * POST /api/bots/activate/[itemId]
 * Activates MegaBuying Bot for an item. Idempotent — returns existing bot if already active.
 * Generates 8 mock BuyerLead records and updates ItemEngagementMetrics.
 */
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { isDemoMode } from "@/lib/bot-mode";
import { safeJson } from "@/lib/utils/json";
import { canUseBotOnTier } from "@/lib/constants/pricing";

type Params = Promise<{ itemId: string }>;

const MOCK_LEADS = [
  {
    platform: "Facebook Groups",
    sourceType: "group_post",
    buyerName: "Patricia Hewitt",
    buyerHandle: "@pat_hewitt_maine",
    location: "Portland, ME",
    searchingFor: "Looking for Victorian silver tea sets for my collection — been searching 2 years",
    maxBudget: 2000,
    urgency: "high",
    matchScore: 96,
    matchReason: "Active Victorian silver collector, budget matches, local pickup preferred, posted in Maine Antiques group last week",
    aiConfidence: 0.94,
    botScore: 93,
  },
  {
    platform: "eBay Saved Searches",
    sourceType: "listing",
    buyerName: "Robert Langley",
    buyerHandle: "rl_collectibles_99",
    location: "Boston, MA",
    searchingFor: "Sheffield sterling silver tea service 1880s — saved search alert triggered",
    maxBudget: 2500,
    urgency: "medium",
    matchScore: 91,
    matchReason: "eBay power buyer (99.8% feedback), has bid on 4 similar items in past 6 months, price range aligns",
    aiConfidence: 0.91,
    botScore: 88,
  },
  {
    platform: "Reddit r/Antiques",
    sourceType: "forum",
    buyerName: "Claire Dunning",
    buyerHandle: "u/silverspoon_claire",
    location: "Bar Harbor, ME",
    searchingFor: "ISO Victorian silver tea service for upcoming wedding gift — flexible budget",
    maxBudget: 1800,
    urgency: "high",
    matchScore: 89,
    matchReason: "Posted ISO request in r/Antiques 3 days ago, specifically mentioned Sheffield hallmarks, local to Maine",
    aiConfidence: 0.88,
    botScore: 85,
  },
  {
    platform: "Craigslist",
    sourceType: "profile",
    buyerName: "Thomas Whitfield",
    buyerHandle: null,
    location: "Augusta, ME",
    searchingFor: "Estate sale silver — buying multiple pieces for resale, pay cash",
    maxBudget: 1500,
    urgency: "medium",
    matchScore: 84,
    matchReason: "Regular antique buyer in Maine, cash offers, frequently purchases estate silver for resale",
    aiConfidence: 0.82,
    botScore: 79,
  },
  {
    platform: "Facebook Marketplace",
    sourceType: "group_post",
    buyerName: "Jennifer Parsons",
    buyerHandle: "@jen_parsons_antiques",
    location: "Bangor, ME",
    searchingFor: "Gifting a silver tea set to my mother for her 70th birthday — need something special",
    maxBudget: 2200,
    urgency: "high",
    matchScore: 87,
    matchReason: "Actively messaging sellers, birthday gift creates strong urgency, budget flexible for right piece",
    aiConfidence: 0.86,
    botScore: 82,
  },
  {
    platform: "Etsy Favorites",
    sourceType: "listing",
    buyerName: "Margaret Oconnor",
    buyerHandle: "vintage_margaret",
    location: "New York, NY",
    searchingFor: "Favorited 6 Victorian silver tea sets on Etsy this month — serious collector",
    maxBudget: 3000,
    urgency: "low",
    matchScore: 82,
    matchReason: "High-value buyer, favorited similar items, no local pickup — will need shipping",
    aiConfidence: 0.80,
    botScore: 77,
  },
  {
    platform: "Nextdoor",
    sourceType: "group_post",
    buyerName: "Susan Kelley",
    buyerHandle: null,
    location: "Waterville, ME",
    searchingFor: "Any antique silver in the area? Looking for tea service for our B&B",
    maxBudget: 1600,
    urgency: "medium",
    matchScore: 78,
    matchReason: "Posted in local Nextdoor neighborhood, very close proximity, B&B purchase = motivated buyer",
    aiConfidence: 0.77,
    botScore: 74,
  },
  {
    platform: "Antique Forum",
    sourceType: "forum",
    buyerName: "David Marchetti",
    buyerHandle: "silversmith_dave",
    location: "Providence, RI",
    searchingFor: "Sheffield specialist — actively acquiring 1880s pieces for museum donation program",
    maxBudget: 4000,
    urgency: "low",
    matchScore: 85,
    matchReason: "Expert collector with museum connections, highest budget, may take time to respond but serious interest",
    aiConfidence: 0.83,
    botScore: 80,
  },
];

// Vehicle-specific mock leads (Maine-focused dealers and private buyers)
function getVehicleLeads(make: string, model: string) {
  const vehicleDesc = `${make} ${model}`.trim() || "truck";
  return [
    {
      platform: "Facebook Marketplace",
      sourceType: "group_post",
      buyerName: "Mike's Auto Sales",
      buyerHandle: "@mikes_auto_lewiston",
      location: "Lewiston, ME",
      searchingFor: `Looking for used ${vehicleDesc} trucks — buying for lot inventory`,
      maxBudget: 13000,
      urgency: "medium",
      matchScore: 94,
      matchReason: `Active dealer buying ${make} trucks for resale, budget aligns with market value, local pickup`,
      aiConfidence: 0.92,
      botScore: 91,
    },
    {
      platform: "Craigslist",
      sourceType: "listing",
      buyerName: "Bangor Used Cars",
      buyerHandle: null,
      location: "Bangor, ME",
      searchingFor: `ISO clean ${vehicleDesc} 4x4 for our lot — prefer low rust`,
      maxBudget: 12000,
      urgency: "medium",
      matchScore: 90,
      matchReason: `Dealer actively posting 'wanted' ads for ${make} trucks, cash buyer, quick close`,
      aiConfidence: 0.90,
      botScore: 88,
    },
    {
      platform: "Facebook Marketplace",
      sourceType: "group_post",
      buyerName: "Portland Motor Group",
      buyerHandle: "@portland_motors",
      location: "Portland, ME",
      searchingFor: `Searching for work trucks with tow packages — ${vehicleDesc} preferred`,
      maxBudget: 14000,
      urgency: "low",
      matchScore: 88,
      matchReason: `Premium used dealer, willing to pay above market for clean ${make} trucks with tow package`,
      aiConfidence: 0.88,
      botScore: 86,
    },
    {
      platform: "Craigslist",
      sourceType: "profile",
      buyerName: "Dave R.",
      buyerHandle: null,
      location: "Augusta, ME",
      searchingFor: `Need a reliable ${vehicleDesc} for my landscaping business — cash ready`,
      maxBudget: 10000,
      urgency: "high",
      matchScore: 92,
      matchReason: `Private buyer with immediate need, cash in hand, 4x4 is essential for his business`,
      aiConfidence: 0.91,
      botScore: 89,
    },
    {
      platform: "Facebook Marketplace",
      sourceType: "group_post",
      buyerName: "Sarah T.",
      buyerHandle: "@sarah_t_maine",
      location: "Brunswick, ME",
      searchingFor: `Looking for a work truck for farm use — ${vehicleDesc} with 4WD`,
      maxBudget: 11000,
      urgency: "high",
      matchScore: 87,
      matchReason: "Needs 4WD truck for farm property, posted in Maine Trucks for Sale group 2 days ago",
      aiConfidence: 0.86,
      botScore: 84,
    },
    {
      platform: "AutoTrader",
      sourceType: "listing",
      buyerName: "Northeast Auto Traders",
      buyerHandle: "northeast_auto",
      location: "Scarborough, ME",
      searchingFor: `Buying ${make} trucks 2005-2012 — any condition considered`,
      maxBudget: 15000,
      urgency: "low",
      matchScore: 85,
      matchReason: `Volume buyer specializing in ${make} trucks, highest budget, willing to negotiate`,
      aiConfidence: 0.84,
      botScore: 82,
    },
    {
      platform: "Craigslist",
      sourceType: "profile",
      buyerName: "Jake M.",
      buyerHandle: null,
      location: "Waterville, ME",
      searchingFor: `Need a 4x4 truck for Maine winters — prefer ${vehicleDesc}`,
      maxBudget: 9000,
      urgency: "high",
      matchScore: 83,
      matchReason: "First-time truck buyer, needs 4WD for commute in winter, motivated and pre-approved for loan",
      aiConfidence: 0.82,
      botScore: 80,
    },
    {
      platform: "Facebook Marketplace",
      sourceType: "group_post",
      buyerName: "Tim's Trucks & SUVs",
      buyerHandle: "@tims_trucks_auburn",
      location: "Auburn, ME",
      searchingFor: `Always buying ${make} trucks — especially SuperCab and crew cab models`,
      maxBudget: 12500,
      urgency: "medium",
      matchScore: 86,
      matchReason: `Specialty truck dealer, consistent buyer, quick inspections, cash or check same day`,
      aiConfidence: 0.85,
      botScore: 83,
    },
  ];
}

export async function POST(_req: Request, { params }: { params: Params }) {
  const { itemId } = await params;
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Verify ownership
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { aiResult: true },
  });
  if (!item || item.userId !== user.id) {
    return new Response("Not found", { status: 404 });
  }

  // Tier gate: MegaBuying Bot requires DIY Seller+
  if (!isDemoMode()) {
    const botUser = await prisma.user.findUnique({ where: { id: user.id }, select: { tier: true } });
    if (!canUseBotOnTier(botUser?.tier ?? 1, "buyerBot")) {
      return Response.json(
        { error: "MegaBuying Bot requires DIY Seller tier or higher.", upgradeUrl: "/pricing", currentTier: botUser?.tier ?? 1 },
        { status: 403 }
      );
    }
  }

  // Determine if this item is a vehicle
  const aiObj = item.aiResult?.rawJson ? safeJson(item.aiResult.rawJson) : null;
  const isVehicle = aiObj?.category?.toLowerCase().includes("vehicle") || false;

  // Idempotent — return existing active bot
  const existingBot = await prisma.buyerBot.findFirst({
    where: { itemId, isActive: true },
    include: { leads: { orderBy: { matchScore: "desc" } } },
  });
  if (existingBot) {
    return Response.json({ ok: true, bot: existingBot, leads: existingBot.leads, existing: true });
  }

  const now = new Date();
  const nextScan = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  // Vehicle-specific bot configuration
  const vehiclePlatforms = ["Facebook Marketplace", "Craigslist", "AutoTrader", "Cars.com", "CarGurus"];
  const defaultPlatforms = ["Facebook", "eBay", "Reddit", "Craigslist", "Etsy", "Nextdoor", "Antique Forums", "Google Shopping"];

  // Create BuyerBot
  const bot = await prisma.buyerBot.create({
    data: {
      itemId,
      isActive: true,
      isMegaBot: true,
      platformsJson: JSON.stringify(isVehicle ? vehiclePlatforms : defaultPlatforms),
      radius: isVehicle ? 100 : 150,
      scansCompleted: 1,
      buyersFound: 8,
      outreachSent: 8,
      responsesReceived: 0,
      conversionsToSale: 0,
      lastScanAt: now,
      nextScanAt: nextScan,
    },
  });

  // In demo mode, use mock leads. In live mode, this would call real platform APIs.
  // See lib/bot-mode.ts for live mode connection points.
  const vehicleMake = aiObj?.vehicle_make || aiObj?.brand || "";
  const vehicleModel = aiObj?.vehicle_model || aiObj?.model || "";
  const leadData = isDemoMode()
    ? (isVehicle ? getVehicleLeads(vehicleMake, vehicleModel) : MOCK_LEADS)
    : (isVehicle ? getVehicleLeads(vehicleMake, vehicleModel) : MOCK_LEADS); // TODO: Replace with real API calls when BOT_MODE=live

  const leads = await Promise.all(
    leadData.map((lead) =>
      prisma.buyerLead.create({
        data: {
          botId: bot.id,
          itemId,
          ...lead,
        },
      })
    )
  );

  // Upsert engagement metrics
  await prisma.itemEngagementMetrics.upsert({
    where: { itemId },
    update: {
      botScans: { increment: 1 },
      buyersFound: { increment: 8 },
      outreachSent: { increment: 8 },
    },
    create: {
      itemId,
      totalViews: 1,
      botScans: 1,
      buyersFound: 8,
      outreachSent: 8,
    },
  });

  // Mark item megabotUsed
  await prisma.item.update({
    where: { id: itemId },
    data: { megabotUsed: true } as any,
  });

  return Response.json({ ok: true, bot, leads, existing: false });
}
