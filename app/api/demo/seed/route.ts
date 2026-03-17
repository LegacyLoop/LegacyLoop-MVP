/**
 * POST /api/demo/seed
 * Comprehensive investor demo seeder.
 * Creates 11 items, 2 projects, conversations, transactions, stories.
 * Safe to call multiple times — idempotent by item title.
 */
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { DIGITAL_TIERS, TIER_NUMBER_TO_KEY } from "@/lib/pricing/constants";

const PHOTOS = {
  laptop:    "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80",
  silverTea: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80",
  guitar:    "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&q=80",
  pokemon:   "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=800&q=80",
  dresser:   "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
  watch:     "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
  camera:    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80",
  vase:      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  painting:  "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80",
  typewriter:"https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
  f150:      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80",
};

// Stagger item creation over 2-3 weeks for realistic demo narrative
const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const now = Date.now();

const DEMO_ITEMS = [
  {
    title: "HP Envy 15 Laptop (2022)",
    condition: "Good — minor scratches on lid",
    description: "HP Envy 15 laptop with 11th gen Intel Core i7, 16GB RAM, 512GB SSD. Runs great, battery holds 4 hrs. Selling because I upgraded.",
    status: "LISTED" as const,
    saleMethod: "BOTH" as const,
    photo: PHOTOS.laptop,
    story: null,
    daysAgo: 8,
    ai: { item_name: "HP Envy 15 Laptop", category: "Electronics / Computers", brand: "HP", model: "Envy 15 (2022)", condition_guess: "Good", condition_score: 6, condition_cosmetic: 5, condition_functional: 7, material: "Aluminum chassis", era: "2020s", confidence: 0.88, keywords: ["laptop", "HP", "Envy", "i7", "16GB", "512GB SSD", "Windows 11"], notes: "Popular consumer laptop in good condition. High demand on secondary market.", estimated_value_low: 420, estimated_value_mid: 500, estimated_value_high: 580, pricing_confidence: 84, is_antique: false, best_platforms: ["eBay", "Facebook Marketplace", "Swappa"] },
    valuation: { low: 420, high: 580, confidence: 0.84, source: "AI + market comps", rationale: "HP Envy 15 i7/16GB laptops in Good condition sell for $420–580 on eBay. Strong demand from students and remote workers." },
    antique: false,
    listingPrice: 499,
    conversations: [
      { buyerName: "Chris L.", buyerEmail: null, platform: "Facebook Marketplace", botScore: 88, daysAgo: 3, messages: [{ sender: "buyer", content: "Is this still available? Does the charger come with it?" }, { sender: "seller", content: "Yes, still available! Original charger included plus a USB-C dock." }, { sender: "buyer", content: "Would you take $450?" }] },
    ],
    projectSlot: null,
    soldTx: null,
  },
  {
    title: "Victorian Sterling Silver Tea Service (c.1880s)",
    condition: "Excellent — original patina, no dents",
    description: "5-piece sterling silver tea service including teapot, creamer, sugar bowl, waste bowl, and tray. Hallmarked Sheffield 1883. Family heirloom from estate.",
    status: "INTERESTED" as const,
    saleMethod: "LOCAL_PICKUP" as const,
    photo: PHOTOS.silverTea,
    daysAgo: 18,
    story: "This tea service has been in our family for over 140 years. My great-great-grandmother received it as a wedding gift when she married in 1883. According to family letters, it was used every Sunday afternoon when company came to visit. The small dent on the sugar bowl lid happened during the blizzard of 1888 — grandmother always said it gave the set 'character.' It has passed from mother to daughter for five generations. Now our family is moving to a smaller home and we hope it will find a loving new home where it will continue to bring joy at special gatherings.",
    ai: { item_name: "Victorian Sterling Silver Tea Service", category: "Antiques / Silver", brand: "Sheffield", model: "5-Piece Tea Set", condition_guess: "Excellent", condition_score: 8, condition_cosmetic: 8, condition_functional: 9, material: "Sterling silver", era: "1880s", style: "Victorian", confidence: 0.92, keywords: ["sterling silver", "Victorian", "tea service", "Sheffield", "hallmarked", "antique", "1880s", "estate"], notes: "Rare 5-piece set with original hallmarks. Sheffield silver from this era is highly collectible. Original patina adds authenticity.", estimated_value_low: 1800, estimated_value_mid: 2500, estimated_value_high: 3200, pricing_confidence: 88, is_antique: true, estimated_age_years: 143, best_platforms: ["eBay", "Ruby Lane", "Chairish"] },
    valuation: { low: 1200, high: 2200, confidence: 0.87, source: "AI + antique specialist", rationale: "5-piece Sheffield sterling sets from 1880s command $1,200–2,200 at estate sales. Auction houses often achieve 20-40% above estate sale prices." },
    antique: true,
    auctionLow: 2800,
    auctionHigh: 4500,
    antiqueReason: "Hallmarked Sheffield sterling silver, c.1883. 5-piece set with original patina. Victorian-era silverware is highly sought by collectors.",
    listingPrice: null,
    projectSlot: "estate",
    soldTx: null,
    conversations: [
      { buyerName: "Sarah M.", buyerEmail: "sarah.m@example.com", platform: "Facebook Marketplace", botScore: 95, daysAgo: 7, messages: [{ sender: "buyer", content: "Oh wow, this is stunning! Is the full 5-piece set still together? I've been looking for a Victorian set like this for years." }, { sender: "seller", content: "Yes, all 5 pieces! The tray, teapot, creamer, sugar bowl, and waste bowl are all original. Would you like more photos of the hallmarks?" }, { sender: "buyer", content: "Yes please! Also — my appraiser friend says Sheffield hallmarks from the 1880s are quite valuable. Would you consider $1,500?" }, { sender: "buyer", content: "I can come this weekend if that works. I'm in the area Saturday afternoon." }] },
      { buyerName: "Mike T.", buyerEmail: null, platform: "Craigslist", botScore: 71, daysAgo: 5, messages: [{ sender: "buyer", content: "What is the lowest you will go on this?" }, { sender: "seller", content: "I can do $1,800 firm. This is a genuine 1883 Sheffield hallmarked set." }, { sender: "buyer", content: "Would you do $1,500 if I pick up cash today?" }] },
      { buyerName: "Bot_User_9182", buyerEmail: null, platform: "direct", botScore: 18, daysAgo: 4, messages: [{ sender: "buyer", content: "hello is this available i want to buy please send your email address and phone number CLICK HERE for more information" }] },
    ],
  },
  {
    title: "Fender Stratocaster Electric Guitar (1998)",
    condition: "Very Good — professional setup, case included",
    description: "1998 Mexican-made Fender Stratocaster in sunburst finish. Upgraded pickups (Seymour Duncan), pro setup last year. Includes original hard case. Gigged but well-cared-for.",
    status: "LISTED" as const,
    saleMethod: "BOTH" as const,
    photo: PHOTOS.guitar,
    daysAgo: 15,
    story: "I bought this Strat at age 18 with my first real paycheck from my summer job. It was the guitar I learned everything on — first chords, first songs, first band. We played every high school dance and town fair in southern Maine for six years. When I moved to Portland for work, the guitar came with me in the back seat, not the moving truck. Now my kids are grown and I don't play the way I used to. I hope whoever buys this takes it to as many stages as I did.",
    ai: { item_name: "Fender Stratocaster Electric Guitar", category: "Musical Instruments / Electric Guitars", brand: "Fender", model: "Stratocaster (MIM 1998)", condition_guess: "Very Good", condition_score: 7, condition_cosmetic: 7, condition_functional: 8, material: "Alder body, maple neck", era: "1990s", confidence: 0.91, keywords: ["Fender", "Stratocaster", "guitar", "electric", "sunburst", "Seymour Duncan", "MIM", "1998"], notes: "Mexican Stratocasters from the late 1990s are well-regarded. Upgraded pickups add value. Hard case included is a plus.", estimated_value_low: 380, estimated_value_mid: 465, estimated_value_high: 550, pricing_confidence: 89, is_antique: false, best_platforms: ["eBay", "Reverb", "Facebook Marketplace"] },
    valuation: { low: 380, high: 550, confidence: 0.89, source: "AI + eBay comps", rationale: "1998 MIM Stratocasters sell $350–500 stock; upgraded pickups add $80–150 value. Hard case adds $50+." },
    antique: false,
    listingPrice: null,
    projectSlot: "estate",
    soldTx: null,
    conversations: [
      { buyerName: "Alex P.", buyerEmail: null, platform: "Facebook Marketplace", botScore: 91, daysAgo: 5, messages: [{ sender: "buyer", content: "Is this still available? I'm looking for a good MIM Strat for my son who's learning guitar." }, { sender: "seller", content: "Still available! This one plays really well — the upgraded pickups make a big difference. Would be a great learning guitar." }, { sender: "buyer", content: "Awesome. Would you take $400 if I can pick up this weekend?" }] },
    ],
  },
  {
    title: "Pokémon Charizard Holo Fossil Set 1999 PSA 7",
    condition: "Near Mint — PSA graded 7",
    description: "1999 Fossil Set Charizard holo, PSA graded 7 (Near Mint). Certificate #28571892. One of the most iconic Pokémon cards ever made.",
    status: "LISTED" as const,
    saleMethod: "ONLINE_SHIPPING" as const,
    photo: PHOTOS.pokemon,
    daysAgo: 12,
    story: null,
    ai: { item_name: "Pokémon Charizard Holographic Card — Fossil Set", category: "Collectibles / Trading Cards", brand: "Nintendo / Game Freak", model: "1999 Fossil Set #4 Holo", condition_guess: "Near Mint", condition_score: 8, condition_cosmetic: 9, condition_functional: 10, material: "Cardstock", era: "1990s", confidence: 0.94, keywords: ["Pokémon", "Charizard", "holo", "1999", "Fossil", "PSA 7", "trading card", "collectible", "graded"], notes: "PSA-graded Charizard cards are among the most liquid collectibles. PSA 7 is solid mid-grade. Market has stabilized after 2021 peak.", estimated_value_low: 200, estimated_value_mid: 275, estimated_value_high: 350, pricing_confidence: 92, is_antique: false, best_platforms: ["eBay", "TCGPlayer", "Facebook Groups"] },
    valuation: { low: 220, high: 380, confidence: 0.91, source: "AI + PSA market data", rationale: "PSA 7 Fossil Charizards have been selling $240–360 consistently on eBay and PWCC auctions over the past 6 months." },
    antique: false,
    listingPrice: 299,
    projectSlot: "garage",
    soldTx: null,
    conversations: [],
  },
  {
    title: "Mid-Century Modern Walnut Dresser (1960s)",
    condition: "Good — light wear on top, all drawers work",
    description: "6-drawer solid walnut dresser in classic MCM style. Tapered legs, clean lines, dovetail joints. Some light scratching on top surface, easily refinished.",
    status: "SOLD" as const,
    saleMethod: "LOCAL_PICKUP" as const,
    photo: PHOTOS.dresser,
    daysAgo: 21,
    story: null,
    ai: { item_name: "Mid-Century Modern Walnut Dresser", category: "Furniture / Dressers", brand: "Unknown", model: "6-Drawer MCM Dresser", condition_guess: "Good", condition_score: 6, condition_cosmetic: 5, condition_functional: 7, material: "Solid walnut", era: "1960s", style: "Mid-Century Modern", confidence: 0.85, keywords: ["mid-century", "walnut", "dresser", "MCM", "1960s", "dovetail", "vintage", "tapered legs"], notes: "Solid walnut MCM pieces are in strong demand. Dovetail joints indicate quality construction. Light surface wear is common and acceptable.", estimated_value_low: 320, estimated_value_mid: 420, estimated_value_high: 520, pricing_confidence: 82, is_antique: false, best_platforms: ["Facebook Marketplace", "Chairish", "Craigslist"] },
    valuation: { low: 320, high: 520, confidence: 0.82, source: "AI + local market", rationale: "Solid walnut MCM dressers in Good condition sell $350–500 locally, often higher in coastal markets. Refinishing potential adds buyer interest." },
    antique: false,
    listingPrice: 425,
    projectSlot: "estate",
    soldTx: { amount: 425, description: "MCM Walnut Dresser sold — local pickup" },
    conversations: [],
  },
  {
    title: "Rolex Datejust 36mm (1987, ref. 16014)",
    condition: "Good — original dial, some case wear",
    description: "1987 Rolex Datejust 36mm reference 16014 in stainless steel. Silver dial with date window. Original bracelet with deployment clasp. Serviced 2021.",
    status: "LISTED" as const,
    saleMethod: "BOTH" as const,
    photo: PHOTOS.watch,
    daysAgo: 17,
    story: "My father wore this watch every day for 25 years, from the day he received it as a retirement gift until the day he passed. He was a high school math teacher in Waterville, and every student who sat in his front row knew this watch. He said it kept him on time for 25 years of classes and never let him down. Now it sits in a box and that feels wrong. It should be on a wrist, doing what it was made to do.",
    ai: { item_name: "Rolex Datejust 36mm Ref 16014", category: "Watches / Luxury", brand: "Rolex", model: "Datejust 36 (Ref 16014)", condition_guess: "Good", condition_score: 6, condition_cosmetic: 6, condition_functional: 8, material: "Stainless steel", era: "1980s", style: "Classic dress watch", confidence: 0.93, keywords: ["Rolex", "Datejust", "watch", "1987", "stainless steel", "automatic", "luxury", "ref 16014"], notes: "Reference 16014 is a classic Datejust variant. Original dial intact. Has been serviced. Case wear is cosmetically minor.", estimated_value_low: 4200, estimated_value_mid: 5500, estimated_value_high: 6800, pricing_confidence: 88, is_antique: false, estimated_age_years: 39, best_platforms: ["Chrono24", "eBay", "Bob's Watches"] },
    valuation: { low: 4200, high: 6800, confidence: 0.88, source: "AI + watch market data", rationale: "Rolex Datejust 16014 with original dial in Good condition trades $4,500–6,500 on Chrono24 and dealers. Recent service adds buyer confidence." },
    antique: false,
    listingPrice: 5500,
    projectSlot: "estate",
    soldTx: null,
    conversations: [
      { buyerName: "James Whitmore", buyerEmail: null, platform: "Craigslist", botScore: 87, messages: [{ sender: "buyer", content: "Is this watch still available? I'm a serious buyer in Bangor — would love to see it in person." }, { sender: "seller", content: "Yes still available. I can meet in Waterville or Augusta. Happy to show service records too." }, { sender: "buyer", content: "Perfect. I can do Saturday morning. What's the best price you can do?" }] },
    ],
  },
  {
    title: "Leica M6 Film Camera with 50mm Summicron",
    condition: "Excellent — light use, fully functional",
    description: "Leica M6 rangefinder camera (late production) with 50mm f/2 Summicron lens. Both in excellent condition. Comes with original caps, strap, and leather case.",
    status: "ANALYZED" as const,
    saleMethod: "ONLINE_SHIPPING" as const,
    photo: PHOTOS.camera,
    daysAgo: 10,
    story: null,
    ai: { item_name: "Leica M6 Film Camera with 50mm Summicron", category: "Photography / Film Cameras", brand: "Leica", model: "M6 (Late Production)", condition_guess: "Excellent", condition_score: 9, condition_cosmetic: 9, condition_functional: 10, material: "Brass, chrome", era: "1990s", confidence: 0.95, keywords: ["Leica", "M6", "film", "rangefinder", "50mm", "Summicron", "camera", "photography"], notes: "Leica M6 is the most sought-after Leica rangefinder. The 50mm Summicron is an iconic lens. Both in excellent condition together make this a premium package.", estimated_value_low: 2800, estimated_value_mid: 3500, estimated_value_high: 4200, pricing_confidence: 92, is_antique: false, best_platforms: ["eBay", "KEH", "Fred Miranda Forum"] },
    valuation: { low: 2800, high: 4200, confidence: 0.92, source: "AI + photography market", rationale: "M6 body alone: $2,000–2,800. 50mm Summicron: $900–1,400. Package pricing provides $200–400 discount from individual sale." },
    antique: false,
    listingPrice: null,
    projectSlot: null,
    soldTx: null,
    conversations: [],
  },
  {
    title: "Tiffany Studios Bronze Table Lamp (c.1910)",
    condition: "Good — original patina, shade intact",
    description: "Authentic Tiffany Studios bronze lamp with leaded glass shade. Floral pattern with cobalt and green glass. Signed on base. Electrified circa 1950s, works perfectly.",
    status: "READY" as const,
    saleMethod: "LOCAL_PICKUP" as const,
    photo: PHOTOS.vase,
    daysAgo: 14,
    story: "This lamp has stood in the front parlor of our family's Victorian home in Augusta since before any of us were born. Family photos from 1920 show it on the same table where it sits today. My grandmother said it was her mother's most prized possession — she refused to sell it during the Depression when times were hard. 'Some things are worth more than money,' she used to say. Now we're selling the house and can't take everything. We want it to go to someone who will love it as much as we have.",
    ai: { item_name: "Tiffany Studios Bronze Table Lamp", category: "Antiques / Lamps", brand: "Tiffany Studios", model: "Leaded Glass Floral Lamp", condition_guess: "Good", condition_score: 7, condition_cosmetic: 7, condition_functional: 8, material: "Bronze, leaded glass", era: "1910s", style: "Art Nouveau", confidence: 0.89, keywords: ["Tiffany", "lamp", "bronze", "leaded glass", "antique", "1910", "cobalt", "floral", "signed"], notes: "Authentic Tiffany Studios lamps are among the most valuable American decorative arts. Signed base is critical authentication. Shade integrity is excellent.", estimated_value_low: 3500, estimated_value_mid: 5250, estimated_value_high: 7000, pricing_confidence: 85, is_antique: true, estimated_age_years: 116, best_platforms: ["Heritage Auctions", "1stDibs", "Chairish"] },
    valuation: { low: 3500, high: 7000, confidence: 0.85, source: "AI + antique auction data", rationale: "Tiffany Studios floral lamps in Good condition sell $4,000–8,000 at major auction houses. Direct estate sale pricing typically 50-60% of auction." },
    antique: true,
    auctionLow: 6500,
    auctionHigh: 12000,
    antiqueReason: "Authentic Tiffany Studios (signed base), c.1910. Leaded glass with original patina. Among the most collectible American antiques.",
    listingPrice: null,
    projectSlot: "estate",
    soldTx: null,
    conversations: [],
  },
  {
    title: "Original Oil Painting — Maine Coastal Scene (c.1950s)",
    condition: "Very Good — minor frame wear, canvas clean",
    description: "Large (24×36) original oil painting depicting the Maine coast — rocky shoreline with boats. Artist signature visible lower right, unidentified. Period frame, excellent canvas condition.",
    status: "LISTED" as const,
    saleMethod: "BOTH" as const,
    daysAgo: 6,
    photo: PHOTOS.painting,
    story: null,
    ai: { item_name: "Original Oil Painting — Maine Coastal Scene", category: "Fine Art / Paintings", brand: "Unknown Artist", model: "Oil on Canvas 24×36", condition_guess: "Very Good", condition_score: 7, condition_cosmetic: 7, condition_functional: 10, material: "Oil on canvas", era: "1950s", style: "Realist", confidence: 0.81, keywords: ["oil painting", "Maine", "coastal", "original", "vintage", "1950s", "signed"], notes: "Original signed oil paintings of Maine coastal scenes are popular in the regional market. Artist identification research recommended before listing.", estimated_value_low: 280, estimated_value_mid: 465, estimated_value_high: 650, pricing_confidence: 78, is_antique: true, estimated_age_years: 75, best_platforms: ["eBay", "Invaluable", "Local Galleries"] },
    valuation: { low: 280, high: 650, confidence: 0.78, source: "AI + regional art market", rationale: "Unidentified signed oil paintings of New England coastal scenes sell $300–800 at regional auction. Identification could significantly increase value." },
    antique: false,
    listingPrice: 395,
    projectSlot: "estate",
    soldTx: null,
    conversations: [
      { buyerName: "Nancy B.", buyerEmail: "nancy.b@example.com", platform: "direct", botScore: 85, daysAgo: 2, messages: [{ sender: "buyer", content: "Beautiful painting! Do you know anything about the artist? I collect Maine coastal art and this looks like it could be by a local Boothbay artist from that era." }, { sender: "seller", content: "Thank you! We don't know the artist — the signature is partially legible. It's been in the family since the 1960s. Would you like to come see it in person?" }] },
    ],
  },
  {
    title: "Royal Quiet De Luxe Typewriter (1950s)",
    condition: "Excellent — types perfectly, original case",
    description: "1950s Royal Quiet De Luxe portable typewriter in mint green. All keys function perfectly, ribbon is good. Original carry case included. Recently cleaned and serviced.",
    status: "SOLD" as const,
    saleMethod: "ONLINE_SHIPPING" as const,
    photo: PHOTOS.typewriter,
    daysAgo: 19,
    story: "My mother used this typewriter to write every letter to every government official she ever disagreed with — and there were many. She wrote to three governors, two senators, and one president (she was politely ignored by all of them). She said a typewriter made every letter feel like it mattered more than an email ever could. She was right. This little machine is responsible for at least a dozen letters that made it into local newspaper archives.",
    ai: { item_name: "Royal Quiet De Luxe Portable Typewriter", category: "Collectibles / Vintage Office", brand: "Royal", model: "Quiet De Luxe (1950s)", condition_guess: "Excellent", condition_score: 8, condition_cosmetic: 8, condition_functional: 9, material: "Steel body, bakelite keys", era: "1950s", style: "Streamlined Modern", confidence: 0.87, keywords: ["Royal", "typewriter", "portable", "1950s", "vintage", "mint green", "collectible"], notes: "Royal Quiet De Luxe in mint green is among the most sought-after vintage typewriters. Excellent functional condition is rare.", estimated_value_low: 180, estimated_value_mid: 250, estimated_value_high: 320, pricing_confidence: 83, is_antique: true, estimated_age_years: 73, best_platforms: ["Etsy", "eBay", "Instagram"] },
    valuation: { low: 180, high: 320, confidence: 0.83, source: "AI + Etsy/eBay comps", rationale: "Royal QDL in excellent condition with case sells $200–350 on Etsy and eBay. Mint green color commands premium over standard black." },
    antique: false,
    listingPrice: 265,
    projectSlot: "garage",
    soldTx: { amount: 265, description: "Royal Typewriter sold — shipped to buyer" },
    conversations: [],
  },
  {
    title: "2008 Ford F-150 XLT SuperCab 4x4",
    condition: "Good — some rust on rocker panels",
    description: "Reliable Maine work truck. 4.6L V8, 4WD, tow package, bed liner, running boards. 142K miles, runs great. Some rust on rocker panels (typical for Maine). New brakes and tires 2025.",
    status: "LISTED" as const,
    saleMethod: "LOCAL_PICKUP" as const,
    photo: PHOTOS.f150,
    daysAgo: 4,
    story: null,
    ai: {
      item_name: "2008 Ford F-150 XLT SuperCab 4x4",
      category: "Vehicles",
      brand: "Ford",
      model: "F-150 XLT",
      condition_guess: "Good",
      confidence: 0.92,
      condition_score: 6,
      condition_cosmetic: 5,
      condition_functional: 7,
      condition_details: "Running well mechanically. Typical Maine rust on rocker panels. Interior in good shape. New brakes and tires.",
      keywords: ["truck", "4x4", "ford", "f-150", "work truck", "towing"],
      vehicle_year: "2008",
      vehicle_make: "Ford",
      vehicle_model: "F-150 XLT SuperCab",
      vehicle_mileage: "142,000",
      vin_visible: false,
      material: "Steel body",
      era: "2000s",
      notes: "Popular work truck with 4WD, ideal for Maine winters. Tow package adds value.",
      estimated_value_low: 8500, estimated_value_mid: 10500, estimated_value_high: 12500, pricing_confidence: 85, is_antique: false, best_platforms: ["Craigslist", "Facebook Marketplace", "AutoTrader"],
    },
    valuation: { low: 8500, high: 12500, confidence: 0.85, source: "AI + market comps", rationale: "2008 F-150 4x4 trucks hold value well in Maine. Mileage is average for the year. Rust is expected but affects resale." },
    antique: false,
    listingPrice: 10500,
    projectSlot: null,
    soldTx: null,
    conversations: [
      { buyerName: "Dave R.", buyerEmail: null, platform: "Craigslist", botScore: 89, daysAgo: 2, messages: [{ sender: "buyer", content: "Is this truck still available? I need a work truck for my landscaping business. Can I come look at it this weekend?" }, { sender: "seller", content: "Yes, still available! Happy to show it Saturday morning. It starts right up and drives great. The tow package is heavy duty." }, { sender: "buyer", content: "Perfect. How bad is the rust? I can do some body work myself. Would you take $9,500 cash?" }] },
    ],
  },
];

