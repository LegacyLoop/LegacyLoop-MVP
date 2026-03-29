import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import OpenAI from "openai";
import { getItemEnrichmentContext } from "@/lib/enrichment";
import { logUserEvent } from "@/lib/data/user-events";
import { isDemoMode, canUseBotOnTier, BOT_CREDIT_COSTS } from "@/lib/constants/pricing";
import { checkCredits, deductCredits, hasPriorBotRun } from "@/lib/credits";
import fs from "fs";
import path from "path";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function safeJson(s: string | null | undefined): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

/**
 * GET /api/bots/listbot/[itemId]
 * Retrieve existing ListBot result for an item
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { itemId } = await params;

    const item = await prisma.item.findUnique({ where: { id: itemId }, select: { userId: true } });
    if (!item || item.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const existing = await prisma.eventLog.findFirst({
      where: { itemId, eventType: "LISTBOT_RESULT" },
      orderBy: { createdAt: "desc" },
    });

    if (!existing) return NextResponse.json({ hasResult: false, result: null });

    return NextResponse.json({
      hasResult: true,
      result: safeJson(existing.payload),
      createdAt: existing.createdAt,
    });
  } catch (e) {
    console.error("[listbot GET]", e);
    return NextResponse.json({ error: "Failed to fetch ListBot result" }, { status: 500 });
  }
}

/**
 * POST /api/bots/listbot/[itemId]
 * Run dedicated ListBot listing generation
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { itemId } = await params;

    // ── Tier + Credit Gate ──
    if (!isDemoMode()) {
      if (!canUseBotOnTier(user.tier, "listBot")) {
        return NextResponse.json({ error: "upgrade_required", message: "Upgrade your plan to access ListBot.", upgradeUrl: "/pricing?upgrade=true" }, { status: 403 });
      }
      const isRerun = await hasPriorBotRun(user.id, itemId, "LISTBOT");
      const cost = isRerun ? BOT_CREDIT_COSTS.singleBotReRun : BOT_CREDIT_COSTS.singleBotRun;
      const cc = await checkCredits(user.id, cost);
      if (!cc.hasEnough) {
        return NextResponse.json({ error: "insufficient_credits", message: "Not enough credits to run ListBot.", balance: cc.balance, required: cost, buyUrl: "/credits" }, { status: 402 });
      }
      await deductCredits(user.id, cost, isRerun ? "ListBot re-run" : "ListBot run", itemId);
    }

    const body = await req.json().catch(() => ({}));
    const generateHeroImage = body.generateHeroImage === true;

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        aiResult: true,
        valuation: true,
        antiqueCheck: true,
        photos: { orderBy: { order: "asc" }, take: 6 },
      },
    });

    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (item.userId !== user.id) return NextResponse.json({ error: "Not your item" }, { status: 403 });

    const ai = safeJson(item.aiResult?.rawJson);
    const v = item.valuation;

    if (!ai || !v) {
      return NextResponse.json({ error: "Run AI analysis first" }, { status: 400 });
    }

    // Gather context from all available intelligence
    const itemName = ai.item_name || item.title || "Unknown item";
    const category = ai.category || "General";
    const subcategory = ai.subcategory || "";
    const material = ai.material || "Unknown";
    const era = ai.era || ai.estimated_age || "Unknown";
    const style = ai.style || "";
    const brand = ai.maker || ai.brand || "";
    const condScore = ai.condition_score || 7;
    const condLabel = condScore >= 8 ? "Excellent" : condScore >= 5 ? "Good" : "Fair";
    const lowPrice = Math.round(v.low);
    const highPrice = Math.round(v.high);
    const midPrice = v.mid ? Math.round(v.mid) : Math.round((v.low + v.high) / 2);
    const sellerZip = item.saleZip || "04901";
    const isAntique = item.antiqueCheck?.isAntique || false;
    const photoCount = item.photos.length;
    const sellerPrice = item.listingPrice ? Number(item.listingPrice) : null;

    // Build vision content from item photos (base64 for API access)
    const photoImageContent: Array<{ type: "input_image"; image_url: string; detail: "auto" }> = [];
    for (const p of item.photos) {
      try {
        const absPhotoPath = path.join(process.cwd(), "public", p.filePath);
        if (fs.existsSync(absPhotoPath)) {
          const photoBuf = fs.readFileSync(absPhotoPath);
          const photoExt = path.extname(p.filePath).toLowerCase();
          const photoMime = photoExt === ".png" ? "image/png" : photoExt === ".webp" ? "image/webp" : "image/jpeg";
          photoImageContent.push({
            type: "input_image",
            image_url: `data:${photoMime};base64,${photoBuf.toString("base64")}`,
            detail: "auto",
          });
        }
      } catch {
        // Skip unreadable photos — non-fatal
      }
    }

    // ── CROSS-BOT ENRICHMENT (single source of truth — replaces direct EventLog fetches) ──
    const enrichment = await getItemEnrichmentContext(itemId, "listbot").catch(() => null);
    const enrichmentPrefix = enrichment?.hasEnrichment ? enrichment.contextBlock + "\n\n" : "";

    // Extract key values from enrichment summary (consolidated from PriceBot, BuyerBot, Amazon)
    const priceBotFindings = enrichment?.summary?.priceBotFindings || "";
    const buyerBotFindings = enrichment?.summary?.buyerBotFindings || "";
    const amazonFindings = enrichment?.summary?.amazonFindings || "";
    const bestPlatform = priceBotFindings.match(/Best Platform:\s*([^·\n]+)/)?.[1]?.trim() || "";
    const targetBuyers = buyerBotFindings.match(/\d+\s*leads?\b/i)?.[0] || "";
    const valueDrivers = "";
    const searchKeywords = "";
    const amazonContext = amazonFindings ? `\nAMAZON CONTEXT: ${amazonFindings}` : "";

    // ── LISTBOT PROMPT ──
    const systemPrompt = enrichmentPrefix + `You are a world-class copywriter and social media marketing expert specializing in resale, antiques, and e-commerce. You've written 50,000+ listings that have sold millions of dollars worth of items. You know every platform's algorithm, character limits, best practices, and buyer psychology.

You are creating listings for: ${itemName} — ${category}${subcategory ? ` — ${subcategory}` : ""}
Condition: ${condLabel} (${condScore}/10)
Material: ${material}
Era: ${era}
Style: ${style}
Brand/Maker: ${brand}
Seller location: ZIP ${sellerZip} (Maine, USA)
Recommended price: $${midPrice} (range: $${lowPrice} — $${highPrice})
${sellerPrice !== null ? `SELLER ASKING PRICE: $${sellerPrice} — Use this as the anchor price in all listing copy. Do not suggest a different price.` : `SELLER ASKING PRICE: Not set — use AI valuation range: $${lowPrice}–$${highPrice}`}
${bestPlatform ? `Best platforms: ${bestPlatform}` : ""}
${targetBuyers ? `Target buyers: ${targetBuyers}` : ""}
${valueDrivers ? `Value drivers: ${valueDrivers}` : ""}
${searchKeywords ? `Keywords buyers search: ${searchKeywords}` : ""}${amazonContext}
Photos available: ${photoCount} photos uploaded

Create PERFECT, ready-to-post listings for EVERY relevant platform. Each listing must be optimized for that specific platform's format, audience, algorithm, and best practices.

Return a JSON object with this exact structure:

{
  "hero_image_prompt": "A detailed DALL-E prompt for a professional-looking hero image. Describe ideal composition, clean background, professional lighting, styled presentation. Keep realistic.",

  "listings": {
    "ebay": {
      "title": "Max 80 chars, keyword-optimized",
      "subtitle": "55-char optional subtitle",
      "description_html": "Full HTML description 500-1500 words with headers, bullets, bold specs",
      "condition_tag": "Used | Like New | New | For Parts",
      "item_specifics": { "Brand": "", "Material": "", "Era": "", "Color": "", "Style": "" },
      "category_suggestion": "eBay category",
      "starting_price": ${midPrice},
      "buy_it_now_price": ${Math.round(highPrice * 1.05)},
      "auction_vs_fixed": "Auction | Fixed Price",
      "shipping_template": "Free shipping | Calculated | Flat rate",
      "best_offer_enabled": true,
      "minimum_offer": ${Math.round(lowPrice * 0.85)},
      "listing_duration": "7 | 10 | 30 | GTC",
      "scheduling_tip": "Best day/time",
      "seo_keywords": ["keywords"]
    },
    "facebook_marketplace": {
      "title": "Max 100 chars, conversational",
      "description": "Plain text 300-600 words, casual tone",
      "price": ${midPrice},
      "condition_tag": "New | Used - Like New | Used - Good | Used - Fair",
      "category": "FB category",
      "tags": ["tags"],
      "location_note": "Pickup location",
      "negotiation_note": "Price firm | OBO"
    },
    "facebook_groups": {
      "post_text": "100-300 words, friendly buy/sell/trade post",
      "suggested_groups": ["group names"],
      "hashtags": ["hashtags"],
      "best_time_to_post": "timing"
    },
    "instagram": {
      "caption": "Max 2200 chars, storytelling, line breaks, price, CTA",
      "hashtags": ["30 relevant hashtags"],
      "story_text": "1-2 sentences for Stories",
      "reel_concept": "15-30 sec Reel concept",
      "posting_tip": "timing and format advice"
    },
    "tiktok": {
      "video_concept": "30-60 sec concept with hook",
      "caption": "Max 300 chars with hashtags",
      "hashtags": ["trending hashtags"],
      "hook_line": "Attention-grabbing first line",
      "trend_tie_in": "Current trend connection"
    },
    "etsy": {
      "title": "Max 140 chars, keyword-rich",
      "description": "800-2000 words, story + details + craftsmanship",
      "tags": ["13 tags max"],
      "category_path": "Etsy category",
      "price": ${Math.round(highPrice * 1.05)},
      "shipping_profile": "Calculated | Free | Flat rate",
      "materials_list": ["materials"],
      "style_tags": ["Vintage | Antique | etc"],
      "renewal_tip": "Auto-renew advice"
    },
    "craigslist": {
      "title": "Max 70 chars, includes price",
      "body": "Plain text 200-400 words, no-nonsense",
      "price": ${midPrice},
      "category": "CL section",
      "location_area": "area description",
      "safety_tip": "meeting advice"
    },
    "mercari": {
      "title": "Max 40 chars",
      "description": "300-600 words with measurements",
      "price": ${midPrice},
      "brand": "${brand || "Unbranded"}",
      "condition_tag": "New | Like New | Good | Fair | Poor",
      "shipping": "Prepaid | Ship on your own",
      "smart_pricing": true,
      "offer_button": true
    },
    "offerup": {
      "title": "Max 100 chars, local-focused",
      "description": "200-400 words, pickup focus",
      "price": ${Math.round(midPrice * 0.95)},
      "condition_tag": "New | Used - Like New | Used - Good | Used - Fair",
      "firm_on_price": false,
      "delivery_method": "Pickup | Shipping | Both"
    },
    "poshmark": {
      "title": "Max 80 chars",
      "description": "300-500 words, lifestyle tone",
      "price": ${midPrice},
      "brand": "${brand || "Vintage"}",
      "category": "Poshmark category",
      "size": "One Size",
      "cover_shot_tip": "Best cover photo advice"
    }
  },

  "cross_platform_strategy": {
    "posting_order": ["platform order with reasoning"],
    "price_differentiation": "Should prices differ by platform?",
    "exclusivity_windows": "Post on one first?",
    "cross_promotion": "How to drive traffic between platforms",
    "removal_strategy": "When to remove after selling"
  },

  "photo_strategy": {
    "hero_image": "Which photo makes best main image",
    "photo_order": "Recommended order",
    "photos_needed": ["additional photos that would help"],
    "editing_tips": ["crop, brightness, background tips"],
    "platform_specific_photos": {
      "ebay": "White background, all angles",
      "instagram": "Lifestyle context, warm lighting",
      "facebook": "Casual but clear, full item first"
    }
  },

  "seo_master": {
    "primary_keywords": ["top 5 keywords"],
    "long_tail_keywords": ["specific search phrases"],
    "trending_keywords": ["currently trending terms"],
    "keywords_to_avoid": ["oversaturated terms"]
  },

  "pricing_strategy_per_platform": {
    "highest_price_platform": "Where and why",
    "lowest_price_platform": "Where and why",
    "negotiation_platforms": "Where to price 10-15% higher",
    "firm_price_platforms": "Where firm pricing works"
  },

  "auto_post_readiness": {
    "platforms_ready": ["platforms 100% ready"],
    "platforms_need_tweaks": ["platforms needing customization"],
    "estimated_time_to_post_all": "time estimate"
  },

  "executive_summary": "4-6 sentences for the seller. Strategy, timeline, single most important action."
}

IMPORTANT:
- Every listing must be READY TO COPY AND PASTE. Full, complete text.
- Respect each platform's character limits strictly.
- Match platform tone: eBay=professional, Facebook=casual, Instagram=storytelling, TikTok=fun/hook, Etsy=artisan, Craigslist=no-nonsense.
- Use REAL prices from the data above, not placeholders.
- ${isAntique ? "This IS an antique: emphasize history, provenance, collector value." : ""}
- SEO: every title must include terms buyers actually search for.
- All prices in USD.`;

    let listbotResult: any;
    let webSources: Array<{ url: string; title: string }> = [];

    if (openai) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120_000);
      try {
        const photoDescs = item.photos.map((p) =>
          `[Photo: ${p.filePath}${p.caption ? ` — ${p.caption}` : ""}]`
        );

        const inputText = `Create complete, ready-to-post listings for every platform. Photos: ${photoDescs.join(", ")}. Return ONLY valid JSON.`;

        const response = await openai.responses.create({
          model: "gpt-4o-mini",
          instructions: systemPrompt,
          input: photoImageContent.length > 0
            ? [{
                role: "user" as const,
                content: [
                  { type: "input_text" as const, text: inputText },
                  ...photoImageContent,
                ],
              }]
            : inputText,
          tools: [{ type: "web_search_preview" } as any],
          max_output_tokens: 8192,
        }, { signal: controller.signal });

        const text = typeof response.output === "string"
          ? response.output
          : response.output_text || JSON.stringify(response.output);

        // Extract web sources from response
        webSources = [];
        try {
          const outputArr = Array.isArray(response.output) ? response.output : [];
          for (const outItem of outputArr) {
            if ((outItem as any).type === "web_search_call" && Array.isArray((outItem as any).results)) {
              for (const r of (outItem as any).results) {
                if (r.url && r.title) webSources.push({ url: r.url, title: r.title });
              }
            }
            if ((outItem as any).type === "message" && Array.isArray((outItem as any).content)) {
              for (const c of (outItem as any).content) {
                if (c.annotations) {
                  for (const ann of c.annotations) {
                    if (ann.type === "url_citation" && ann.url) webSources.push({ url: ann.url, title: ann.title || ann.url });
                  }
                }
              }
            }
          }
        } catch { /* citation extraction non-critical */ }

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          listbotResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON in response");
        }
      } catch (aiErr: any) {
        console.error("[listbot] OpenAI error:", aiErr);
        return NextResponse.json({ error: `ListBot AI analysis failed: ${aiErr?.message ?? String(aiErr)}` }, { status: 422 });
      } finally {
        clearTimeout(timeoutId);
      }
    } else {
      listbotResult = generateDemoResult(itemName, category, subcategory, material, era, style, brand, condScore, condLabel, lowPrice, midPrice, highPrice, sellerZip, isAntique, photoCount);
      listbotResult._isDemo = true;
    }

    // Validate top-level fields
    const requiredKeys = [
      "listings", "cross_platform_strategy", "photo_strategy",
      "seo_master", "pricing_strategy_per_platform", "auto_post_readiness",
      "executive_summary",
    ];
    for (const key of requiredKeys) {
      if (listbotResult[key] === undefined) listbotResult[key] = null;
    }
    // Add web sources if captured
    if (webSources.length > 0) {
      listbotResult.web_sources = webSources;
    }

    // Optional DALL-E hero image generation
    let heroImageUrl: string | null = null;
    if (generateHeroImage && openai && listbotResult.hero_image_prompt) {
      try {
        const imageResp = await openai.images.generate({
          model: "dall-e-3",
          prompt: listbotResult.hero_image_prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        });
        heroImageUrl = imageResp.data?.[0]?.url || null;
      } catch (imgErr) {
        console.error("[listbot] DALL-E error (skipping):", imgErr);
      }
    }

    if (heroImageUrl) {
      listbotResult._heroImageUrl = heroImageUrl;
    }

    // Store in EventLog
    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "LISTBOT_RESULT",
        payload: JSON.stringify(listbotResult),
      },
    });

    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "LISTBOT_RUN",
        payload: JSON.stringify({ userId: user.id, timestamp: new Date().toISOString() }),
      },
    });

    // Fire-and-forget: log user event
    logUserEvent(user.id, "BOT_RUN", { itemId, metadata: { botType: "LISTBOT", success: true } }).catch(() => null);

    return NextResponse.json({
      success: true,
      result: listbotResult,
      heroImageUrl,
      isDemo: !!listbotResult._isDemo,
    });
  } catch (e) {
    console.error("[listbot POST]", e);
    return NextResponse.json({ error: "ListBot generation failed" }, { status: 500 });
  }
}

