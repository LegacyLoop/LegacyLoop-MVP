export interface HelpArticle {
  slug: string;
  title: string;
  category: string;
  categoryIcon: string;
  summary: string;
  content: string;
  lastUpdated: string;
}

export interface HelpCategory {
  name: string;
  icon: string;
  description: string;
  count: number;
}

export const helpArticles: HelpArticle[] = [
  // ── Getting Started ───────────────────────────────────────────────────────
  {
    slug: "how-to-list-first-item",
    title: "How to List Your First Item",
    category: "Getting Started",
    categoryIcon: "🚀",
    summary:
      "A step-by-step guide to uploading your first photo, getting an AI price estimate, and publishing your listing.",
    content: `Listing your first item on LegacyLoop takes about two minutes. Our AI handles the hard part — identifying what you have, estimating its value, and suggesting the best way to sell it. Here is how to get started.

1. Go to your Dashboard and click the "+ New Item" button in the top-right corner. You will be taken to the upload page.

2. Upload at least one clear photo of the item. Use good lighting and capture the front, back, and any labels or markings. You can upload up to 10 photos depending on your plan. Drag to reorder them, and the first photo becomes the primary listing image.

3. Fill in the title and a short description. Include any details you know — age, brand, material, or where the item came from. The more context you give, the better the AI estimate.

4. Choose your sale method. "Local Pickup" means buyers come to you. "Ship Nationwide" opens your listing to the entire country. "Both" gives buyers either option.

5. Click "Create Item" to save. Your item starts in Draft status.

6. On the item page, click "Analyze with AI." Our OpenAI Vision model examines every photo, identifies the item, checks for antique markers, and generates a price estimate based on live market data and your local demand.

7. Review the pricing breakdown. You will see a Local Pickup price, a Ship Nationwide price, and — if your area has strong demand — a Best Market recommendation. The confidence score tells you how certain the AI is.

8. If you want a second opinion, run MegaBot (5 credits). It queries four separate AI models in parallel and builds a consensus estimate.

9. When you are happy with the price, set a listing price and change the status to "Listed." Your item is now live on your public storefront and visible to buyers.

10. Share your listing link on social media or let our Buyer Bots find interested buyers automatically.`,
    lastUpdated: "2026-03-01",
  },
  {
    slug: "understanding-ai-pricing",
    title: "Understanding Your AI Price Estimate",
    category: "AI Pricing",
    categoryIcon: "🤖",
    summary:
      "Learn how LegacyLoop calculates local vs. national pricing, confidence scores, and how MegaBot consensus works.",
    content: `Every item you analyze on LegacyLoop receives a detailed pricing breakdown powered by AI and real market data. Here is what each part means and how to use it.

Local Pickup Price: This is what your item is likely to sell for to someone in your area. It factors in your zip code's market demand. High-demand areas like Portland, Boston, or New York see higher local prices, while rural areas may see a discount of 10-30 percent compared to the national average.

Ship Nationwide Price: This is the price you can expect when selling to buyers anywhere in the country via shipping. It removes the local demand factor and reflects the full national market. Shipping nationwide almost always gets you a higher price, though you need to subtract shipping costs and our 10 percent platform fee.

Best Market: LegacyLoop identifies the metro area where your item would fetch the highest price. For example, mid-century furniture sells best in Brooklyn and San Francisco, while vintage tools do well in the Midwest.

Confidence Score: Every estimate includes a confidence percentage from 1 to 100. Scores above 75 mean the AI found strong comparable sales data. Scores below 50 mean the item is unusual and you may want additional analysis. Confidence is based on how many similar items have recently sold at known prices.

MegaBot Consensus: For 5 credits, you can run MegaBot — our multi-AI system. It sends your item to four separate AI models (OpenAI, Claude, Gemini, and Grok) simultaneously. Each model independently estimates the value. MegaBot then compares all four results and produces a consensus price. If all four agree within a tight range, you can be very confident in the estimate. If they disagree, MegaBot flags the item for further review.

Market Comps: When available, the system pulls recent sold listings from eBay and other marketplaces to anchor the AI estimate in real transaction data. These comparable sales are shown on your item page so you can verify the pricing yourself.

Tip: If the confidence score is low, add more photos showing labels, markings, or condition details. The AI improves dramatically with better visual information.`,
    lastUpdated: "2026-03-02",
  },
  // ── Shipping ──────────────────────────────────────────────────────────────
  {
    slug: "ship-without-printer",
    title: "How to Ship Without a Printer",
    category: "Shipping",
    categoryIcon: "📦",
    summary:
      "No printer? No problem. Use our QR code option to get your label printed at the post office.",
    content: `You do not need a printer to ship items on LegacyLoop. We offer a QR code delivery method that lets you walk into the post office with just your phone. Here is how it works step by step.

1. Sell your item. Once a buyer confirms the purchase and payment is processed, the item status changes to "Sold." You will see a green congratulations banner on the item page with a "Ship Now" button.

2. Click "Ship Now" to open the Shipping Panel. It appears right on your item page in a step-by-step wizard format.

3. In Step 1, confirm your package details. LegacyLoop uses AI to suggest the right box size and weight based on what the item is. Adjust if needed — especially the weight, since carriers charge by weight.

4. In Step 2, enter or confirm the buyer's shipping address. If the buyer provided it during checkout, it will be pre-filled.

5. In Step 3, choose your carrier. You will see rates from USPS, UPS, and FedEx side by side with estimated delivery times. Pick the one that fits your budget and timeline.

6. In Step 4, select "QR Code" as your delivery method instead of "Print Label." The system generates a scannable QR code that contains all your shipping information.

7. Save the QR code to your phone. You can screenshot it or use the "Save to Wallet" option if available.

8. Take your packaged item to any USPS location (or the relevant carrier). Show the QR code on your phone screen to the clerk. They will scan it, print the label on the spot, and attach it to your package.

9. Once the package is scanned in, tracking updates automatically appear on your LegacyLoop item page. Both you and the buyer can follow the shipment through our 5-step tracking timeline: Label Created, Picked Up, In Transit, Out for Delivery, and Delivered.

10. When the item is delivered, LegacyLoop confirms delivery and your payout becomes available within 3-5 business days.

Tip: USPS is usually the most affordable option for items under 5 pounds. For heavier or fragile items, UPS and FedEx often provide better handling.`,
    lastUpdated: "2026-03-02",
  },
  // ── Account & Billing ─────────────────────────────────────────────────────
  {
    slug: "how-payouts-work",
    title: "How Do I Get Paid After a Sale?",
    category: "Account & Billing",
    categoryIcon: "👤",
    summary:
      "Everything you need to know about payouts — timing, methods, and how to track your earnings.",
    content: `Getting paid on LegacyLoop is straightforward. We hold funds in escrow during the transaction to protect both you and the buyer, then release your earnings once everything is confirmed. Here is the full process.

1. Sale Confirmed: When a buyer purchases your item, the payment is captured and held securely. You will receive a notification and the item status changes to "Sold."

2. Ship the Item: Package and ship the item using our shipping wizard. You can print a label at home or use the QR code method at the post office. LegacyLoop tracks the shipment automatically.

3. Delivery Verified: Once the carrier confirms delivery, LegacyLoop marks the item as "Completed." The buyer has a 24-hour window to report any issues. If no issues are raised, your payout is released.

4. Payout Available: Your earnings appear in your Payments dashboard under "Available Balance." LegacyLoop deducts a 10 percent platform fee from the sale price. Shipping costs are paid by the buyer separately and do not reduce your payout.

5. Withdrawal Options: You can withdraw your balance using three methods. Direct Deposit (ACH) transfers funds to your bank account in 3-5 business days. PayPal transfers arrive within 1-2 business days. Check by mail takes 7-10 business days.

6. Minimum Withdrawal: The minimum withdrawal amount is $10.00. There is no fee for ACH or PayPal withdrawals. Check withdrawals have a $2.00 processing fee.

7. Payout Schedule: You can request a payout at any time once your balance reaches the minimum. There is no automatic withdrawal schedule — you control when you get paid.

8. Tax Reporting: If you earn more than $600 in a calendar year, LegacyLoop will issue a 1099-K form for tax purposes. You can view your annual earnings summary in the Payments section.

For local pickup sales, the buyer pays you directly at the time of pickup. LegacyLoop does not handle payment for in-person transactions, but we still track the sale in your account for your records.

Tip: Set up direct deposit in your account settings ahead of time so your first payout is ready to go as soon as you make a sale.`,
    lastUpdated: "2026-03-01",
  },
  {
    slug: "credits-explained",
    title: "What Are Credits and How Do I Use Them?",
    category: "Account & Billing",
    categoryIcon: "👤",
    summary:
      "Credits let you buy add-on services like MegaBot analysis, story capture, and professional appraisals.",
    content: `Credits are LegacyLoop's flexible currency for purchasing add-on services without upgrading your subscription. Think of them like tokens at an arcade — buy a pack and spend them on the services you need, when you need them.

How Credits Work:
Each credit is worth a fixed amount and can be spent on any service in our Add-On Marketplace. Your credit balance is shown in the navigation bar and on your Credits page. Credits never expire.

Credit Costs for Popular Services:
- MegaBot 4-AI Analysis: 5 credits. Sends your item to four AI models for a consensus price estimate.
- Story Capture: 5 credits. An AI-written narrative about the item's history and significance, perfect for listings and family archives.
- Professional Appraisal Request: 15 credits. A certified appraiser reviews your item remotely and provides a formal written appraisal.
- Background Removal: 2 credits. AI removes the background from your item photo for a clean, professional look.
- Social Media Kit: 3 credits. Generates optimized images and captions for Facebook Marketplace, Instagram, and other platforms.
- Priority Support: 10 credits. Jump to the front of the support queue for urgent questions.

How to Get Credits:

1. Buy a Package: Visit the Credits page to purchase credit packs. Packages start at 25 credits for $5 and go up to 500 credits for $75 (the best value at 15 cents per credit).

2. Referral Bonus: Every time someone signs up using your referral link and lists their first item, you earn 25 bonus credits. There is no limit to referral earnings.

3. Welcome Bonus: New users receive 25 free credits when they create an account and complete the onboarding quiz.

4. Seasonal Promotions: We occasionally run double-credit events and bonus offers. Follow us on social media or enable notifications to stay informed.

How to Spend Credits:
Go to any item page and look for services marked with a credit cost. You can also browse the full Add-On Marketplace at the /marketplace page. Click "Use Credits" on any service, confirm the purchase, and the service runs immediately. Your balance updates in real time.

Tip: The 200-credit pack ($25) is the most popular choice. It covers about 40 MegaBot analyses or 13 story captures.`,
    lastUpdated: "2026-03-02",
  },
  // ── Selling & Buyers ──────────────────────────────────────────────────────
  {
    slug: "buyer-bots-overview",
    title: "How Do Buyer Bots Find Buyers for Me?",
    category: "Selling & Buyers",
    categoryIcon: "💰",
    summary:
      "Our MegaBuying Bots scan multiple platforms to find interested buyers and deliver leads directly to your dashboard.",
    content: `LegacyLoop's MegaBuying Bot system automatically searches for potential buyers across multiple online platforms so you don't have to. When activated, bots scan Facebook Marketplace, Craigslist, eBay, and other sites for people looking for items like yours. Matching leads appear on your item page with contact info and a compatibility score. You can review each lead, mark them as contacted, and track responses — all from one place. Activate a bot from any listed item page for free on most plans.`,
    lastUpdated: "2026-03-01",
  },
  // ── White-Glove ───────────────────────────────────────────────────────────
  {
    slug: "white-glove-overview",
    title: "What Is White-Glove Estate Service?",
    category: "White-Glove",
    categoryIcon: "🏠",
    summary:
      "Our team manages your entire estate sale from start to finish — photography, pricing, buyers, and shipping.",
    content: `White-Glove is LegacyLoop's premium full-service option for estate sales. Our team comes to your home, photographs every item, runs AI analysis, sets prices, coordinates buyers, and handles all shipping. You sit back and receive payouts as items sell. Three tiers are available: Essentials (up to 50 items), Complete (up to 150 items), and Premium (unlimited items with dedicated project manager). Currently available in Maine with expansion planned. Request a quote at the /quote page.`,
    lastUpdated: "2026-03-01",
  },
  // ── Safety & Trust ────────────────────────────────────────────────────────
  {
    slug: "safe-local-pickup",
    title: "Tips for Safe Local Pickup",
    category: "Safety & Trust",
    categoryIcon: "🔒",
    summary:
      "Best practices for meeting buyers in person, choosing safe locations, and handling cash transactions.",
    content: `Local pickup is a great way to sell without shipping hassles, but safety comes first. Always meet in a public, well-lit location like a police station lobby or busy coffee shop. Bring a friend if possible. Accept cash or verified digital payments only — never accept personal checks. Share your meeting details with someone you trust. LegacyLoop logs all buyer conversations so you have a record of every interaction. If a buyer pressures you or something feels off, trust your instincts and cancel the meeting.`,
    lastUpdated: "2026-03-01",
  },
  // ── Veterans & Heroes ─────────────────────────────────────────────────────
  {
    slug: "heroes-discount-program",
    title: "Heroes Discount Program (25% Off)",
    category: "Veterans & Heroes",
    categoryIcon: "🏅",
    summary:
      "Military veterans, law enforcement, and first responders receive 25% off all LegacyLoop plans.",
    content: `LegacyLoop proudly offers a 25 percent discount on all subscription plans and credit packages for military veterans, active-duty service members, law enforcement officers, firefighters, and EMTs. To activate your discount, visit the /heroes page and verify your status through our partner verification service. Once verified, the discount applies automatically to all future purchases. The discount stacks with pre-launch founding member pricing for maximum savings. Thank you for your service.`,
    lastUpdated: "2026-03-02",
  },
];