export async function POST() {
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  let itemsCreated = 0;
  let conversationsCreated = 0;
  let projectsCreated = 0;
  let transactionsCreated = 0;

  // ── Create projects first (idempotent by name) ──────────────────────────
  let estateProject = await prisma.project.findFirst({
    where: { userId: user.id, name: "Grandma Dorothy's Estate Sale" },
  });
  if (!estateProject) {
    estateProject = await prisma.project.create({
      data: {
        userId: user.id,
        type: "ESTATE_SALE",
        name: "Grandma Dorothy's Estate Sale",
        description: "Downsizing after 50+ years in our family home in Waterville. 3 generations of family heirlooms, furniture, jewelry, and treasured collectibles.",
        startDate: new Date("2026-03-15"),
        endDate: new Date("2026-03-30"),
        city: "Waterville",
        state: "ME",
        status: "ACTIVE",
      },
    });
    projectsCreated++;
  }

  let garageProject = await prisma.project.findFirst({
    where: { userId: user.id, name: "Spring Cleanout Sale" },
  });
  if (!garageProject) {
    garageProject = await prisma.project.create({
      data: {
        userId: user.id,
        type: "GARAGE_SALE",
        name: "Spring Cleanout Sale",
        description: "Moving across country this April — everything must go! Great deals on electronics, collectibles, and everyday household items.",
        startDate: new Date("2026-04-05"),
        endDate: new Date("2026-04-06"),
        city: "Portland",
        state: "ME",
        status: "DRAFT",
      },
    });
    projectsCreated++;
  }

  // ── Create items ─────────────────────────────────────────────────────────
  for (const demo of DEMO_ITEMS) {
    const existing = await prisma.item.findFirst({
      where: { userId: user.id, title: demo.title },
    });
    if (existing) continue;

    // Assign project
    const projectId =
      demo.projectSlot === "estate" ? estateProject.id :
      demo.projectSlot === "garage" ? garageProject.id :
      null;

    const itemDaysAgo = (demo as any).daysAgo ?? 7;
    const itemCreatedAt = new Date(now - itemDaysAgo * DAY);

    const item = await prisma.item.create({
      data: {
        userId: user.id,
        projectId,
        title: demo.title,
        condition: demo.condition,
        description: demo.description,
        status: demo.status,
        saleMethod: demo.saleMethod,
        listingPrice: demo.listingPrice ?? null,
        megabotUsed: false,
        story: demo.story ?? null,
        createdAt: itemCreatedAt,
      } as any,
    });

    // Photo
    await prisma.itemPhoto.create({
      data: { itemId: item.id, filePath: demo.photo, order: 1, isPrimary: true },
    });

    // AI result
    await prisma.aiResult.create({
      data: { itemId: item.id, rawJson: JSON.stringify(demo.ai), confidence: demo.ai.confidence },
    });

    // Valuation — compute extended pricing data
    const vLow = demo.valuation.low;
    const vHigh = demo.valuation.high;
    const vMid = Math.round((vLow + vHigh) / 2);
    const vConf = demo.valuation.confidence;
    const commRate = 0.12; // Free tier default
    const localMult = 0.75; // Maine market
    const bestMult = 1.35; // NYC
    const shipCost = 25;
    const localLow = Math.round(vLow * localMult);
    const localMid = Math.round(vMid * localMult);
    const localHigh = Math.round(vHigh * localMult);
    const bestLow = Math.round(vLow * bestMult);
    const bestMid = Math.round(vMid * bestMult);
    const bestHigh = Math.round(vHigh * bestMult);
    const localComm = Math.round(localMid * commRate * 100) / 100;
    const localNet = Math.round((localMid - localComm) * 100) / 100;
    const bestComm = Math.round(bestMid * commRate * 100) / 100;
    const bestNet = Math.round((bestMid - bestComm - shipCost) * 100) / 100;
    const natComm = Math.round(vMid * commRate * 100) / 100;
    const natNet = Math.round((vMid - natComm) * 100) / 100;

    const pricingResult = {
      aiEstimate: { low: vLow, mid: vMid, high: vHigh, confidence: vConf },
      basePrice: { low: vLow, mid: vMid, high: vHigh },
      adjustments: [],
      localPrice: { low: localLow, mid: localMid, high: localHigh, label: "Central Maine" },
      nationalPrice: { low: vLow, mid: vMid, high: vHigh, label: "National Average" },
      bestMarket: { low: bestLow, mid: bestMid, high: bestHigh, label: "New York City / Boston", shippingCost: shipCost },
      commissionRate: commRate,
      commissionPct: 12,
      processingFeeRate: 0.035,
      shippingEstimate: shipCost,
      sellerNet: { local: localNet, national: natNet, bestMarket: bestNet },
      buyerTotal: { local: Math.round(localMid * 1.035 * 100) / 100, national: Math.round((vMid + shipCost) * 1.035 * 100) / 100, bestMarket: Math.round((bestMid + shipCost) * 1.035 * 100) / 100 },
      localEarnings: { salePrice: localMid, commission: localComm, net: localNet },
      shippedEarnings: { salePrice: bestMid, shipping: shipCost, commission: bestComm, net: bestNet, city: "New York City / Boston" },
      recommendation: bestNet > localNet ? `Ship to NYC/Boston for best return. Net $${bestNet.toFixed(2)} shipped vs $${localNet.toFixed(2)} locally.` : `Sell locally for best return after shipping costs.`,
      marginComparison: { localMargin: localMid > 0 ? Math.round((localNet / localMid) * 100) : 0, shippedMargin: bestMid > 0 ? Math.round((bestNet / bestMid) * 100) : 0, bestOption: bestNet > localNet ? `Ship to NYC/Boston for $${(bestNet - localNet).toFixed(2)} more` : "Sell locally to avoid shipping cost" },
      confidence: vConf,
      recommendations: ["Best platforms to sell: eBay, Facebook Marketplace"],
    };

    await prisma.valuation.create({
      data: {
        itemId: item.id,
        low: vLow,
        mid: vMid,
        high: vHigh,
        confidence: vConf,
        source: demo.valuation.source,
        rationale: demo.valuation.rationale,
        localLow,
        localMid,
        localHigh,
        localConfidence: vConf,
        localSource: "Central Maine",
        onlineLow: vLow,
        onlineMid: vMid,
        onlineHigh: vHigh,
        onlineConfidence: vConf,
        onlineSource: "National average",
        onlineRationale: JSON.stringify(pricingResult),
        bestMarketLow: bestLow,
        bestMarketMid: bestMid,
        bestMarketHigh: bestHigh,
        bestMarketCity: "New York City / Boston",
        sellerNetLocal: localNet,
        sellerNetNational: natNet,
        sellerNetBestMarket: bestNet,
        recommendation: pricingResult.recommendation,
        adjustments: "[]",
      },
    });

    // Antique check
    await prisma.antiqueCheck.create({
      data: {
        itemId: item.id,
        isAntique: demo.antique,
        reason: (demo as any).antiqueReason ?? (demo.antique ? "Identified as antique" : "Not identified as antique"),
        auctionLow: (demo as any).auctionLow ?? null,
        auctionHigh: (demo as any).auctionHigh ?? null,
      },
    });

    // EventLog — stagger relative to item creation, not "now"
    const analyzedAt = new Date(itemCreatedAt.getTime() + 2 * HOUR);
    await prisma.eventLog.create({
      data: {
        itemId: item.id,
        eventType: "ANALYZED",
        payload: JSON.stringify({ source: "demo_seed", confidence: demo.ai.confidence }),
        createdAt: analyzedAt,
      },
    });

    if (demo.story) {
      await prisma.eventLog.create({
        data: {
          itemId: item.id,
          eventType: "STORY_ADDED",
          payload: JSON.stringify({ chars: demo.story.length }),
          createdAt: new Date(analyzedAt.getTime() + 4 * HOUR),
        },
      });
    }

    // Transaction for sold items
    if ((demo as any).soldTx) {
      const tx = (demo as any).soldTx as { amount: number; description: string };
      const tierKey = TIER_NUMBER_TO_KEY[user.tier] ?? "FREE";
      const commPct = (DIGITAL_TIERS[tierKey]?.commission ?? 5) / 100;
      const commission = tx.amount * commPct;
      await prisma.transaction.create({
        data: {
          userId: user.id,
          itemId: item.id,
          type: "ITEM_SALE",
          description: tx.description,
          amount: tx.amount,
          commission,
          netAmount: tx.amount - commission,
          status: "COMPLETED",
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        },
      });
      transactionsCreated++;
    }

    itemsCreated++;

    // Conversations — stagger timestamps naturally (hours apart, not seconds)
    for (const conv of (demo as any).conversations ?? []) {
      const convDaysAgo = conv.daysAgo ?? 3;
      const convCreatedAt = new Date(now - convDaysAgo * DAY);
      const conversation = await prisma.conversation.create({
        data: {
          itemId: item.id,
          buyerName: conv.buyerName,
          buyerEmail: conv.buyerEmail,
          platform: conv.platform,
          botScore: conv.botScore,
          createdAt: convCreatedAt,
        },
      });
      for (let i = 0; i < conv.messages.length; i++) {
        // Messages spread 1-4 hours apart for natural feel
        const msgOffset = i * (1 + Math.random() * 3) * HOUR;
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            sender: conv.messages[i].sender,
            content: conv.messages[i].content,
            isRead: conv.messages[i].sender === "seller",
            createdAt: new Date(convCreatedAt.getTime() + msgOffset),
          },
        });
      }
      conversationsCreated++;
    }
  }

  const skipped = DEMO_ITEMS.length - itemsCreated;

  // ── Subscription ─────────────────────────────────────────────────────────
  const existingSubscription = await prisma.subscription.findFirst({ where: { userId: user.id } });
  let subscriptionCreated = false;
  if (!existingSubscription) {
    const periodStart = new Date("2026-02-15");
    const periodEnd = new Date("2026-03-15");
    await prisma.subscription.create({
      data: {
        userId: user.id,
        tier: "STARTER",
        price: 19,
        commission: 0.05,
        status: "ACTIVE",
        billingPeriod: "monthly",
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        limitsJson: JSON.stringify({ items: 50, photos: 10, projects: 5 }),
        featuresJson: JSON.stringify(["megabot", "ebay_listing", "shipping_labels"]),
      },
    });
    subscriptionCreated = true;
  }

  // ── Credits ──────────────────────────────────────────────────────────────
  let creditsCreated = false;
  let existingCredits = await prisma.userCredits.findUnique({ where: { userId: user.id } });
  if (!existingCredits) {
    existingCredits = await prisma.userCredits.create({
      data: { userId: user.id, balance: 85, lifetime: 150, spent: 65 },
    });
    creditsCreated = true;
  }

  // Seed sample transactions only if balance matches initial (freshly created)
  const existingTxCount = await prisma.creditTransaction.count({ where: { userCreditsId: existingCredits.id } });
  if (existingTxCount === 0) {
    const txs = [
      { type: "purchase", amount: 65,  balance: 65,  description: "Value Pack — 65 credits + 5 bonus", paymentAmount: 50, daysAgo: 14 },
      { type: "spend",    amount: -5,  balance: 60,  description: "MegaBot Premium — Victorian Silver Tea Service", paymentAmount: null, daysAgo: 10 },
      { type: "earned",   amount: 10,  balance: 70,  description: "Sale commission bonus — MCM Walnut Dresser sold", paymentAmount: null, daysAgo: 7 },
      { type: "spend",    amount: -3,  balance: 67,  description: "Priority Processing — Rolex Datejust listing", paymentAmount: null, daysAgo: 3 },
      { type: "purchase", amount: 85,  balance: 152, description: "Power Pack — 140 credits + 20 bonus", paymentAmount: 100, daysAgo: 30 },
      { type: "spend",    amount: -67, balance: 85,  description: "Various services (analysis, stories, appraisals)", paymentAmount: null, daysAgo: 1 },
    ];
    for (const tx of txs) {
      await prisma.creditTransaction.create({
        data: {
          userCreditsId: existingCredits.id,
          type: tx.type,
          amount: tx.amount,
          balance: tx.balance,
          description: tx.description,
          paymentAmount: tx.paymentAmount,
          createdAt: new Date(Date.now() - tx.daysAgo * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  // ── White-Glove Project ───────────────────────────────────────────────────
  const existingWG = await prisma.whiteGloveProject.findFirst({ where: { userId: user.id } });
  let whiteGloveCreated = false;
  if (!existingWG) {
    const wg = await prisma.whiteGloveProject.create({
      data: {
        userId: user.id,
        tier: "PROFESSIONAL",
        basePrice: 599,
        additionalFees: 0,
        totalUpfront: 599,
        commission: 0.20,
        estimatedValue: 18500,
        actualRevenue: 4200,
        address: "47 Maple Street",
        city: "Portland",
        state: "ME",
        zip: "04101",
        bedrooms: 4,
        estimatedItems: 280,
        projectManager: "Sarah Whitfield",
        teamJson: JSON.stringify({ photographer: "Harbor Light Studios", appraiser: "Dr. Ellen Ross", coordinator: "Mike Tanner", cleaner: "Coastal Clean Crew" }),
        currentPhase: "ACTIVE_SELLING",
        consultDate: new Date("2026-01-15"),
        startDate: new Date("2026-01-28"),
        estimatedWeeks: 8,
        includedServicesJson: JSON.stringify([
          "Professional photography (all items)",
          "AI pricing analysis",
          "Antique specialist review",
          "eBay + Facebook + Craigslist listings",
          "Local estate sale coordination",
          "Junk removal coordination",
          "Donation receipts arranged",
          "90-day extended selling window",
        ]),
        status: "IN_PROGRESS",
        notes: "4BR Cape Cod estate. Deceased owner's belongings from 60+ years. Notable pieces include Victorian silver, mid-century furniture, and a Leica camera collection. Family wants all proceeds to go to Portland Humane Society.",
      },
    });

    // Seed phases
    const phases = [
      { phaseNumber: 1, phaseName: "Consultation", status: "COMPLETED", startedAt: new Date("2026-01-15"), completedAt: new Date("2026-01-15"), tasks: [{ label: "Meet with family", done: true }, { label: "Walk through property", done: true }, { label: "Sign service agreement", done: true }, { label: "Discuss charity wishes", done: true }] },
      { phaseNumber: 2, phaseName: "Photography", status: "COMPLETED", startedAt: new Date("2026-01-28"), completedAt: new Date("2026-01-29"), tasks: [{ label: "Schedule photographer", done: true }, { label: "Photo all 280 items", done: true }, { label: "Upload to AI system", done: true }] },
      { phaseNumber: 3, phaseName: "AI Analysis", status: "COMPLETED", startedAt: new Date("2026-01-30"), completedAt: new Date("2026-01-31"), tasks: [{ label: "Run AI identification", done: true }, { label: "Generate price estimates", done: true }, { label: "Flag antiques for review", done: true }, { label: "MegaBot analysis", done: true }] },
      { phaseNumber: 4, phaseName: "Antique Review", status: "COMPLETED", startedAt: new Date("2026-02-03"), completedAt: new Date("2026-02-05"), tasks: [{ label: "Appraiser visits property", done: true }, { label: "Victorian silver appraised", done: true }, { label: "Camera collection valued", done: true }, { label: "Auction house consulted", done: true }] },
      { phaseNumber: 5, phaseName: "Pricing & Listing", status: "COMPLETED", startedAt: new Date("2026-02-06"), completedAt: new Date("2026-02-10"), tasks: [{ label: "Set listing prices", done: true }, { label: "List on eBay", done: true }, { label: "Post Facebook Marketplace", done: true }, { label: "Craigslist ads created", done: true }, { label: "Estate sale signs posted", done: true }] },
      { phaseNumber: 6, phaseName: "Active Selling", status: "IN_PROGRESS", startedAt: new Date("2026-02-11"), completedAt: null, tasks: [{ label: "Week 1 sales event", done: true }, { label: "Week 2 sales event", done: true }, { label: "Online orders fulfilled", done: true }, { label: "Week 3 sales event", done: false }, { label: "Price reductions applied", done: false }], notes: "Strong interest in silver tea service — 3 serious buyers. Rolex sold at $4,200." },
      { phaseNumber: 7, phaseName: "Closeout",   status: "PENDING", startedAt: null, completedAt: null, tasks: [{ label: "Final sale weekend", done: false }, { label: "Mark unsold items", done: false }, { label: "Final revenue report", done: false }] },
      { phaseNumber: 8, phaseName: "Donation",   status: "PENDING", startedAt: null, completedAt: null, tasks: [{ label: "Schedule Goodwill pickup", done: false }, { label: "Get tax receipts", done: false }, { label: "Email receipts to family", done: false }] },
      { phaseNumber: 9, phaseName: "Junk Removal", status: "PENDING", startedAt: null, completedAt: null, tasks: [{ label: "Schedule Casco Bay Hauling", done: false }, { label: "Confirm access with family", done: false }, { label: "Final walkthrough", done: false }] },
      { phaseNumber: 10, phaseName: "Final Cleanup", status: "PENDING", startedAt: null, completedAt: null, tasks: [{ label: "Deep clean entire property", done: false }, { label: "Return keys to family", done: false }, { label: "Final accounting sent", done: false }] },
    ];

    for (const p of phases) {
      await prisma.whiteGlovePhase.create({
        data: {
          projectId: wg.id,
          phaseNumber: p.phaseNumber,
          phaseName: p.phaseName,
          status: p.status,
          startedAt: p.startedAt ?? null,
          completedAt: p.completedAt ?? null,
          tasksJson: JSON.stringify(p.tasks),
          notes: (p as any).notes ?? null,
        },
      });
    }
    whiteGloveCreated = true;
  }

  // ── Contractors ───────────────────────────────────────────────────────────
  const contractorSeed = [
    { type: "JUNK_REMOVAL", company: "Casco Bay Hauling", contactName: "Jim Hartley", phone: "(207) 555-0201", email: "jim@cascobay.com", serviceArea: "Southern Maine", ratesJson: JSON.stringify({ baseRate: 150, perHour: 75, unit: "load" }), rating: 4.9, reviewCount: 47 },
    { type: "CLEANING",     company: "Coastal Clean Crew", contactName: "Maria Santos", phone: "(207) 555-0202", email: "maria@coastalclean.com", serviceArea: "Portland metro", ratesJson: JSON.stringify({ baseRate: 200, perHour: 45, unit: "hour" }), rating: 4.8, reviewCount: 31 },
    { type: "PHOTOGRAPHY",  company: "Harbor Light Studios", contactName: "Tom Wentworth", phone: "(207) 555-0203", email: "tom@harborlight.com", serviceArea: "All of Maine", ratesJson: JSON.stringify({ baseRate: 250, perHour: 85, unit: "session" }), rating: 5.0, reviewCount: 22 },
    { type: "APPRAISAL",    company: "Maine Antique Appraisers", contactName: "Dr. Ellen Ross", phone: "(207) 555-0204", email: "ellen@maineappraisers.com", serviceArea: "New England", ratesJson: JSON.stringify({ baseRate: 300, perHour: 150, unit: "hour" }), rating: 4.9, reviewCount: 58, available: false },
    { type: "DONATION",     company: "Goodwill of Maine", contactName: "Pickup Desk", phone: "(207) 555-0205", email: "pickup@goodwillme.org", serviceArea: "Statewide", ratesJson: JSON.stringify({ baseRate: 0, perHour: 0, unit: "free" }), rating: 4.7, reviewCount: 112 },
    { type: "STAGING",      company: "Portland Home Staging", contactName: "Lisa Chen", phone: "(207) 555-0206", email: "lisa@portlandstaging.com", serviceArea: "Greater Portland", ratesJson: JSON.stringify({ baseRate: 400, perHour: 95, unit: "day" }), rating: 4.6, reviewCount: 19 },
  ];
  let contractorsCreated = 0;
  for (const c of contractorSeed) {
    const exists = await prisma.contractor.findFirst({ where: { email: c.email } });
    if (!exists) {
      await prisma.contractor.create({
        data: {
          type: c.type,
          company: c.company,
          contactName: c.contactName,
          phone: c.phone,
          email: c.email,
          serviceArea: c.serviceArea,
          ratesJson: c.ratesJson,
          rating: c.rating,
          reviewCount: c.reviewCount,
          available: (c as any).available !== false,
        },
      });
      contractorsCreated++;
    }
  }

  // ── Connected Platforms ───────────────────────────────────────────────────
  const platformsToSeed = [
    { platform: "facebook",    platformUsername: "LegacyLoop Estate Sales",  daysAgo: 21 },
    { platform: "ebay",        platformUsername: "legacyloop_maine",          daysAgo: 14 },
    { platform: "craigslist",  platformUsername: null,                        daysAgo: 7  },
  ];
  let platformsCreated = 0;
  for (const p of platformsToSeed) {
    await prisma.connectedPlatform.upsert({
      where: { userId_platform: { userId: user.id, platform: p.platform } },
      create: {
        userId: user.id,
        platform: p.platform,
        platformUsername: p.platformUsername,
        isActive: true,
        lastSync: new Date(Date.now() - p.daysAgo * 24 * 60 * 60 * 1000),
      },
      update: {},
    });
    platformsCreated++;
  }

  // ── Referral ──────────────────────────────────────────────────────────────
  const referralCode = Buffer.from(user.id).toString("base64").slice(0, 8).toUpperCase();
  await prisma.referral.upsert({
    where: { code: referralCode },
    create: { referrerId: user.id, code: referralCode, referredEmail: null, status: "PENDING" },
    update: {},
  });

  // ── Buyer Bots + Leads ────────────────────────────────────────────────────
  // Find the Tea Service item and seed a MegaBot for it
  const teaService = await prisma.item.findFirst({
    where: { userId: user.id, title: "Victorian Sterling Silver Tea Service (c.1880s)" },
  });

  let botsCreated = 0;
  if (teaService) {
    const existingBot = await prisma.buyerBot.findFirst({ where: { itemId: teaService.id } });
    if (!existingBot) {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const nextScan = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const bot = await prisma.buyerBot.create({
        data: {
          itemId: teaService.id,
          isActive: true,
          isMegaBot: true,
          platformsJson: JSON.stringify(["Facebook", "eBay", "Reddit", "Craigslist", "Etsy", "Nextdoor", "Antique Forums"]),
          radius: 150,
          scansCompleted: 3,
          buyersFound: 8,
          outreachSent: 8,
          responsesReceived: 3,
          conversionsToSale: 0,
          lastScanAt: twoHoursAgo,
          nextScanAt: nextScan,
        },
      });
      const demoLeads = [
        { platform: "Facebook Groups", buyerName: "Patricia Hewitt", location: "Portland, ME", searchingFor: "Victorian silver tea sets — been searching 2 years", maxBudget: 2000, urgency: "high", matchScore: 96, botScore: 93, outreachStatus: "REPLIED" },
        { platform: "eBay Saved Searches", buyerName: "Robert Langley", location: "Boston, MA", searchingFor: "Sheffield sterling silver tea service 1880s", maxBudget: 2500, urgency: "medium", matchScore: 91, botScore: 88, outreachStatus: "CONTACTED" },
        { platform: "Reddit r/Antiques", buyerName: "Claire Dunning", location: "Bar Harbor, ME", searchingFor: "ISO Victorian silver tea service for wedding gift", maxBudget: 1800, urgency: "high", matchScore: 89, botScore: 85, outreachStatus: "CONTACTED" },
        { platform: "Facebook Marketplace", buyerName: "Jennifer Parsons", location: "Bangor, ME", searchingFor: "Silver tea set gift for mother's 70th birthday", maxBudget: 2200, urgency: "high", matchScore: 87, botScore: 82, outreachStatus: "REPLIED" },
        { platform: "Antique Forum", buyerName: "David Marchetti", location: "Providence, RI", searchingFor: "Sheffield specialist — acquiring 1880s pieces for museum", maxBudget: 4000, urgency: "low", matchScore: 85, botScore: 80, outreachStatus: "CONTACTED" },
        { platform: "Craigslist", buyerName: "Thomas Whitfield", location: "Augusta, ME", searchingFor: "Estate silver — cash buyer for multiple pieces", maxBudget: 1500, urgency: "medium", matchScore: 84, botScore: 79, outreachStatus: "PENDING" },
        { platform: "Etsy Favorites", buyerName: "Margaret Oconnor", location: "New York, NY", searchingFor: "Favorited 6 Victorian silver sets this month", maxBudget: 3000, urgency: "low", matchScore: 82, botScore: 77, outreachStatus: "REPLIED" },
        { platform: "Nextdoor", buyerName: "Susan Kelley", location: "Waterville, ME", searchingFor: "Antique silver for our B&B", maxBudget: 1600, urgency: "medium", matchScore: 78, botScore: 74, outreachStatus: "PENDING" },
      ];
      for (const lead of demoLeads) {
        await prisma.buyerLead.create({
          data: {
            botId: bot.id,
            itemId: teaService.id,
            sourceType: "group_post",
            aiConfidence: 0.87,
            matchReason: "Active buyer with matching criteria and budget",
            ...lead,
          },
        });
      }
      botsCreated++;
    }
  }

  // ── Engagement Metrics ────────────────────────────────────────────────────
  const METRICS_BY_TITLE: Record<string, { totalViews: number; buyersFound: number; inquiries: number; outreachSent: number }> = {
    "Rolex Datejust 36mm (1987, ref. 16014)":          { totalViews: 340, buyersFound: 0, inquiries: 4, outreachSent: 0 },
    "Victorian Sterling Silver Tea Service (c.1880s)": { totalViews: 218, buyersFound: 8, inquiries: 6, outreachSent: 8 },
    "Fender Stratocaster Electric Guitar (1998)":      { totalViews: 187, buyersFound: 0, inquiries: 2, outreachSent: 0 },
    "Tiffany Studios Bronze Table Lamp (c.1910)":      { totalViews: 162, buyersFound: 0, inquiries: 3, outreachSent: 0 },
    "Leica M6 Film Camera with 50mm Summicron":        { totalViews: 144, buyersFound: 0, inquiries: 1, outreachSent: 0 },
    "Pokémon Charizard Holo Fossil Set 1999 PSA 7":    { totalViews: 121, buyersFound: 0, inquiries: 1, outreachSent: 0 },
    "Mid-Century Modern Walnut Dresser (1960s)":       { totalViews: 98,  buyersFound: 0, inquiries: 2, outreachSent: 0 },
    "Original Oil Painting — Maine Coastal Scene (c.1950s)": { totalViews: 76, buyersFound: 0, inquiries: 1, outreachSent: 0 },
    "HP Envy 15 Laptop (2022)":                        { totalViews: 65,  buyersFound: 0, inquiries: 2, outreachSent: 0 },
    "Royal Quiet De Luxe Typewriter (1950s)":          { totalViews: 54,  buyersFound: 0, inquiries: 1, outreachSent: 0 },
    "2008 Ford F-150 XLT SuperCab 4x4":               { totalViews: 89,  buyersFound: 0, inquiries: 3, outreachSent: 0 },
  };

  let metricsUpserted = 0;
  for (const [title, m] of Object.entries(METRICS_BY_TITLE)) {
    const it = await prisma.item.findFirst({ where: { userId: user.id, title } });
    if (!it) continue;
    await prisma.itemEngagementMetrics.upsert({
      where: { itemId: it.id },
      create: { itemId: it.id, ...m },
      update: {},
    });
    metricsUpserted++;
  }

  // ── Recon Bot for Tea Service ──────────────────────────────────────────────
  let reconBotsCreated = 0;
  const teaItem = await prisma.item.findFirst({
    where: { userId: user.id, title: "Victorian Sterling Silver Tea Service (c.1880s)" },
  });
  if (teaItem) {
    const existingRecon = await prisma.reconBot.findFirst({ where: { itemId: teaItem.id } });
    if (!existingRecon) {
      const teaCompetitors = [
        { id: "mock_0", platform: "eBay", title: "Victorian Sterling Silver Tea Set – Excellent", category: "Antiques / Silver", condition: "Excellent", location: "Portland, ME", price: 1150, status: "ACTIVE", daysAgo: 5, daysToSell: null, url: "#", views: 89, saves: 12 },
        { id: "mock_1", platform: "Facebook Marketplace", title: "Victorian Sterling Silver Tea Service – Good", category: "Antiques / Silver", condition: "Good", location: "Bangor, ME", price: 950, status: "ACTIVE", daysAgo: 8, daysToSell: null, url: "#", views: 43, saves: 7 },
        { id: "mock_2", platform: "Craigslist", title: "Antique Sterling Silver Tea Service – Very Good", category: "Antiques / Silver", condition: "Very Good", location: "Augusta, ME", price: 1300, status: "SOLD", daysAgo: 6, daysToSell: 4, url: "#", views: 120, saves: 18 },
        { id: "mock_3", platform: "eBay", title: "Victorian Tea Service 5-piece Sterling Silver", category: "Antiques / Silver", condition: "Very Good", location: "Lewiston, ME", price: 1650, status: "ACTIVE", daysAgo: 3, daysToSell: null, url: "#", views: 61, saves: 9 },
        { id: "mock_4", platform: "Mercari", title: "Sterling Silver Tea Set Victorian Era – Excellent", category: "Antiques / Silver", condition: "Excellent", location: "Brunswick, ME", price: 1400, status: "ACTIVE", daysAgo: 11, daysToSell: null, url: "#", views: 34, saves: 5 },
        { id: "mock_5", platform: "Facebook Marketplace", title: "Antique Tea Service Sterling – Good Condition", category: "Antiques / Silver", condition: "Good", location: "Waterville, ME", price: 1050, status: "SOLD", daysAgo: 3, daysToSell: 7, url: "#", views: 78, saves: 11 },
        { id: "mock_6", platform: "eBay", title: "Victorian Silver Tea Set 1880s – 5 Piece", category: "Antiques / Silver", condition: "Fair", location: "South Portland, ME", price: 875, status: "ACTIVE", daysAgo: 14, daysToSell: null, url: "#", views: 29, saves: 3 },
        { id: "mock_7", platform: "OfferUp", title: "Vintage Sterling Tea Service – Very Good", category: "Antiques / Silver", condition: "Very Good", location: "Biddeford, ME", price: 1200, status: "ACTIVE", daysAgo: 2, daysToSell: null, url: "#", views: 15, saves: 2 },
        { id: "mock_8", platform: "Craigslist", title: "Sheffield Sterling Silver Tea Set 1883", category: "Antiques / Silver", condition: "Excellent", location: "Portland, ME", price: 1800, status: "SOLD", daysAgo: 4, daysToSell: 9, url: "#", views: 204, saves: 31 },
      ];
      const avgPrice = teaCompetitors.filter(c => c.status === "ACTIVE").reduce((s, c) => s + c.price, 0) / teaCompetitors.filter(c => c.status === "ACTIVE").length;
      const rb = await prisma.reconBot.create({
        data: {
          itemId: teaItem.id,
          userId: user.id,
          platformsJson: JSON.stringify(["facebook", "ebay", "craigslist", "mercari", "offerup"]),
          isActive: true,
          competitorCount: teaCompetitors.length,
          lowestPrice: 875,
          highestPrice: 1800,
          averagePrice: Math.round(avgPrice),
          medianPrice: 1200,
          latestCompetitorsJson: JSON.stringify(teaCompetitors),
          currentStatus: "PRICED_WELL",
          recommendation: `Your price is competitive. ${teaCompetitors.filter(c => c.status === "ACTIVE").length} similar active listings averaging $${Math.round(avgPrice)}. Three similar items sold in the last week — demand is strong.`,
          confidenceScore: 0.89,
          lastScan: new Date(Date.now() - 15 * 60 * 1000),
          nextScan: new Date(Date.now() + 6 * 60 * 60 * 1000),
          scansCompleted: 3,
          alertsSent: 2,
        },
      });
      await prisma.reconAlert.createMany({
        data: [
          {
            reconBotId: rb.id,
            alertType: "SIMILAR_SOLD",
            severity: "MEDIUM",
            title: "3 similar items sold this week",
            message: "Recent sold listings averaged $1,367. Demand is active — good time to increase your listing visibility.",
            actionable: true,
            suggestedAction: "Mark as Listed to boost visibility",
            triggerDataJson: JSON.stringify({ count: 3, avgSoldPrice: 1367 }),
          },
          {
            reconBotId: rb.id,
            alertType: "COMPETITOR_LOWER_PRICE",
            severity: "MEDIUM",
            title: "New lower-priced listing appeared",
            message: "A listing at $950 appeared on Facebook Marketplace 8 days ago. It's priced below market average but hasn't sold yet.",
            actionable: true,
            suggestedAction: "Review your pricing strategy",
            triggerDataJson: JSON.stringify({ lowestNewPrice: 950 }),
          },
        ],
      });
      reconBotsCreated++;
    }
  }

  // ── Shipping label + tracking for Royal Typewriter ──────────────────────────
  let shippingLabelsCreated = 0;
  const typewriterItem = await prisma.item.findFirst({ where: { userId: user.id, title: { contains: "Royal Quiet De Luxe" } } });
  if (typewriterItem) {
    const existingLabel = await prisma.shipmentLabel.findFirst({ where: { itemId: typewriterItem.id } });
    if (!existingLabel) {
      const now = new Date();
      const day1 = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const day2 = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const day3 = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

      await prisma.shipmentLabel.create({
        data: {
          itemId: typewriterItem.id,
          fromAddressJson: JSON.stringify({ name: "Demo Seller", street1: "42 Main St", city: "Portland", state: "ME", zip: "04101" }),
          toAddressJson: JSON.stringify({ name: "Sarah Mitchell", street1: "789 Broadway", city: "New York", state: "NY", zip: "10003" }),
          weight: 15,
          carrier: "USPS",
          service: "Priority Mail",
          rate: 12.80,
          labelUrl: "https://deliver.goshippo.com/sample_label.pdf",
          trackingNumber: "9400111899223756768185",
          trackingUrl: "https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223756768185",
          status: "IN_TRANSIT",
          deliveryMethod: "qr",
          estimatedDays: 3,
          statusHistory: JSON.stringify([
            { status: "CREATED", timestamp: day1.toISOString(), location: "Portland, ME" },
            { status: "PICKED_UP", timestamp: day2.toISOString(), location: "Portland, ME" },
            { status: "IN_TRANSIT", timestamp: day3.toISOString(), location: "Hartford, CT" },
          ]),
        },
      });

      // Update typewriter to SHIPPED status
      await prisma.item.update({
        where: { id: typewriterItem.id },
        data: { status: "SHIPPED" },
      }).catch(() => {});

      shippingLabelsCreated++;
    }
  }

  // ── Notifications ──────────────────────────────────────────────────────────
  let notificationsCreated = 0;
  const existingNotifs = await prisma.notification.count({ where: { userId: user.id } });
  if (existingNotifs === 0) {
    const now = new Date();
    await prisma.notification.createMany({
      data: [
        {
          userId: user.id,
          type: "SHIP_REMINDER",
          title: "Label created for Royal Typewriter",
          message: "USPS Priority Mail — tracking: 9400111899223756768185",
          link: typewriterItem ? `/items/${typewriterItem.id}` : "/dashboard",
          isRead: true,
          createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        },
        {
          userId: user.id,
          type: "TRACKING_UPDATE",
          title: "Royal Typewriter picked up by USPS",
          message: "Location: Portland, ME",
          link: typewriterItem ? `/items/${typewriterItem.id}` : "/dashboard",
          isRead: true,
          createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          userId: user.id,
          type: "TRACKING_UPDATE",
          title: "Royal Typewriter in transit — Hartford, CT",
          message: "Package is on its way to New York, NY",
          link: typewriterItem ? `/items/${typewriterItem.id}` : "/dashboard",
          isRead: false,
          createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          userId: user.id,
          type: "TRACKING_UPDATE",
          title: "MCM Walnut Dresser — buyer confirmed Saturday pickup",
          message: "Buyer Sarah will pick up at 2 PM this Saturday",
          link: "/dashboard",
          isRead: false,
          createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        },
        {
          userId: user.id,
          type: "SALE_COMPLETE",
          title: "Market alert: similar tea set sold for $1,367",
          message: "A comparable Victorian Sterling Silver Tea Service just sold on eBay",
          link: "/dashboard",
          isRead: false,
          createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        },
      ],
    });
    notificationsCreated = 5;
  }

  // ── Testimonials ──────────────────────────────────────────────────────────
  const demoTestimonials = [
    {
      buyerName: "Margaret T. (Waterville, ME)",
      rating: 5,
      text: "I was overwhelmed after Mom passed. LegacyLoop's AI priced everything in her china cabinet in 20 minutes. The MegaBot found a collector in Boston who paid $340 for a tea set I would have donated. The whole process felt respectful and easy.",
      itemTitle: "Royal Albert Tea Service",
      isApproved: true,
      isDemo: true,
      isFeatured: true,
    },
    {
      buyerName: "Jason & Sarah K. (Portland, ME)",
      rating: 5,
      text: "We used the Neighborhood Bundle with 3 other families on our street. Sold $12,000 worth of stuff in one weekend. The AI pricing was surprisingly accurate — within 5% of what everything actually sold for.",
      itemTitle: "Multi-Family Estate Sale",
      isApproved: true,
      isDemo: true,
      isFeatured: true,
    },
    {
      buyerName: "Robert D. (Augusta, ME)",
      rating: 5,
      text: "As a Vietnam veteran, the Heroes discount meant a lot. But what really impressed me was how they handled Dad's WWII medals — connected us with a military museum instead of just selling them. That's integrity.",
      itemTitle: "WWII Medal Collection",
      isApproved: true,
      isDemo: true,
      isFeatured: true,
    },
    {
      buyerName: "Linda M. (Brunswick, ME)",
      rating: 5,
      text: "I'm 72 and not great with technology. Their Tech Coaching add-on was worth every penny. A real person walked me through listing my late husband's workshop tools. Sold everything in 2 weeks.",
      itemTitle: "Craftsman Tool Collection",
      isApproved: true,
      isDemo: true,
      isFeatured: true,
    },
    {
      buyerName: "David W. (Bangor, ME)",
      rating: 4,
      text: "Skeptical at first — how can AI price antiques? But the MegaBot consensus from 3 different AIs was spot-on for my grandfather clock. Only giving 4 stars because I wish the shipping was a bit cheaper for large items.",
      itemTitle: "Howard Miller Grandfather Clock",
      isApproved: true,
      isDemo: true,
      isFeatured: true,
    },
    {
      buyerName: "Carol & Jim P. (Kennebunk, ME)",
      rating: 5,
      text: "Downsizing from our family home of 40 years. The White-Glove team was incredible — they photographed, priced, and sold 200+ items. The Legacy Archive they created is now our family's most treasured possession.",
      itemTitle: "Full Estate (200+ items)",
      isApproved: true,
      isDemo: true,
      isFeatured: true,
    },
  ];

  let testimonialsCreated = 0;
  for (const t of demoTestimonials) {
    const existing = await prisma.testimonial.findFirst({
      where: { buyerName: t.buyerName, isDemo: true },
    });
    if (!existing) {
      await prisma.testimonial.create({ data: t });
      testimonialsCreated++;
    }
  }

  // ── Data consent (pre-accepted for demo user) ──────────────────────────────
  await prisma.dataCollectionConsent.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      dataCollection: true,
      aiTraining: true,
      marketResearch: true,
      anonymousSharing: true,
      creditsEarned: 100,
      consentedAt: new Date(),
    },
    update: {},
  });

  // ── Additional demo transactions (idempotent — check count first) ─────
  const totalTxCount = await prisma.transaction.count({ where: { userId: user.id } });
  if (totalTxCount < 5) {
    const tierKey2 = TIER_NUMBER_TO_KEY[user.tier] ?? "FREE";
    const commPct2 = (DIGITAL_TIERS[tierKey2]?.commission ?? 5) / 100;

    // Pending sale
    const teaItem = await prisma.item.findFirst({ where: { userId: user.id, title: { contains: "Sterling Silver Tea" } } });
    if (teaItem) {
      await prisma.transaction.create({
        data: {
          userId: user.id, itemId: teaItem.id, type: "ITEM_SALE",
          description: "Sterling Silver Tea Service — buyer checkout pending",
          amount: 850, commission: 850 * commPct2, netAmount: 850 * (1 - commPct2),
          status: "PENDING", createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      });
      transactionsCreated++;
    }

    // Addon purchase — MegaBot costs 5 credits (= $5)
    await prisma.transaction.create({
      data: {
        userId: user.id, type: "ADDON",
        description: "MegaBot Analysis — 5 credits",
        amount: 5.00, commission: 0, netAmount: -5.00,
        status: "COMPLETED", createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
    });
    transactionsCreated++;

    // Tier subscription — use actual constants price
    const tierKey3 = TIER_NUMBER_TO_KEY[user.tier] ?? "FREE";
    const subPrice = DIGITAL_TIERS[tierKey3]?.preLaunchMonthly ?? DIGITAL_TIERS[tierKey3]?.monthlyPrice ?? 10;
    await prisma.transaction.create({
      data: {
        userId: user.id, type: "TIER_FEE",
        description: `${DIGITAL_TIERS[tierKey3]?.name ?? "Starter"} plan — monthly subscription`,
        amount: subPrice, commission: 0, netAmount: -subPrice,
        status: "COMPLETED", createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      },
    });
    transactionsCreated++;
  }

  // ── Financial Demo Data (PaymentLedger + SellerEarnings) ───────────────
  // All math verifiably correct. Starter tier = 8% commission. Processing fee = 3.5% to buyer.
  let financialSeeded = false;
  const existingLedger = await prisma.paymentLedger.count({ where: { userId: user.id } });
  if (existingLedger === 0) {
    financialSeeded = true;
    const commRate = 0.08; // Starter tier

    // Sale 1 — Vintage Brass Lamp: $85
    await prisma.sellerEarnings.create({
      data: {
        userId: user.id,
        itemId: null, // demo — no matching item
        saleAmount: 85.00,
        commissionRate: commRate,
        commissionAmount: 6.80,  // 85 * 0.08
        netEarnings: 78.20,       // 85 - 6.80
        status: "available",
        holdUntil: new Date(Date.now() - 5 * DAY),
        createdAt: new Date(Date.now() - 12 * DAY),
      },
    });
    await prisma.paymentLedger.create({
      data: {
        userId: user.id,
        type: "item_purchase",
        subtotal: 97.00, // 85 item + 12 shipping
        processingFee: 3.40, // 97 * 0.035 = 3.395 ≈ 3.40
        totalCharged: 100.40,
        description: "Vintage Brass Lamp — buyer checkout",
        status: "completed",
        isDemo: true,
        metadata: JSON.stringify({ item: "Vintage Brass Lamp", itemPrice: 85, shipping: 12 }),
        createdAt: new Date(Date.now() - 12 * DAY),
      },
    });

    // Sale 2 — Oak Rocking Chair: $120
    await prisma.sellerEarnings.create({
      data: {
        userId: user.id,
        itemId: null,
        saleAmount: 120.00,
        commissionRate: commRate,
        commissionAmount: 9.60,  // 120 * 0.08
        netEarnings: 110.40,      // 120 - 9.60
        status: "available",
        holdUntil: new Date(Date.now() - 4 * DAY),
        createdAt: new Date(Date.now() - 10 * DAY),
      },
    });
    await prisma.paymentLedger.create({
      data: {
        userId: user.id,
        type: "item_purchase",
        subtotal: 138.00, // 120 + 18 shipping
        processingFee: 4.83, // 138 * 0.035 = 4.83
        totalCharged: 142.83,
        description: "Oak Rocking Chair — buyer checkout",
        status: "completed",
        isDemo: true,
        metadata: JSON.stringify({ item: "Oak Rocking Chair", itemPrice: 120, shipping: 18 }),
        createdAt: new Date(Date.now() - 10 * DAY),
      },
    });

    // Sale 3 — Silver Tea Set: $45
    await prisma.sellerEarnings.create({
      data: {
        userId: user.id,
        itemId: null,
        saleAmount: 45.00,
        commissionRate: commRate,
        commissionAmount: 3.60,  // 45 * 0.08
        netEarnings: 41.40,       // 45 - 3.60
        status: "available",
        holdUntil: new Date(Date.now() - 3 * DAY),
        createdAt: new Date(Date.now() - 7 * DAY),
      },
    });
    await prisma.paymentLedger.create({
      data: {
        userId: user.id,
        type: "item_purchase",
        subtotal: 54.00, // 45 + 9 shipping
        processingFee: 1.89, // 54 * 0.035 = 1.89
        totalCharged: 55.89,
        description: "Silver Tea Set — buyer checkout",
        status: "completed",
        isDemo: true,
        metadata: JSON.stringify({ item: "Silver Tea Set", itemPrice: 45, shipping: 9 }),
        createdAt: new Date(Date.now() - 7 * DAY),
      },
    });

    // Sale 4 — Ceramic Vase: $60 (pending — sold yesterday, 3-day hold)
    await prisma.sellerEarnings.create({
      data: {
        userId: user.id,
        itemId: null,
        saleAmount: 60.00,
        commissionRate: commRate,
        commissionAmount: 4.80,  // 60 * 0.08
        netEarnings: 55.20,       // 60 - 4.80
        status: "pending",
        holdUntil: new Date(Date.now() + 2 * DAY), // 2 more days of hold
        createdAt: new Date(Date.now() - 1 * DAY),
      },
    });
    await prisma.paymentLedger.create({
      data: {
        userId: user.id,
        type: "item_purchase",
        subtotal: 71.00, // 60 + 11 shipping
        processingFee: 2.49, // 71 * 0.035 = 2.485 ≈ 2.49
        totalCharged: 73.49,
        description: "Ceramic Vase — buyer checkout",
        status: "completed",
        isDemo: true,
        metadata: JSON.stringify({ item: "Ceramic Vase", itemPrice: 60, shipping: 11 }),
        createdAt: new Date(Date.now() - 1 * DAY),
      },
    });

    // Sale 5 — Wool Blanket: $35 (REFUNDED)
    await prisma.sellerEarnings.create({
      data: {
        userId: user.id,
        itemId: null,
        saleAmount: 35.00,
        commissionRate: commRate,
        commissionAmount: 2.80,
        netEarnings: 32.20,
        status: "refunded",
        createdAt: new Date(Date.now() - 5 * DAY),
      },
    });
    await prisma.paymentLedger.create({
      data: {
        userId: user.id,
        type: "item_purchase",
        subtotal: 43.00, // 35 + 8 shipping
        processingFee: 1.51, // 43 * 0.035 = 1.505 ≈ 1.51
        totalCharged: 44.51,
        description: "Wool Blanket — buyer checkout (refunded)",
        status: "refunded",
        isDemo: true,
        metadata: JSON.stringify({ item: "Wool Blanket", itemPrice: 35, shipping: 8, refunded: true }),
        createdAt: new Date(Date.now() - 5 * DAY),
      },
    });

    // Credit pack purchase: 65 credits for $50
    await prisma.paymentLedger.create({
      data: {
        userId: user.id,
        type: "credit_pack",
        subtotal: 50.00,
        processingFee: 1.75, // 50 * 0.035 = 1.75
        totalCharged: 51.75,
        description: "65 Credit Pack — Most Popular",
        status: "completed",
        isDemo: true,
        metadata: JSON.stringify({ pack: "pack_50", credits: 65 }),
        createdAt: new Date(Date.now() - 8 * DAY),
      },
    });

    // Balances summary (verifiable):
    // Available: $78.20 + $110.40 + $41.40 = $230.00 ✓
    // Pending:   $55.20 ✓
    // Total earned (non-refunded): $230.00 + $55.20 = $285.20 ✓
    // Total commissions (non-refunded): $6.80 + $9.60 + $3.60 + $4.80 = $24.80 ✓
  }

  return Response.json({
    ok: true,
    itemsCreated,
    projectsCreated,
    conversationsCreated,
    transactionsCreated,
    creditsBalance: existingCredits.balance,
    platformsCreated,
    botsCreated,
    metricsUpserted,
    subscriptionCreated,
    whiteGloveCreated,
    contractorsCreated,
    reconBotsCreated,
    shippingLabelsCreated,
    notificationsCreated,
    testimonialsCreated,
    financialSeeded,
    message: itemsCreated === 0 && projectsCreated === 0
      ? "Demo data already seeded — all items and projects exist."
      : `Created ${itemsCreated} item(s), ${projectsCreated} project(s), ${conversationsCreated} conversations, ${transactionsCreated} transactions. Credits: ${existingCredits.balance}. Platforms: ${platformsCreated}. Bots: ${botsCreated}. Metrics: ${metricsUpserted}. Subscription: ${subscriptionCreated ? "created" : "exists"}. WG Project: ${whiteGloveCreated ? "created" : "exists"}. Contractors: ${contractorsCreated}. ReconBots: ${reconBotsCreated}. Shipping: ${shippingLabelsCreated}. Notifications: ${notificationsCreated}. Testimonials: ${testimonialsCreated}. Financial: ${financialSeeded ? "seeded" : "exists"}.`,
  });
}