// ── Demo Result Generator ──────────────────────────────────────────────────

function generateDemoResult(
  itemName: string, category: string, subcategory: string,
  material: string, era: string, style: string, brand: string,
  condScore: number, condLabel: string,
  low: number, mid: number, high: number,
  zip: string, isAntique: boolean, photoCount: number,
) {
  const cat = category.toLowerCase();
  const brandStr = brand || "Vintage";
  const shortName = itemName.length > 40 ? itemName.slice(0, 37) + "..." : itemName;
  const ebayPrice = Math.round(high * 1.05);
  const etsyPrice = Math.round(high * 1.08);
  const fbPrice = mid;
  const clPrice = Math.round(mid * 0.95);
  const mercariPrice = mid;
  const offerUpPrice = Math.round(mid * 0.95);
  const poshPrice = mid;

  return {
    _isDemo: true,
    hero_image_prompt: `Professional product photo of a ${era} ${material} ${cat} (${itemName}) on a clean white background with soft warm lighting, slight depth of field, styled presentation, high-end catalog aesthetic. Show the item's best angles and craftsmanship details.`,

    listings: {
      ebay: {
        title: truncate(`${brandStr} ${itemName} ${era} ${material} ${condLabel} Condition`, 80),
        subtitle: truncate(`Beautiful ${cat} piece — ${condLabel} condition — Ships fast`, 55),
        description_html: `<h2>${itemName}</h2>
<p>Beautiful ${era} ${material} ${cat} in ${condLabel.toLowerCase()} condition. ${isAntique ? "A genuine antique with collector appeal." : "A quality piece with plenty of life left."}</p>
<h3>Details</h3>
<ul>
<li><strong>Item:</strong> ${itemName}</li>
<li><strong>Category:</strong> ${category}${subcategory ? ` > ${subcategory}` : ""}</li>
<li><strong>Material:</strong> ${material}</li>
<li><strong>Era/Age:</strong> ${era}</li>
${style ? `<li><strong>Style:</strong> ${style}</li>` : ""}
${brand ? `<li><strong>Brand/Maker:</strong> ${brand}</li>` : ""}
<li><strong>Condition:</strong> ${condLabel} (${condScore}/10)</li>
</ul>
<h3>Condition Notes</h3>
<p>This item is in ${condLabel.toLowerCase()} condition${condScore >= 8 ? " with minimal signs of wear" : condScore >= 5 ? " with normal age-appropriate wear" : " with visible wear consistent with age and use"}. Please review all photos carefully — what you see is what you get.</p>
<h3>Shipping</h3>
<p>Ships from Maine within 1-2 business days of payment. Carefully packaged with appropriate materials. Combined shipping available on multiple purchases.</p>
<h3>Returns</h3>
<p>30-day returns accepted. Item must be returned in same condition as received.</p>`,
        condition_tag: condScore >= 9 ? "Like New" : condScore >= 4 ? "Used" : "For Parts",
        item_specifics: {
          Brand: brand || "Unbranded",
          Material: material,
          Era: era,
          Color: "See Photos",
          Style: style || category,
        },
        category_suggestion: `${category} > ${subcategory || "Vintage"}`,
        starting_price: mid,
        buy_it_now_price: ebayPrice,
        auction_vs_fixed: isAntique ? "Auction" : "Fixed Price",
        shipping_template: mid > 100 ? "Free shipping" : "Calculated",
        best_offer_enabled: true,
        minimum_offer: Math.round(low * 0.85),
        listing_duration: isAntique ? "7 days" : "GTC",
        scheduling_tip: "List on Sunday evening 7-9 PM EST for maximum visibility in the first 24 hours.",
        seo_keywords: [itemName.split(" ").slice(0, 2).join(" "), category, material, era, "vintage", condLabel.toLowerCase(), brand].filter(Boolean).slice(0, 8),
      },

      facebook_marketplace: {
        title: truncate(`${itemName} — ${condLabel} Condition — ${isAntique ? "Antique" : "Great Deal"}`, 100),
        description: `${itemName} for sale!\n\nThis beautiful ${era} ${material} ${cat} is in ${condLabel.toLowerCase()} condition. ${isAntique ? "A genuine antique with character and history." : "Solid quality with lots of life left."}\n\nDetails:\n• Material: ${material}\n• Era: ${era}\n${brand ? `• Brand: ${brand}\n` : ""}• Condition: ${condLabel} (${condScore}/10)\n\nAsking $${fbPrice}${fbPrice > 50 ? " — price is negotiable for serious buyers" : " firm"}.\n\nLocated in central Maine. Can meet at a convenient public spot for pickup. Happy to answer any questions or send more photos!\n\nCash, Venmo, or Zelle accepted. No lowballers please — price is based on current market comparables.`,
        price: fbPrice,
        condition_tag: condScore >= 9 ? "Used - Like New" : condScore >= 5 ? "Used - Good" : "Used - Fair",
        category: category,
        tags: [cat, material.toLowerCase(), era.toLowerCase(), "vintage", "estate sale", "maine"].filter(Boolean),
        location_note: "Available in central Maine. Can meet at a public location.",
        negotiation_note: fbPrice > 50 ? "OBO — reasonable offers welcome" : "Price is firm",
      },

      facebook_groups: {
        post_text: `Hi everyone! 👋\n\nI have a beautiful ${itemName} that I'm looking to find a good home for.\n\n${isAntique ? "This is a genuine antique — " : ""}${era} ${material} piece in ${condLabel.toLowerCase()} condition. ${brand ? `Made by ${brand}.` : ""}\n\nAsking $${fbPrice}${fbPrice > 50 ? " or best offer" : ""}. Located in Maine — local pickup available or I can ship.\n\nMore photos and details available — just ask! 📸\n\nThanks for looking!`,
        suggested_groups: [
          "Maine Buy Sell Trade",
          `${category} Collectors & Enthusiasts`,
          `Vintage ${category} Buy/Sell/Trade`,
          "New England Antiques & Collectibles",
          isAntique ? "Antique Lovers Worldwide" : "Thrift & Resale Community",
        ],
        hashtags: [`#${cat.replace(/\s/g, "")}`, "#vintagefinds", "#estatesale", "#mainefinds", "#forsale"],
        best_time_to_post: "Saturday morning 9-11 AM when group engagement peaks",
      },

      instagram: {
        caption: `✨ New Find ✨\n\n${itemName}\n\nThis ${era} ${material} ${cat} tells a story. ${isAntique ? "Decades of history, craftsmanship that they just don't make anymore." : "Quality you can see and feel."}\n\n${condLabel} condition (${condScore}/10)${brand ? ` • Made by ${brand}` : ""}.\n\n💰 $${mid}\n📍 Maine\n📦 Ships nationwide\n\nDM to purchase or for more details!\n\n${isAntique ? "Every antique has a story. What chapter will you write next?" : "Quality finds deserve a good home. Is this the one?"}\n\n#vintagefinds #${cat.replace(/\s/g, "")} #antiqueshop #estatesale #mainefinds #vintagehome #resale #thriftfinds #homedecor #sustainableliving #vintage${category.replace(/\s/g, "")} #${material.toLowerCase().replace(/\s/g, "")} #shopsmall #buyused #treasurehunting #fleamarket #antiquestore #vintagestyle #interiordesign #farmhousestyle #midcentury #retro #oneofa kind #estatesalefinds #secondhand #upcycle #vintagelove #antiquelover #collectibles #rarefind`,
        hashtags: ["#vintagefinds", `#${cat.replace(/\s/g, "")}`, "#antiqueshop", "#estatesale", "#mainefinds", "#vintagehome", "#resale", "#thriftfinds", "#homedecor", "#sustainableliving", "#shopsmall", "#buyused", "#treasurehunting", "#fleamarket", "#antiquestore", "#vintagestyle", "#interiordesign", "#farmhousestyle", "#secondhand", "#upcycle", "#vintagelove", "#antiquelover", "#collectibles", "#rarefind", "#estatefinds", "#vintagedecor", "#handmade", "#oneofakind", "#retro", "#midcenturymodern"],
        story_text: `🔥 Just listed! ${shortName} — $${mid}. DM me to grab it before it's gone! Swipe up for details →`,
        reel_concept: `Open with a close-up of the ${material} texture/detail (3 sec hook: "You won't believe what I found..."). Pull back to reveal the full ${itemName}. Show condition details, any maker marks. End with price reveal: "$${mid} — link in bio." Use warm, vintage-style filter. Background music: chill acoustic or trending nostalgic sound.`,
        posting_tip: "Post Tuesday-Thursday at 11 AM or 7 PM. Use carousel (multiple photos) for 2x engagement over single image.",
      },

      tiktok: {
        video_concept: `Hook (0-3 sec): Close-up on the most interesting detail — "${isAntique ? "This is from the " + era + " era..." : "Look what I found..."}" Reveal (3-15 sec): Show full item from multiple angles. Story (15-40 sec): Share what makes it special — material, age, condition. Price reveal (40-50 sec): "Asking $${mid} — link in bio." CTA (50-60 sec): "Would you buy it? Comment below!"`,
        caption: truncate(`${isAntique ? "Found this " + era + " gem" : "Check this out"} 🔥 ${itemName} — $${mid} #vintagefinds #estatesale #resale #${cat.replace(/\s/g, "")} #thrift`, 300),
        hashtags: ["#vintagefinds", "#estatesale", "#resale", "#thrift", "#fleamarket", `#${cat.replace(/\s/g, "")}`, "#treasurehunting", "#whatifound", "#antiquetiktok", "#vintagetiktok"],
        hook_line: isAntique
          ? `You won't believe this is from the ${era} era...`
          : `I found this ${cat} gem and it's looking for a new home...`,
        trend_tie_in: "Connect to #ThriftFlip or #EstateHaul trends. Show the 'before' messy estate sale vibe, then the polished listing — transformation content performs well.",
      },

      etsy: {
        title: truncate(`${brandStr} ${itemName}, ${era} ${material} ${category}, ${isAntique ? "Antique" : "Vintage"} ${style || cat}`, 140),
        description: `${itemName}\n\nA beautiful ${era} ${material} ${cat} that brings character and warmth to any space.\n\n✦ DETAILS ✦\n• Item: ${itemName}\n• Category: ${category}${subcategory ? ` > ${subcategory}` : ""}\n• Material: ${material}\n• Era/Period: ${era}\n${style ? `• Style: ${style}\n` : ""}${brand ? `• Maker/Brand: ${brand}\n` : ""}• Condition: ${condLabel} (${condScore}/10)\n\n✦ CONDITION ✦\nThis piece is in ${condLabel.toLowerCase()} condition. ${condScore >= 8 ? "Minimal signs of wear — remarkably well-preserved for its age." : condScore >= 5 ? "Shows normal age-appropriate wear that adds to its character and authenticity." : "Shows wear consistent with age and use. Please review all photos carefully."}\n\n✦ THE STORY ✦\n${isAntique ? `This genuine antique dates to the ${era} era. ${material} construction of this quality is increasingly rare in today's market. It carries the patina and character that only decades of history can provide.` : `This ${era} piece represents quality craftsmanship in ${material}. ${brand ? `Made by ${brand}, known for their attention to detail.` : "A well-crafted piece that has stood the test of time."}`}\n\n✦ STYLING IDEAS ✦\nPerfect for farmhouse, cottage, traditional, or eclectic interiors. Pairs beautifully with other vintage pieces or adds character to a modern space.\n\n✦ SHIPPING ✦\nShips from Maine within 1-3 business days. Carefully packaged with protective materials. Combined shipping available.\n\n✦ SHOP POLICIES ✦\nReturns accepted within 14 days. Please message with any questions before purchasing — I'm happy to provide additional photos or measurements.\n\nThank you for visiting! Follow our shop for more curated vintage and antique finds.`,
        tags: [`vintage ${cat}`, material.toLowerCase(), era.toLowerCase(), isAntique ? "antique" : "vintage", style || cat, brand || "handmade", "home decor", "farmhouse", "estate sale", "one of a kind", "collectible", "retro", category.toLowerCase()].filter(Boolean).slice(0, 13),
        category_path: `${isAntique ? "Vintage" : "Home & Living"} > ${category}`,
        price: etsyPrice,
        shipping_profile: mid > 100 ? "Free" : "Calculated",
        materials_list: [material, ...(material.includes("Wood") ? ["solid wood"] : [])],
        style_tags: [isAntique ? "Antique" : "Vintage", style || "Traditional", era.includes("Century") ? "Period" : "Classic"].filter(Boolean),
        renewal_tip: "Auto-renew recommended. Etsy's algorithm favors renewed listings with fresh timestamps.",
      },

      craigslist: {
        title: truncate(`${itemName} - $${clPrice} (${isAntique ? "Antique" : condLabel})`, 70),
        body: `${itemName} for sale — $${clPrice}\n\n${condLabel} condition (${condScore}/10). ${material} ${cat} from the ${era} era.${brand ? ` Made by ${brand}.` : ""}\n\n${isAntique ? "Genuine antique with collector value. " : ""}Please see photos for exact condition.\n\nPrice: $${clPrice}${clPrice > 50 ? " or best reasonable offer" : " firm"}\nPickup: Central Maine\nPayment: Cash or Venmo\n\nSerious buyers only please. Can send additional photos via text.\n\nDo NOT contact me with unsolicited services or offers.`,
        price: clPrice,
        category: cat.includes("furniture") ? "furniture - by owner" : cat.includes("electronics") ? "electronics - by owner" : "general - by owner",
        location_area: "Central Maine / Waterville area",
        safety_tip: "Meet in a public place during daylight. Bring a friend if possible. Cash preferred.",
      },

      mercari: {
        title: truncate(`${brandStr} ${shortName} ${condLabel}`, 40),
        description: `${itemName}\n\n${condLabel} condition ${material} ${cat} from the ${era} era.${brand ? ` Brand: ${brand}.` : ""}\n\nCondition Details:\n${condScore >= 8 ? "Excellent — minimal wear, well-maintained" : condScore >= 5 ? "Good — normal wear for age, fully functional" : "Fair — shows wear, see photos for details"}\n\nWhat makes this special:\n${isAntique ? "• Genuine antique with collector appeal\n" : ""}• ${material} construction\n• ${era} era piece\n• ${condLabel} condition\n\nAll photos are of the actual item. Please ask any questions before purchasing!\n\nShips within 1-2 business days from Maine. Packaged carefully.`,
        price: mercariPrice,
        brand: brand || "Unbranded",
        condition_tag: condScore >= 9 ? "Like New" : condScore >= 5 ? "Good" : "Fair",
        shipping: "Ship on your own",
        smart_pricing: true,
        offer_button: true,
      },

      offerup: {
        title: truncate(`${itemName} — ${condLabel} — ${isAntique ? "Antique" : "Great Price"}`, 100),
        description: `${itemName} for sale!\n\n${material} ${cat} from the ${era} era. ${condLabel} condition.${brand ? ` ${brand}.` : ""}\n\n$${offerUpPrice}${offerUpPrice > 50 ? " — negotiable for serious buyers" : ""}.\n\nLocal pickup preferred — central Maine. Can deliver within 30 miles for an extra fee.\n\nMessage me for more photos or questions!`,
        price: offerUpPrice,
        condition_tag: condScore >= 9 ? "Used - Like New" : condScore >= 5 ? "Used - Good" : "Used - Fair",
        firm_on_price: false,
        delivery_method: "Both",
      },

      poshmark: {
        title: truncate(`${brandStr} ${shortName} ${era} ${condLabel}`, 80),
        description: `${itemName}\n\nA ${isAntique ? "stunning antique" : "beautiful vintage"} find! This ${era} ${material} ${cat} is ${condLabel.toLowerCase()} condition and ready for its next chapter.\n\n${brand ? `Brand: ${brand}\n` : ""}Material: ${material}\nEra: ${era}\nCondition: ${condLabel}\n\n${isAntique ? "Perfect for collectors or anyone who appreciates the craftsmanship of a bygone era." : "Great quality at a fraction of retail price."}\n\nBundle and save! Check out my other listings for more vintage finds.`,
        price: poshPrice,
        brand: brand || "Vintage",
        category: category,
        size: "One Size",
        cover_shot_tip: "Use a clean, well-lit photo with the full item visible. Lifestyle staging (item in a styled room) gets 40% more likes on Poshmark.",
      },
    },

    cross_platform_strategy: {
      posting_order: [
        `1. Facebook Marketplace first — fastest local response (expect messages within hours)`,
        `2. eBay next — largest buyer pool, ${isAntique ? "auction format for competitive bidding" : "Buy It Now for predictable pricing"}`,
        `3. Etsy — premium pricing for ${isAntique ? "antique" : "vintage"} buyers willing to pay more`,
        `4. Craigslist + OfferUp — local backup channels`,
        `5. Instagram + TikTok — social buzz and brand building`,
        `6. Mercari + Poshmark — catch remaining buyers`,
      ],
      price_differentiation: `Yes — Etsy ($${etsyPrice}) and eBay ($${ebayPrice}) can command 5-10% premium due to buyer expectations. Facebook/Craigslist/OfferUp should be priced 5% lower for quick local sales. Negotiation-heavy platforms (FB, CL) should be priced 10-15% above your minimum.`,
      exclusivity_windows: `Post on Facebook Marketplace first for 48-72 hours to test local demand. If no strong bites, expand to all platforms simultaneously.`,
      cross_promotion: "Mention your eBay/Etsy shop in Facebook posts. Share Instagram photos to Facebook Groups. Include your store link in all listings.",
      removal_strategy: "Once sold, remove from ALL platforms within 1 hour. Nothing damages credibility like a sold item still listed. Mark as sold/unavailable before deleting if platform allows.",
    },

    photo_strategy: {
      hero_image: `Use your clearest, most well-lit photo showing the full ${itemName} as the primary image on all platforms.`,
      photo_order: "1. Full item (hero), 2. Close-up of best feature, 3. Maker marks/labels, 4. Any wear/damage, 5. Size reference, 6. Lifestyle/staged shot",
      photos_needed: [
        `Close-up of ${material} texture and finish`,
        "Any maker's marks, labels, or stamps",
        `${condScore < 8 ? "Clear photos of any wear, scratches, or damage" : "Detail shots of craftsmanship"}`,
        "Size reference with common object (book, hand) for scale",
        photoCount < 4 ? "Additional angles — aim for 6+ photos total" : "You have good coverage!",
      ].filter(Boolean),
      editing_tips: [
        "Brightness: Increase by 10-15% for cleaner look",
        "Background: White or neutral preferred for eBay, lifestyle for Instagram",
        "Crop: Center the item, leave small border around edges",
        "Don't over-filter — buyers want to see actual condition",
      ],
      platform_specific_photos: {
        ebay: "White/neutral background, all angles including bottom/back, close-ups of any flaws. 7-12 photos ideal.",
        instagram: "Lifestyle context — item in a styled room setting. Warm, inviting lighting. Grid-worthy aesthetic.",
        facebook: "Casual but clear — first photo must show the whole item at a glance. Good natural lighting.",
      },
    },

    seo_master: {
      primary_keywords: [
        itemName.split(" ").slice(0, 3).join(" "),
        category,
        material,
        isAntique ? "antique" : "vintage",
        brand || era,
      ].filter(Boolean).slice(0, 5),
      long_tail_keywords: [
        `${era} ${material} ${cat}`,
        `vintage ${cat} for sale`,
        `${brand || "antique"} ${category.toLowerCase()}`,
        `${material.toLowerCase()} ${cat} ${condLabel.toLowerCase()} condition`,
        `estate sale ${cat} Maine`,
      ],
      trending_keywords: [
        "vintage home decor",
        "sustainable shopping",
        "estate sale finds",
        isAntique ? "antique collecting" : "thrift finds",
        "one of a kind",
      ],
      keywords_to_avoid: [
        "cheap", "used junk", "old stuff",
        "must sell", "desperate",
        "as-is no returns",
      ],
    },

    pricing_strategy_per_platform: {
      highest_price_platform: `Etsy ($${etsyPrice}) — Etsy buyers expect to pay premium for vintage/antique items and value the story behind the piece.`,
      lowest_price_platform: `OfferUp/Craigslist ($${offerUpPrice}) — Local buyers expect deals and will compare to retail alternatives.`,
      negotiation_platforms: "Facebook Marketplace, Craigslist, OfferUp — price 10-15% above your minimum to leave room for haggling.",
      firm_price_platforms: "eBay (Best Offer handles it), Etsy (buyers rarely negotiate), Mercari (offer button handles it automatically).",
    },

    auto_post_readiness: {
      platforms_ready: ["eBay", "Facebook Marketplace", "Craigslist", "Mercari", "OfferUp", "Poshmark"],
      platforms_need_tweaks: [
        "Etsy — review tags and add your shop-specific branding",
        "Instagram — customize caption with your personal story/voice",
        "TikTok — record the actual video using the concept provided",
        "Facebook Groups — join relevant groups first, check posting rules",
      ],
      estimated_time_to_post_all: "45-60 minutes to post on all 10 platforms manually. Copy-paste listings are ready — just add photos to each platform.",
    },

    executive_summary: `Your ${itemName} is ready for market! We've created optimized listings for 10 platforms. Start by posting on Facebook Marketplace at $${fbPrice} for quick local interest — expect messages within 24 hours. Simultaneously list on eBay at $${ebayPrice} to reach national buyers. ${isAntique ? `As an antique, Etsy at $${etsyPrice} could command the highest price from collectors.` : `Etsy at $${etsyPrice} can bring premium buyers willing to pay more.`} Your most important action right now: Post on Facebook Marketplace first — it's free, fast, and local buyers in Maine are actively searching. Expected timeline to sell: 1-3 weeks across all platforms.`,
  };
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 3).trim() + "...";
}