export const helpCategories: HelpCategory[] = [
  {
    name: "Getting Started",
    icon: "🚀",
    description: "Set up your account and list your first item",
    count: helpArticles.filter((a) => a.category === "Getting Started").length,
  },
  {
    name: "AI Pricing",
    icon: "🤖",
    description: "How our AI estimates value and finds comps",
    count: helpArticles.filter((a) => a.category === "AI Pricing").length,
  },
  {
    name: "Selling & Buyers",
    icon: "💰",
    description: "Manage listings, buyers, and negotiations",
    count: helpArticles.filter((a) => a.category === "Selling & Buyers").length,
  },
  {
    name: "Shipping",
    icon: "📦",
    description: "Labels, carriers, tracking, and QR codes",
    count: helpArticles.filter((a) => a.category === "Shipping").length,
  },
  {
    name: "White-Glove",
    icon: "🏠",
    description: "Full-service estate sale management",
    count: helpArticles.filter((a) => a.category === "White-Glove").length,
  },
  {
    name: "Account & Billing",
    icon: "👤",
    description: "Payments, credits, subscriptions, and payouts",
    count: helpArticles.filter((a) => a.category === "Account & Billing").length,
  },
  {
    name: "Safety & Trust",
    icon: "🔒",
    description: "Stay safe with local pickups and transactions",
    count: helpArticles.filter((a) => a.category === "Safety & Trust").length,
  },
  {
    name: "Veterans & Heroes",
    icon: "🏅",
    description: "Discounts for veterans and first responders",
    count: helpArticles.filter((a) => a.category === "Veterans & Heroes").length,
  },
];

export function getArticleBySlug(slug: string): HelpArticle | undefined {
  return helpArticles.find((a) => a.slug === slug);
}

export function getArticlesByCategory(category: string): HelpArticle[] {
  return helpArticles.filter((a) => a.category === category);
}

export function searchArticles(query: string): HelpArticle[] {
  const q = query.toLowerCase().trim();
  if (!q) return helpArticles;
  return helpArticles.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q)
  );
}
