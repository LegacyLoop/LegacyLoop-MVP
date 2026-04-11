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
    slug: "signing-up-and-setup",
    title: "Signing Up and Setting Up Your Account",
    category: "Getting Started",
    categoryIcon: "🚀",
    summary:
      "A friendly walkthrough for creating your LegacyLoop account and getting everything ready to start selling.",
    content: `Welcome to LegacyLoop! Creating your account is quick and easy. In just a few minutes you will be ready to start turning your treasured items into cash. Here is how to get set up.

1. Visit the LegacyLoop homepage and click "Sign Up" in the top-right corner. You can also go directly to the /signup page.

2. Enter your name, email address, and choose a password. Your password should be at least 8 characters. Click "Create Account" to continue.

3. You will be taken to the onboarding quiz. This short 6-question quiz helps us understand what you are selling and recommends the best plan for your needs. You can skip it if you prefer, but we recommend taking a minute to answer — it personalizes your entire experience.

4. After the quiz, you will see your personalized plan recommendation on the results page. You can choose that plan or pick a different one from the pricing page. Every new account starts with 25 free credits to try out our AI services.

5. Once you are logged in, take a moment to complete your profile. Click on your avatar in the top-right corner and select "Settings." Add your zip code — this is important because LegacyLoop uses your location to calculate local market demand and shipping estimates.

6. If you plan to sell on other platforms too, visit the Integrations page to connect your Facebook, eBay, Craigslist, or other marketplace accounts. This lets you cross-post listings with one click.

7. You are all set! Head to your Dashboard and click "+ New Item" to list your first item. Our AI will handle the identification and pricing for you.

Tip: Bookmark your Dashboard page so you can get back to it easily. If you ever get lost, click the LegacyLoop logo in the top-left corner to return home.`,
    lastUpdated: "2026-03-30",
  },
  {
    slug: "understanding-the-quiz",
    title: "Understanding the Onboarding Quiz",
    category: "Getting Started",
    categoryIcon: "🚀",
    summary:
      "Learn how our 6-question quiz recommends the perfect plan and personalizes your LegacyLoop experience.",
    content: `When you first create your LegacyLoop account, we ask you six quick questions. This quiz is not a test — there are no wrong answers. It simply helps us understand your situation so we can recommend the right plan and set up your experience. Here is what each question covers and why it matters.

Question 1 asks about your selling situation. Are you handling an estate? Downsizing? Just cleaning out? This helps us know whether to suggest project-based tools or single-item features.

Question 2 asks roughly how many items you plan to sell. If you have just a handful of things, our Starter plan works great. If you have dozens or hundreds, we will recommend Plus or Pro for the higher item limits and bulk tools.

Question 3 asks about your comfort level with technology. Be honest here! If you prefer simple step-by-step guidance, we will make sure the interface highlights our most user-friendly features. If you are tech-savvy, we will point you toward power tools like MegaBot and the Bot Hub.

Question 4 asks whether you want to ship items or sell locally. This shapes your default sale method and whether we emphasize shipping tools or local pickup features.

Question 5 asks if any of your items might be antiques or collectibles. If so, we will make sure the Antique Alert system and expert appraisal options are front and center.

Question 6 asks about your timeline. Selling this weekend? We will prioritize quick-list tools. Have a few months? We will suggest taking time to get the best prices with MegaBot analysis.

After you finish, you will land on the Results page at /onboarding/results. This page shows your personalized plan recommendation with pricing, a summary of which features matter most for your situation, and a button to get started right away.

You can retake the quiz anytime by visiting /onboarding/quiz. Your recommendation may change as your needs evolve.

Tip: The quiz takes about 60 seconds. It is the fastest way to make sure you are on the right plan and not paying for features you do not need.`,
    lastUpdated: "2026-03-30",
  },
  {
    slug: "navigating-the-dashboard",
    title: "Navigating Your Dashboard",
    category: "Getting Started",
    categoryIcon: "🚀",
    summary:
      "A complete guide to your Dashboard — stats, item cards, projects, alerts, and quick actions.",
    content: `Your Dashboard is home base on LegacyLoop. Everything you need is right here. Let us walk through each section so you know exactly where to find things.

At the top of the Dashboard, you will see your Stats Bar. This shows four key numbers at a glance: Total Items (everything you have uploaded), Analyzed Items (items the AI has processed), Antique Count (items flagged as potential antiques), and Portfolio Value (the total estimated value of all your items). These numbers update in real time as you add and analyze items.

Below the stats, you may see an Alerts Widget. This shows notifications from your Recon Bots — things like price drops on competitor listings, new buyers searching for items like yours, and market trend alerts. Click any alert to jump straight to the relevant item.

The Items section shows all your items as cards. Each card displays the primary photo, title, status badge, and estimated price. You can click the three-dot menu on any card to change its status, edit the listing price, or delete the item. Status badges are color-coded: gray for Draft, blue for Analyzed, green for Ready, purple for Listed, orange for Interested, and gold for Sold.

If you have created Projects (estate sales or garage sales), they appear in their own section with a progress bar showing how many items have been sold out of the total.

The Activity Feed at the bottom shows recent events — new buyer messages, bot scan results, price changes, and shipping updates. It is a timeline of everything happening across your account.

Quick Actions: The "+ New Item" button is always in the top-right corner. On mobile, look for the teal floating button at the bottom of the screen. You can also use the keyboard shortcut Ctrl+N (or Cmd+N on Mac) to start a new item from anywhere.

The "Load Demo Data" button (shown with a lightning bolt icon) lets you populate your account with sample items if you want to explore the platform before uploading your own things.

Tip: Check your Dashboard daily when you have active listings. The alerts and activity feed keep you informed so you never miss a buyer inquiry or price opportunity.`,
    lastUpdated: "2026-03-30",
  },
  // ── AI Pricing ────────────────────────────────────────────────────────────
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
  {
    slug: "complete-shipping-guide",
    title: "Complete Shipping Guide: Parcel, Freight, and Local Pickup",
    category: "Shipping",
    categoryIcon: "📦",
    summary:
      "Everything you need to know about shipping options — small parcels, large freight items, and local pickup coordination.",
    content: `LegacyLoop supports three ways to get items to buyers: standard parcel shipping, freight shipping for large items, and local pickup. Here is a comprehensive guide to each option.

Standard Parcel Shipping is best for items that fit in a box and weigh under 70 pounds. This covers the vast majority of items people sell — dishes, books, collectibles, small furniture, electronics, and more. LegacyLoop compares rates from USPS, UPS, and FedEx in real time so you always get the best price. Our AI suggests the right box size and whether the item needs fragile handling.

1. After your item sells, click "Ship Now" on the item page.
2. Confirm or adjust the package dimensions and weight. Our AI pre-fills these based on the item category.
3. Enter the buyer's address (or confirm the pre-filled one).
4. Compare carrier rates and delivery times side by side.
5. Choose "Print Label" or "QR Code" and you are done.

Freight Shipping is for large, heavy items like furniture, pianos, or appliances that cannot go through standard carriers. LegacyLoop partners with freight carriers for items over 70 pounds or larger than 108 inches combined length and girth. Freight shipments include liftgate service and inside delivery options.

Local Pickup is the simplest option. The buyer comes to you. When you mark an item as "Local Pickup," buyers see your general area (city, not exact address) on the listing. Once a buyer is confirmed, you coordinate a meeting time through the messaging system. We recommend meeting in a public, well-lit location for safety.

Packaging Tips: For fragile items like china, glassware, or ceramics, use double-boxing with at least 2 inches of cushioning on all sides. Wrap each piece individually in bubble wrap. LegacyLoop's ShipBot flags items that likely need fragile handling and suggests appropriate packaging.

Shipping Costs: The buyer pays shipping on top of the item price. Your listing price is what you receive (minus the platform fee). LegacyLoop shows buyers estimated shipping costs before they purchase so there are no surprises.

Tip: If you are not sure whether to offer shipping or local pickup, choose "Both." This gives you the widest pool of buyers while still allowing someone local to save on shipping.`,
    lastUpdated: "2026-03-30",
  },
  {
    slug: "shipping-center-overview",
    title: "Using the Shipping Center Dashboard",
    category: "Shipping",
    categoryIcon: "📦",
    summary:
      "A walkthrough of the Shipping Center where you manage all your labels, tracking, and shipment history.",
    content: `The Shipping Center is your one-stop dashboard for managing every shipment on LegacyLoop. You can find it by clicking the shipping icon in your navigation bar or by visiting any sold item's page. Here is what you will find.

Active Shipments: At the top of the Shipping Center, you will see all shipments currently in transit. Each one shows the item name, carrier, tracking number, current status, and estimated delivery date. Click any shipment to see the full tracking timeline with all status updates.

Pending Shipments: Below that, you will see items that have been sold but not yet shipped. Each one has a "Ship Now" button that opens the shipping wizard right on the item page. Items are sorted by how long ago they sold, so the oldest pending shipments appear first.

Completed Shipments: A history of all delivered shipments with delivery confirmation dates. This is useful for your records and for resolving any disputes.

The Shipping Panel on each item page walks you through four steps: confirm package details, enter the buyer's address, choose a carrier, and create the label. LegacyLoop's AI pre-fills the package dimensions and weight based on the item category, so you usually just need to verify and click through.

Tracking Timeline: Every shipment gets a visual 5-step timeline — Label Created, Picked Up, In Transit, Out for Delivery, and Delivered. The current step pulses with a gentle animation so you can see the status at a glance. Both you and the buyer can view this timeline.

Notifications: You will receive a notification (visible via the bell icon in the top navigation) whenever a shipment status changes. The buyer receives notifications too, so they always know where their item is.

Tip: Ship within 2 business days of the sale for the best buyer experience. Quick shipping leads to positive reviews and repeat customers.`,
    lastUpdated: "2026-03-30",
  },
  {
    slug: "tracking-your-shipment",
    title: "Tracking Your Shipment Step by Step",
    category: "Shipping",
    categoryIcon: "📦",
    summary:
      "How to follow your shipment from label creation to delivery using the tracking timeline.",
    content: `Once you create a shipping label on LegacyLoop, tracking is automatic. You and your buyer can follow every step of the journey. Here is how to use the tracking system.

1. After you create a label (either by printing it or generating a QR code), the item status changes to "Shipped." A tracking timeline appears on the item page.

2. The timeline has five steps: Label Created, Picked Up, In Transit, Out for Delivery, and Delivered. The current step is highlighted with a pulsing animation so you can spot it instantly.

3. You do not need to do anything to update the tracking. LegacyLoop automatically checks for status changes and updates the timeline for you. The carrier provides the updates and we display them in real time.

4. Both you and the buyer receive notifications when the status changes. Look for the bell icon in the top-right corner of the navigation bar. Click it to see all recent notifications, including shipping updates.

5. If a shipment seems stuck or has not updated in a while, you can click the tracking number to view the full carrier tracking page directly. Sometimes carriers have a slight delay in updating their systems.

6. When the carrier confirms delivery, LegacyLoop marks the item as "Completed." The buyer has a 24-hour window to confirm receipt or report any issues. After that window closes, your payout is released.

7. You can view the complete tracking history for any shipment by visiting the item page. The timeline shows timestamps for each status change, so you have a full record.

What the Statuses Mean:
- Label Created: Your label has been generated but the carrier has not scanned the package yet.
- Picked Up: The carrier has received your package and it is in their system.
- In Transit: The package is moving through the carrier's network toward the destination.
- Out for Delivery: The package is on the delivery truck and will arrive today.
- Delivered: The package has been delivered to the buyer's address.

Tip: If you drop off a package at a carrier location and the status does not change to "Picked Up" within 24 hours, contact the carrier with your tracking number. Occasionally a scan gets missed at drop-off.`,
    lastUpdated: "2026-03-30",
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
  {
    slug: "managing-subscription",
    title: "Managing Your Subscription Plan",
    category: "Account & Billing",
    categoryIcon: "👤",
    summary:
      "How to upgrade, downgrade, or cancel your LegacyLoop subscription, and what happens when you change plans.",
    content: `LegacyLoop offers four subscription tiers: Free, Starter, Plus, and Pro. You can change your plan at any time from the Pricing page or your account settings. Here is how it all works.

To View Your Current Plan: Click your avatar in the top-right corner of the navigation bar and go to Settings. Your current plan name and renewal date are shown at the top of the page.

To Upgrade Your Plan:

1. Visit the /pricing page by clicking "Pricing" in the navigation bar or going directly to the URL.
2. Compare the four tiers side by side. Each tier shows the monthly price, item limits, photo limits, which bots are available, and special features.
3. Click "Choose Plan" on the tier you want.
4. Enter your payment information if you have not already. LegacyLoop processes payments through Stripe.
5. Your upgrade takes effect immediately. You get instant access to all the new features and higher limits.

When you upgrade mid-billing-cycle, you are charged a prorated amount for the remainder of the current period. So if you upgrade halfway through the month, you only pay half the difference.

To Downgrade Your Plan: Follow the same steps but choose a lower tier. Your downgrade takes effect at the end of your current billing period. You keep access to your current tier's features until then. If you have more items than the lower tier allows, you will not lose any items — but you will not be able to create new ones until you are within the limit.

To Cancel Your Plan: Go to Settings and click "Cancel Subscription." You will keep access through the end of your paid period. After that, your account reverts to the Free tier. All your items and data are preserved — you just cannot create new items beyond the Free limit.

Founding Member Pricing: If you signed up during our pre-launch period, you are locked in at 50 percent off for life as long as you maintain an active subscription. If you cancel and re-subscribe later, you will be at regular pricing.

Tip: Not sure which plan is right? Take the onboarding quiz at /onboarding/quiz for a personalized recommendation based on your selling needs.`,
    lastUpdated: "2026-03-30",
  },
  {
    slug: "platform-integrations",
    title: "Connecting Your Marketplace Accounts",
    category: "Account & Billing",
    categoryIcon: "👤",
    summary:
      "How to link Facebook, eBay, Craigslist, and other platforms for cross-platform listing and lead tracking.",
    content: `LegacyLoop connects to 10 popular selling platforms so you can manage everything from one place. When you connect a platform, you can cross-post listings and track leads coming from that platform. Here is how to set it up.

1. Go to the Integrations page by clicking "Integrations" in the navigation bar or visiting /integrations directly.

2. You will see cards for each supported platform: Facebook Marketplace, Instagram, eBay, Craigslist, Uncle Henry's, OfferUp, Mercari, Poshmark, Etsy, and Nextdoor.

3. Click "Connect" on any platform you use. For platforms that support direct integration (like eBay), you will be redirected to log in and authorize LegacyLoop. For platforms without APIs (like Craigslist), you will enter your account details manually.

4. Once connected, a green checkmark appears on the platform card. You can toggle cross-platform publishing on or off for each connected platform.

5. When cross-posting is enabled, creating a listing on LegacyLoop automatically generates ready-to-post content for each connected platform. The listing text, pricing, and photos are optimized for each platform's format.

6. Buyer leads from connected platforms are tracked in LegacyLoop. When someone messages you on Facebook Marketplace about an item you listed through LegacyLoop, that lead appears in your Buyer Leads section.

To Disconnect a Platform: Click the "Disconnect" button on any connected platform card. This removes the connection but does not delete any listings you already posted on that platform.

Supported Platforms: Facebook Marketplace (largest local audience), eBay (best for collectibles and antiques), Craigslist (great for furniture and large items), OfferUp (popular for local sales), Mercari (strong for clothing and accessories), Poshmark (fashion-focused), Etsy (handmade and vintage), Nextdoor (hyperlocal neighborhood sales), Instagram (visual showcase), and Uncle Henry's (popular in New England).

Tip: Connect at least 2-3 platforms to maximize your buyer reach. Items listed on multiple platforms sell 40 percent faster on average.`,
    lastUpdated: "2026-03-30",
  },
  {
    slug: "analytics-dashboard",
    title: "Understanding Your Analytics Dashboard",
    category: "Account & Billing",
    categoryIcon: "👤",
    summary:
      "A guide to the analytics page where you can track views, sales, revenue, and buyer engagement.",
    content: `The Analytics page gives you a clear picture of how your selling is going. You can find it by clicking "Analytics" in the navigation bar or visiting /analytics directly. Here is what each section tells you.

Overview Stats: At the top, you will see your key numbers — total items listed, total views across all items, total revenue earned, and average sale price. These are computed from your actual item and transaction data.

Views and Engagement: Each item on LegacyLoop tracks how many times it has been viewed, how many buyer inquiries it has received, and how many bot-generated leads have been created. The analytics page shows these in aggregate so you can see which items are getting the most attention.

Revenue Breakdown: If you have made sales, you will see a breakdown of your earnings. This shows the total sale prices, platform fees deducted, shipping costs (paid by buyers), and your net earnings. This helps you understand exactly how much you are taking home.

Item Performance: A list of your items sorted by engagement helps you identify your best performers. Items with lots of views but no inquiries might need a price adjustment or better photos. Items with inquiries but no sales might benefit from a MegaBot analysis to verify the pricing.

Time Period Filters: You can view analytics for the last 7 days, 30 days, 90 days, or all time. This helps you spot trends — are your views going up or down? Is a particular item gaining interest?

How to Use Analytics to Sell Faster:
- If an item has many views but no inquiries, try lowering the price by 10-15 percent.
- If an item has no views, improve the photos or add more details to the description.
- If you are getting inquiries but no sales, your price might be slightly too high — consider running MegaBot for a second opinion.

Tip: Check analytics once a week to stay on top of your listings. Small adjustments based on data can make a big difference in how fast items sell.`,
    lastUpdated: "2026-03-30",
  },
  {
    slug: "referral-program",
    title: "Earning Credits with the Referral Program",
    category: "Account & Billing",
    categoryIcon: "👤",
    summary:
      "How to share your referral link, earn bonus credits, and track your referral history.",
    content: `LegacyLoop's referral program rewards you with free credits every time someone you refer signs up and starts selling. It is one of the best ways to keep your credit balance topped up without spending a dime. Here is how it works.

1. Find Your Referral Code: Visit the /referral page by clicking "Refer" in the navigation bar. Your unique referral code is displayed at the top of the page. It is a short, easy-to-share code tied to your account.

2. Share Your Link: Below your code, you will see your full referral link. You can share it in three ways:
   - Click "Copy Link" to copy it to your clipboard and paste it anywhere — text messages, emails, social media posts.
   - Click "Email" to open a pre-written email with your referral link that you can send to friends and family.
   - Simply tell someone your code and they can enter it during signup.

3. Earn Credits: When someone signs up using your referral link or code and lists their first item, you automatically receive 25 bonus credits. The credits appear in your balance immediately.

4. Track Your Referrals: The referral page shows your referral history — who signed up, when they joined, and whether they have listed their first item yet. You can see exactly how many credits you have earned from referrals.

There is no limit to how many people you can refer. If you refer 10 people who each list an item, that is 250 free credits — enough for 50 MegaBot analyses.

Who Should You Refer? Think about friends and family who are downsizing, cleaning out a garage, handling an estate, or just have things around the house they no longer need. LegacyLoop works great for anyone with items to sell, regardless of their tech experience.

Tip: Share your referral link in local community groups (Facebook neighborhood groups, Nextdoor, church groups) where people often ask about selling household items. You will earn credits and help your neighbors discover an easier way to sell.`,
    lastUpdated: "2026-03-30",
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
  {
    slug: "editing-and-managing-items",
    title: "Editing and Managing Your Items",
    category: "Selling & Buyers",
    categoryIcon: "💰",
    summary:
      "How to edit photos, descriptions, prices, and status for your items after they are created.",
    content: `After you create an item on LegacyLoop, you can edit every detail at any time. Here is how to manage your items effectively.

To Edit an Item:

1. Go to your Dashboard and click on the item you want to edit. This takes you to the item detail page.

2. Click the "Edit" button near the top of the page. This opens the edit form with all your current item details pre-filled.

3. You can change the title, description, sale method (Local Pickup, Ship Nationwide, or Both), and zip code. Update anything that needs correcting or add more details to improve your AI analysis.

4. To manage photos, use the photo section at the top. You can add new photos (up to 10 total depending on your plan), delete existing ones, drag to reorder them, or rotate photos that are sideways. The first photo is always the primary listing image.

5. In the shipping section, you can update the package weight, dimensions (length, width, height), mark the item as fragile, and set your shipping preference.

6. Click "Save Changes" when you are done. Your updates take effect immediately.

To Change the Listing Price: You do not need to open the edit form to adjust the price. On the item page, click directly on the listing price and type a new number. Press Enter to save. You can also change it from the Dashboard by clicking the three-dot menu on the item card.

To Change the Status: Use the three-dot menu on the item card in your Dashboard, or the status dropdown on the item page. Statuses flow in order: Draft, Analyzed, Ready, Listed, Interested, Sold, Shipped, Completed. You can move forward or backward as needed.

To Delete an Item: Click the three-dot menu and select "Delete." You will be asked to confirm. Deleting removes the item and all associated data (photos, AI results, leads) permanently.

Tip: After editing, consider re-running the AI analysis if you added significant new information or better photos. The AI may give you a more accurate price with updated details.`,
    lastUpdated: "2026-03-30",
  },
  {
    slug: "understanding-item-statuses",
    title: "Understanding Item Statuses",
    category: "Selling & Buyers",
    categoryIcon: "💰",
    summary:
      "What each status means — from Draft to Completed — and how items flow through the selling process.",
    content: `Every item on LegacyLoop has a status that tells you and your buyers where it is in the selling process. Here is what each status means and when to use it.

Draft: This is where every item starts when you first create it. Draft items are only visible to you. Use this status while you are still adding photos and details before running the AI analysis.

Analyzed: After you click "Analyze with AI" and the analysis completes, the item automatically moves to Analyzed. This means the AI has identified the item, estimated its value, and checked for antique markers. The item is still only visible to you.

Ready: Set this status when you have reviewed the AI analysis and you are satisfied with the pricing but are not quite ready to list it publicly. Think of it as your "ready to go" staging area.

Listed: This is the big one. When you set an item to Listed, it becomes visible on your public storefront and can be found by buyers. Make sure you have set a listing price before changing to this status. Listed items appear on your /store page.

Interested: Use this when a buyer has expressed interest — sent a message, made an offer, or asked questions. It helps you track which items have active buyer conversations so you can prioritize follow-ups.

Sold: Mark an item as Sold when a buyer has committed to purchasing it and payment is confirmed. This triggers the green congratulations banner and makes the "Ship Now" button available.

Shipped: This status is set automatically when you create a shipping label. It means the item is on its way to the buyer. The tracking timeline becomes active.

Completed: The final status. This is set automatically when the carrier confirms delivery (or you can set it manually for local pickup sales). Completed items move to your sales history and your payout becomes available.

Status Badges on the Dashboard: Each status has a color-coded badge so you can scan your items quickly. Gray for Draft, blue for Analyzed, green for Ready, purple for Listed, orange for Interested, gold for Sold, and teal for Shipped and Completed.

Tip: Keep your statuses up to date. Accurate statuses help your Buyer Bots and Recon Bots work more effectively, and they let buyers know which items are still available.`,
    lastUpdated: "2026-03-30",
  },
  {
    slug: "using-bundles",
    title: "Bundling Multiple Items for Sale",
    category: "Selling & Buyers",
    categoryIcon: "💰",
    summary:
      "How to group related items into bundles to sell them together at a discount.",
    content: `Bundling is a smart way to sell multiple related items together. Buyers love bundles because they get a discount, and you love bundles because you move more items at once with less shipping hassle. Here is how to use bundles on LegacyLoop.

What is a Bundle? A bundle groups two or more items into a single listing. For example, you might bundle a set of vintage teacups with their saucers, or a collection of books by the same author. The buyer purchases everything at once for a single price.

How to Create a Bundle:

1. First, create each individual item and run the AI analysis on each one. This gives you a baseline price for every item in the bundle.

2. On any item page, look for the "Add to Bundle" option. Select the other items you want to include.

3. Set a bundle price. LegacyLoop suggests a bundle discount of 10-15 percent off the combined individual prices. You can adjust this to whatever you think is fair.

4. The bundle appears as a single listing on your storefront. Buyers see all the items included with individual photos and descriptions, plus the bundle savings.

When to Bundle:
- Sets and collections: Matching dishes, book series, tool sets
- Estate groupings: "Grandmother's sewing room" with machine, fabrics, patterns
- Category lots: "Vintage kitchen lot" with multiple small items
- Items that are hard to sell individually but valuable as a group

Pricing Tips: A good rule of thumb is 10-20 percent off the combined individual prices. This gives buyers a clear incentive while still getting you a fair price for the lot. Items under $10 individually often sell much better in bundles.

Tip: Bundles work especially well for local pickup. Buyers are more willing to drive to you when they are getting several items at once.`,
    lastUpdated: "2026-03-30",
  },
  {
    slug: "offers-and-counteroffers",
    title: "Handling Offers and Counter-Offers",
    category: "Selling & Buyers",
    categoryIcon: "💰",
    summary:
      "How the offer flow works — receiving offers, making counter-offers, and accepting or declining.",
    content: `When a buyer is interested in your item, they can send you an offer through LegacyLoop's messaging system. Here is how the offer process works from start to finish.

Receiving an Offer: When a buyer makes an offer, you will see it in your Message Center (accessible from the navigation bar or at /messages). The offer shows the buyer's proposed price alongside your listing price. You also get a notification via the bell icon.

Your Options: When you receive an offer, you have three choices:

1. Accept: If the price works for you, click "Accept." The item status changes to Sold and the payment process begins. The buyer is notified immediately.

2. Decline: If the offer is too low and you are not interested in negotiating, click "Decline." The buyer is notified and can choose to make a new offer or move on. Declining does not block the buyer from making another offer.

3. Counter-Offer: If the offer is close but not quite right, click "Counter" and enter your counter-price. The buyer then has the same three options — accept, decline, or counter back.

Counter-Offer Tips:
- Do not counter too many times. Two rounds of counter-offers is usually the maximum before a buyer loses interest.
- Meet in the middle. If your item is listed at $100 and the buyer offers $70, a counter of $85 shows good faith.
- Consider the item's time on market. If an item has been listed for weeks with no other interest, a lower offer might be worth accepting.
- Factor in your costs. Remember the 10 percent platform fee and any shipping costs when evaluating offers.

Quick Replies: LegacyLoop provides quick reply templates for common responses like "Thanks for your offer, but I am firm on the price" or "I can do [amount] — does that work for you?" These save time when you are managing multiple conversations.

Offer History: All offers and counter-offers are logged in the conversation thread so you have a complete record of the negotiation.

Tip: Respond to offers within 24 hours. Quick responses show buyers you are serious and dramatically increase the chance of closing a sale.`,
    lastUpdated: "2026-03-30",
  },
  {
    slug: "enabling-trades",
    title: "Enabling Trades on Your Listings",
    category: "Selling & Buyers",
    categoryIcon: "💰",
    summary:
      "How trades work on LegacyLoop — cash plus items, trade-only, and how to evaluate trade offers.",
    content: `LegacyLoop supports trades in addition to traditional cash sales. If you are open to receiving other items as part of a deal, you can enable trades on any listing. Here is how it works.

Enabling Trades: When you create or edit an item, look for the "Open to Trades" toggle. Turn it on and your listing will display a trade icon that lets buyers know you will consider trade offers.

Types of Trades:
- Straight Trade: You swap your item for the buyer's item with no cash exchanging hands. Both items should be of roughly equal value.
- Cash Plus Trade: The buyer offers an item plus cash to make up the difference in value. For example, they offer a $50 item plus $30 cash for your $80 item.
- Multi-Item Trade: The buyer offers multiple items for your single item, or vice versa.

Receiving a Trade Offer: When a buyer proposes a trade through the messaging system, they describe what they are offering (and ideally include photos). You can then:

1. Review their item description and photos carefully.
2. Check if the offered item has been analyzed on LegacyLoop — if so, you can see its AI-estimated value.
3. Accept, decline, or counter with your terms (for example, "I would accept your item plus $20 cash").

Evaluating Trade Offers: Consider these factors:
- Is the offered item something you actually want or can easily resell?
- Does the AI valuation of both items support a fair trade?
- Would you be better off selling your item for cash and buying what you want separately?

Safety with Trades: For trade exchanges, always meet in a public location. Both parties should inspect the items before finalizing. LegacyLoop logs the trade agreement in your transaction history for your records.

Tip: Trades work best for items in similar categories. A collector offering to trade one antique for another is a natural fit. Be cautious about trades where the values are hard to compare.`,
    lastUpdated: "2026-03-30",
  },
  {
    slug: "connected-platforms",
    title: "Cross-Platform Listing with Connected Accounts",
    category: "Selling & Buyers",
    categoryIcon: "💰",
    summary:
      "How to list your items on Facebook, eBay, Craigslist, and 7 other platforms from one place.",
    content: `One of LegacyLoop's most powerful features is the ability to list your items across multiple selling platforms without creating separate listings on each one. Here is how cross-platform listing works.

Setting Up: First, connect your marketplace accounts on the Integrations page (/integrations). LegacyLoop supports 10 platforms: Facebook Marketplace, Instagram, eBay, Craigslist, Uncle Henry's, OfferUp, Mercari, Poshmark, Etsy, and Nextdoor.

How Cross-Posting Works:

1. Create your item on LegacyLoop as normal — upload photos, add a description, run the AI analysis, and set your price.

2. When you change the status to "Listed," LegacyLoop automatically generates optimized listing content for each connected platform. Each platform has different requirements (title length, description format, category tags), and we handle all of that for you.

3. For platforms with direct API integration (like eBay), the listing is posted automatically. For other platforms, LegacyLoop gives you ready-to-paste content that you copy into the platform's posting form.

4. When a buyer contacts you on any connected platform, the inquiry is tracked in LegacyLoop's Buyer Leads section. This means you can see all your buyer activity in one place regardless of which platform it came from.

Managing Cross-Platform Listings: When you sell an item on one platform, remember to update or remove the listing on other platforms. Changing the status to "Sold" on LegacyLoop will prompt you to delist from connected platforms.

Platform-Specific Tips:
- Facebook Marketplace: Best for furniture, home goods, and local sales. Use all 10 photo slots.
- eBay: Ideal for collectibles, antiques, and niche items with national demand. Our ListBot optimizes titles for eBay search.
- Craigslist: Great for large items and free stuff. Keep descriptions concise.
- Etsy: Best for vintage (20+ years old) and handmade items.
- OfferUp and Mercari: Popular for quick local sales of everyday items.

Tip: You do not need to connect all 10 platforms. Start with the 2-3 where your type of items sell best. You can always add more later.`,
    lastUpdated: "2026-03-30",
  },
  // ── AI & Bots ─────────────────────────────────────────────────────────────
  {
    slug: "what-is-bot-hub",
    title: "What Is Bot Hub? Your 11-Bot AI Team",
    category: "AI & Bots",
    categoryIcon: "🤖",
    summary:
      "An overview of all 11 LegacyLoop bots and how they work together to help you sell smarter and faster.",
    content: `Bot Hub is LegacyLoop's command center for all 11 AI-powered bots that work together to help you sell. Think of it as your personal team of specialists — each one handles a different part of the selling process so you do not have to. Here is a quick introduction to each bot.

AnalyzeBot: Looks at your photos and identifies what the item is — maker, material, era, style, condition, and markings. This is the first bot that runs when you click "Analyze with AI."

PriceBot: Takes the identification from AnalyzeBot and finds the right price using 42 marketplace data sources. It gives you local, national, and best-market pricing.

ListBot: Creates ready-to-post listings optimized for 10+ platforms. Each listing has the right title format, keywords, and description style for the platform.

PhotoBot: Enhances your photos with better lighting, contrast, and background removal. Makes your items look professional without a photography setup.

ShipBot: Estimates shipping costs, recommends packaging, compares carrier rates, and flags fragile items that need special handling.

CarBot: Specializes in vehicle evaluation. Uses NHTSA safety data and VIN decoding to value cars, trucks, motorcycles, and recreational vehicles.

AntiqueBot: The antique authentication specialist. Uses 78 signals to detect antiques and estimates auction value for items that qualify.

CollectiblesBot: Focuses on grading collectibles like trading cards, coins, stamps, and sports memorabilia. References PSA and BGS grading standards.

ReconBot: Your market intelligence agent. Monitors competitor listings across platforms, alerts you to price changes, and spots trends in your item categories.

MegaBot: The consensus engine. Sends your item to 4 separate AI models simultaneously and compares their results to produce the most reliable estimate possible.

MegaBuying Bot: Scans buyer activity across platforms to find people actively looking for items like yours and delivers leads to your dashboard.

You can access all your active bots and their status from the /bots page. Each bot card shows its current state, recent results, and a quick action button.

Which Bots Are Available to You: Your subscription tier determines which bots you can use. Free and Starter plans include AnalyzeBot, PriceBot, and ShipBot. Plus plans add ListBot, PhotoBot, AntiqueBot, and MegaBuying Bot. Pro plans include all 11 bots. You can also use credits to access individual bots on a pay-per-use basis.

Tip: You do not need to understand how each bot works to use them. Just upload your item, click "Analyze with AI," and the right bots activate automatically based on what the item is.`,
    lastUpdated: "2026-03-30",
  },
  {
    slug: "how-analyzebot-works",
    title: "How AnalyzeBot Identifies Your Items",
    category: "AI & Bots",
    categoryIcon: "🤖",
    summary:
      "The AI analysis that examines your photos to identify items — maker, material, era, condition, and more.",
    content: `AnalyzeBot is the first bot that runs when you click "Analyze with AI" on any item page. It uses OpenAI Vision to examine every photo you uploaded and produce a detailed identification. Here is what it does and how to get the best results.

What AnalyzeBot Identifies: After examining your photos, AnalyzeBot produces a comprehensive report covering:
- Item identification (what it is, who made it, model or pattern name)
- Maker or manufacturer
- Material (wood, ceramic, metal, glass, fabric, etc.)
- Era or approximate age
- Style (Art Deco, Mid-Century Modern, Victorian, etc.)
- Condition score (1-10 scale)
- Cosmetic condition details (scratches, wear, patina, stains)
- Functional condition (does it work, any missing parts)
- Markings, stamps, or labels found
- Estimated dimensions
- Completeness (all parts present, missing components)

The AI cross-references up to 6 photos to build its identification. It looks at different angles, zooms in on markings, and compares details across all photos to give you the most accurate result.

How to Get the Best Results:

1. Upload multiple photos. One photo gives a basic identification. Three to six photos with different angles give a much more detailed and accurate result.

2. Include close-ups of any markings, labels, stamps, or signatures. These are often the key to identifying the maker and era, which dramatically affects value.

3. Show the condition honestly. Photograph any damage, wear, or flaws. The AI needs to see these to give an accurate condition score.

4. Use good lighting. Natural daylight is best. Avoid harsh shadows or glare.

5. Add context in the description. If you know when the item was purchased, where it came from, or any history, include that. The AI uses your text description alongside the photos.

After AnalyzeBot finishes, you will see the full results on your item page organized into sections: Identification, Condition, Summary, Antique Check, Listing Suggestions, and Photo Analysis. Each section can be expanded for more detail.

Tip: If AnalyzeBot seems uncertain (low confidence score), try adding better photos — especially close-ups of markings or labels. One clear photo of a maker's mark can change an identification completely.`,
    lastUpdated: "2026-03-30",
  },
  {
    slug: "how-pricebot-works",
    title: "How PriceBot Finds the Right Price",
    category: "AI & Bots",
    categoryIcon: "🤖",
    summary:
      "Deep pricing from 42 marketplace data sources with local, national, and best-market estimates.",
    content: `PriceBot runs automatically after AnalyzeBot identifies your item. It searches across 42 marketplace data sources to find comparable sales and calculate a fair market price. Here is how the pricing engine works.

Data Sources: PriceBot pulls data from eBay completed sales, auction house results, dealer pricing guides, and marketplace listings. It looks at items that have actually sold (not just listed prices) to give you realistic expectations.

Three Price Points: PriceBot gives you three different estimates:

1. Local Pickup Price: What the item is likely to sell for in your area. PriceBot uses your zip code to look up local market demand. High-demand areas (major cities, affluent suburbs) see higher prices. Rural areas typically see 10-30 percent lower prices for the same item.

2. Ship Nationwide Price: The price when you open sales to the entire country. This removes the local demand factor and reflects the full national market. It is almost always higher than the local price.

3. Best Market Price: PriceBot identifies which metro area would pay the most for your specific item. Mid-century furniture does best in Brooklyn and San Francisco. Antique tools sell highest in the Midwest. Southern pottery commands top prices in the Southeast. PriceBot tells you the best market, the estimated price there, and the shipping cost to reach it.

Confidence Score: Every estimate comes with a confidence score from 1 to 100. High confidence (75+) means PriceBot found many recent comparable sales at consistent prices. Low confidence (below 50) means the item is unusual or has limited sales data. For low-confidence items, we recommend running MegaBot for a second opinion.

Location Intelligence: PriceBot uses a sophisticated zip-code-based market multiplier system. It knows that a Tiffany lamp sells for 35 percent more in New York than the national average, while vintage farm equipment sells better in rural agricultural areas. This location awareness makes LegacyLoop pricing significantly more accurate than one-size-fits-all estimates.

Tip: If PriceBot's confidence is below 50, add more photos showing labels and markings, then re-run the analysis. Better identification leads to better pricing data.`,
    lastUpdated: "2026-03-30",
  },
  {
    slug: "how-listbot-works",
    title: "How ListBot Creates Ready-to-Post Listings",
    category: "AI & Bots",
    categoryIcon: "🤖",
    summary:
      "AI-generated listings optimized for eBay, Facebook, Craigslist, and 7 other platforms.",
    content: `ListBot takes your item's AI analysis and creates professional, ready-to-post listings for each marketplace platform. Every platform has different rules, character limits, and search algorithms, and ListBot knows them all. Here is how it works.

What ListBot Creates: For each connected platform, ListBot generates:
- An optimized title with the right keywords for that platform's search engine
- A detailed description formatted for that platform's style
- Category and tag suggestions
- Pricing recommendations specific to that platform's audience

Platform-Specific Optimization:

eBay: ListBot creates titles using eBay's 80-character limit with high-search-volume keywords first. It suggests the best eBay category, item specifics, and condition description. eBay titles might read "Vintage Roseville Pottery Vase 1940s Clematis Pattern 108-8 Green" — packed with searchable terms.

Facebook Marketplace: Shorter, more conversational listings. ListBot focuses on the first two lines (which show in search results) and includes location appeal like "Great find in Portland."

Craigslist: Clean, honest descriptions without marketing fluff. Craigslist buyers appreciate straightforward listings with clear pricing and pickup instructions.

Etsy: ListBot adds vintage-specific keywords and tags that Etsy's search algorithm favors. It also suggests pricing in line with Etsy's typically higher-end buyer expectations.

How to Use ListBot:

1. Make sure your item has been analyzed by AnalyzeBot first. ListBot needs the identification data to work with.

2. On the item page, look for the "Generate Listings" button or find ListBot in the Bot Hub.

3. Select which platforms you want listings for. ListBot generates all of them in a few seconds.

4. Review each listing and make any personal touches. ListBot does the heavy lifting, but you know your item best.

5. Copy the listing to each platform, or use the cross-post feature if the platform is connected.

Tip: Let ListBot generate the listing first, then add one personal sentence about the item's story or history. Buyers connect with stories, and that human touch can make the difference between a sale and a scroll-past.`,
    lastUpdated: "2026-03-30",
  },
  {
    slug: "how-photobot-works",
    title: "How PhotoBot Enhances Your Photos",
    category: "AI & Bots",
    categoryIcon: "🤖",
    summary:
      "AI photo enhancement including background removal, lighting correction, and professional presentation.",
    content: `PhotoBot makes your item photos look professional without any photography skills or equipment. It uses AI to enhance lighting, remove cluttered backgrounds, and create clean images that attract more buyers. Here is how to use it.

What PhotoBot Can Do:

Background Removal: PhotoBot can remove the background from any photo and replace it with a clean white or neutral background. This makes your item stand out and look like a professional product photo. Great for items photographed on messy counters, busy tables, or cluttered floors.

Lighting Enhancement: If your photo is too dark, too bright, or has harsh shadows, PhotoBot adjusts the lighting to show the item clearly. It balances exposure and contrast so buyers can see details they might miss in the original.

Color Correction: PhotoBot ensures the colors in your photo are accurate. This is important for items where color matters — like clothing, pottery, or artwork. What the buyer sees should match what they receive.

How to Use PhotoBot:

1. Upload your photos to the item as normal. You can use your phone camera, photo library, or drag and drop from your computer.

2. On the item page, look for the "Enhance Photos" option on each photo, or find PhotoBot in the Bot Hub.

3. Select which enhancements you want — background removal, lighting correction, or both.

4. PhotoBot processes the photo in a few seconds and shows you a before/after comparison. If you like the result, click "Use Enhanced Photo" to replace the original.

5. The enhanced photo is saved as the listing photo. The original is kept as a backup in case you want to switch back.

Cost: Background removal costs 2 credits per photo. Lighting enhancement is included free with any AI analysis.

Tips for Best Results:
- Take the original photo against a simple, uncluttered background. PhotoBot works better when the item edges are clear.
- Use natural daylight when possible. It gives PhotoBot the best starting point.
- For reflective items (glass, silver, polished wood), avoid flash — it creates glare that even AI has trouble fixing.

Tip: Enhanced photos get 30-40 percent more buyer engagement than unedited phone photos. It is one of the easiest ways to sell faster.`,
    lastUpdated: "2026-03-30",
  },
  {
    slug: "how-shipbot-works",
    title: "How ShipBot Handles Shipping Estimates",
    category: "AI & Bots",
    categoryIcon: "🤖",
    summary:
      "AI-powered shipping estimates, carrier comparison, packaging recommendations, and fragile item detection.",
    content: `ShipBot takes the guesswork out of shipping. It estimates costs, recommends packaging, compares carrier rates, and flags items that need special handling. Here is what ShipBot does and how it helps you.

Automatic Package Suggestions: When AnalyzeBot identifies your item, ShipBot automatically suggests the right box size and estimated weight based on the item category. For example, a vintage teacup set gets a medium box suggestion with fragile handling, while a hardcover book gets a small flat-rate box. ShipBot knows the typical dimensions for over 25 item categories.

Fragile Item Detection: ShipBot checks the item's material, category, and condition to determine if it needs special packaging. Items made of glass, ceramic, porcelain, or crystal are automatically flagged as fragile. The shipping panel adds a fragile warning and recommends double-boxing with extra cushioning.

Carrier Comparison: ShipBot compares real-time rates from USPS, UPS, and FedEx. For each carrier, you see the cost, estimated delivery time, and any special features (like insurance or signature confirmation). ShipBot highlights the best value option and the fastest option so you can choose based on your priorities.

Metro Estimates: Before an item sells, ShipBot shows you what it would cost to ship to five major metro areas — New York, Los Angeles, Chicago, Houston, and Phoenix. This gives you and potential buyers a realistic shipping cost expectation upfront.

How ShipBot Works on the Item Page:

1. After AI analysis, scroll down to the Shipping Panel on your item page.

2. You will see the AI-suggested package details: box size, weight, and whether the item is flagged as fragile. You can adjust any of these if the suggestion is not quite right.

3. Below that, the carrier comparison table shows rates from all three carriers. Rates are based on your zip code and the package details.

4. The metro estimate cards show shipping costs to major cities, helping you decide whether shipping nationwide is worth it for this item.

Tip: Always weigh your item on a kitchen or bathroom scale before shipping. ShipBot's weight estimate is usually close, but carriers charge by actual weight, and an underestimate could mean extra fees.`,
    lastUpdated: "2026-03-30",
  },
  {
    slug: "how-carbot-works",
    title: "How CarBot Evaluates Vehicles",
    category: "AI & Bots",
    categoryIcon: "🤖",
    summary:
      "Vehicle evaluation using NHTSA safety data, VIN decoding, and market pricing for cars, trucks, and more.",
    content: `CarBot is LegacyLoop's specialist for vehicles — cars, trucks, motorcycles, ATVs, boats, and recreational vehicles. It goes beyond standard photo analysis by pulling official data from government and industry databases. Here is how it works.

What CarBot Analyzes: Upload photos of your vehicle and CarBot identifies the make, model, year, and trim level. If you provide the VIN (Vehicle Identification Number), CarBot decodes it to get exact specifications including engine type, transmission, factory options, and original MSRP.

NHTSA Safety Data: CarBot pulls safety recall information from the National Highway Traffic Safety Administration database. If there are any open recalls on the vehicle, CarBot flags them. This is important because unresolved recalls can affect the sale price and the buyer will want to know.

Market Pricing: CarBot estimates the vehicle's value using the same approach as PriceBot but with vehicle-specific data sources. It considers mileage, condition, location, and current market demand for that specific make and model. You get a price range for private party sale, dealer trade-in, and retail value.

How to Use CarBot:

1. Create a new item and upload clear photos of the vehicle — exterior (all four sides), interior, dashboard with mileage showing, engine bay, and any damage or modifications.

2. In the description, include the year, make, model, mileage, and VIN if you have it. The VIN is usually on the driver's side dashboard or inside the driver's door jamb.

3. Click "Analyze with AI." CarBot activates automatically when it detects a vehicle.

4. Review the results on the item page. You will see the vehicle identification, decoded VIN data, safety recalls, condition assessment, and pricing estimates.

CarBot Availability: CarBot is available on Pro plans and can be accessed with credits on other plans.

Tip: Including the VIN dramatically improves CarBot's accuracy. A VIN decode gives exact factory specifications, which helps the pricing engine find precise comparable sales instead of relying on general model data.`,
    lastUpdated: "2026-03-30",
  },
  {
    slug: "how-antiquebot-works",
    title: "How AntiqueBot Authenticates Antiques",
    category: "AI & Bots",
    categoryIcon: "🤖",
    summary:
      "Antique detection using 78 signals, auction valuation, and appraisal recommendations.",
    content: `AntiqueBot is LegacyLoop's antique authentication specialist. It uses 78 different signals to determine whether an item might be a valuable antique and estimates what it could fetch at auction. Here is how it works and what to look for.

How Detection Works: AntiqueBot runs automatically as part of every AI analysis. It evaluates your item across three categories of signals:

Keyword Signals: The AI description is scanned for terms associated with antiques — words like "patina," "dovetail joints," "hand-blown," "maker's mark," "sterling," "estate," and dozens more.

Brand and Maker Signals: AntiqueBot checks the identified maker against a database of known antique manufacturers and artisans. Brands like Tiffany, Roseville, Wedgwood, Stickley, and Haviland trigger higher antique scores.

Material and Construction Signals: Certain materials (solid wood, hand-forged iron, hand-painted porcelain, leaded glass) and construction methods (mortise and tenon, hand-stitching, blown glass) are strong indicators of age and craftsmanship.

The Antique Alert: If the combined score passes the threshold, an Antique Alert banner appears on your item page. This animated orange and gold gradient banner shows you the antique score, which signals were detected, and an estimated auction value range. It also offers a button to request a professional appraisal.

Auction Value Estimates: AntiqueBot estimates what the item might sell for at a reputable auction house. This is separate from the regular market price because auction buyers are often willing to pay a premium for authenticated antiques. The estimate includes a range (low to high) based on condition and rarity.

What to Do If You Get an Antique Alert:

1. Review the signals — do they match what you know about the item?
2. Consider uploading additional close-up photos of any markings, stamps, or signatures.
3. If the auction estimate is significantly higher than the market price, consider requesting a professional appraisal (15 credits) before selling.
4. For high-value antiques (estimated over $500), consider holding the item for auction rather than selling at market price.

Tip: Not every "antique" is valuable, and not every valuable item is old. AntiqueBot looks at craftsmanship and rarity, not just age. A well-made 1950s piece can be worth more than a worn-out 1850s piece.`,
    lastUpdated: "2026-03-30",
  },
  {
    slug: "how-collectiblesbot-works",
    title: "How CollectiblesBot Grades and Prices Collectibles",
    category: "AI & Bots",
    categoryIcon: "🤖",
    summary:
      "Collectible grading for cards, coins, stamps, and memorabilia with PSA/BGS reference standards.",
    content: `CollectiblesBot specializes in grading and pricing items that the collector market values differently based on condition — trading cards, coins, stamps, sports memorabilia, comic books, and similar items. Here is how it helps you get top dollar for your collection.

What CollectiblesBot Evaluates: When CollectiblesBot detects a collectible item, it performs a detailed condition assessment based on industry-standard grading scales:

Trading Cards: Uses PSA (Professional Sports Authenticator) and BGS (Beckett Grading Services) standards. CollectiblesBot examines centering, corners, edges, and surface condition to estimate a grade from 1 to 10.

Coins: References the Sheldon scale (1-70) used by PCGS and NGC. Evaluates wear, luster, strike quality, and surface marks.

Stamps: Assesses centering, gum condition, perforations, and cancellation marks using standard philatelic grading.

Sports Memorabilia: Evaluates authenticity indicators, condition, and provenance details.

How Grading Affects Price: In the collectibles world, condition is everything. A baseball card graded PSA 9 might sell for $200, while the same card at PSA 7 sells for $40. CollectiblesBot helps you understand where your item falls on the scale and how that translates to market value.

How to Use CollectiblesBot:

1. Upload the clearest photos possible. For cards, photograph both front and back in even lighting without glare. For coins, try to show both obverse and reverse.

2. In the description, include any information you have — year, manufacturer, player or design name, and whether the item has been previously graded.

3. Run the AI analysis. CollectiblesBot activates automatically when it detects a collectible.

4. Review the estimated grade and pricing on the item page. The report shows the estimated grade, comparable sales at that grade level, and what the item might sell for at higher and lower grades.

Should You Get Professional Grading? CollectiblesBot will recommend professional grading when the value difference between grades is significant enough to justify the cost ($20-50 per item from PSA or BGS). If a professional grade could move your item from a $50 sale to a $200 sale, it is worth the investment.

Tip: Never clean coins or trim cards to improve condition — in the collecting world, this actually decreases value. Sell items in their current, unaltered state.`,
    lastUpdated: "2026-03-30",
  },
  {
    slug: "how-reconbot-works",
    title: "How ReconBot Monitors the Competition",
    category: "AI & Bots",
    categoryIcon: "🤖",
    summary:
      "Market intelligence that tracks competitor listings, price changes, and demand trends.",
    content: `ReconBot is your personal market intelligence agent. Once activated on an item, it continuously monitors other sellers' listings across marketplaces to give you a competitive edge. Here is how to set it up and what it tells you.

What ReconBot Monitors:
- Similar items listed on other platforms (eBay, Facebook Marketplace, Craigslist, etc.)
- Price changes on competing listings
- How long competing items have been listed
- New listings that match your item category
- Market trends and demand patterns

How to Activate ReconBot:

1. Go to any item page and scroll down to the ReconBot panel.

2. Click "Activate Recon Bot." The bot begins scanning marketplaces immediately.

3. Within moments, you will see competitor listings appear in the panel. Each listing shows the platform, price, listing age, and a comparison to your price.

4. ReconBot generates alerts when something important happens — a competitor drops their price, a similar item sells quickly (indicating high demand), or a new competitor appears.

The ReconBot Panel: On your item page, the ReconBot panel shows two main sections:

Competitor Listings: A list of similar items currently for sale elsewhere. Each entry shows the platform icon, price, and how it compares to your listing. If competitors are priced lower, you may want to adjust. If they are priced higher, you might be leaving money on the table.

Alerts: Actionable notifications like "Competitor on eBay dropped price by 15%," "Similar item sold in 2 days at your price range," or "Demand trending up for this category in your area." Each alert can be acknowledged or acted upon.

Dashboard Alerts: ReconBot alerts also appear in the Alerts Widget on your main Dashboard, so you can see market activity without visiting each item page individually.

Pause and Resume: If you do not want to monitor an item temporarily (maybe you are taking a break from selling), click "Pause" on the ReconBot panel. Click "Resume" when you are ready to start monitoring again.

Tip: ReconBot is most valuable for items that have been listed for more than a week without selling. The competitive intelligence helps you understand why and what to change.`,
    lastUpdated: "2026-03-30",
  },
  {
    slug: "how-megabot-works",
    title: "How MegaBot Builds a 4-AI Consensus",
    category: "AI & Bots",
    categoryIcon: "🤖",
    summary:
      "The multi-AI engine that sends your item to four AI models simultaneously for the most reliable estimate.",
    content: `MegaBot is LegacyLoop's most powerful analysis tool. Instead of relying on a single AI model, it sends your item to four different AI engines simultaneously and compares their results. This consensus approach dramatically increases accuracy. Here is how it works.

The Four AI Models: MegaBot queries these four engines in parallel:

1. OpenAI (GPT-4): Excellent at general identification, broad knowledge of consumer goods, and strong at reading text and labels in photos.

2. Claude (Anthropic): Specializes in craftsmanship analysis, historical context, and understanding the story behind an item. Particularly good with handmade and artisan pieces.

3. Gemini (Google): Strong at market trend analysis, current pricing data, and understanding how demand shifts across regions and seasons.

4. Grok: Provides an independent cross-check with a focus on unusual or rare items that the other models might not have in their training data.

How Consensus Works: Each model independently analyzes your photos and produces an identification and price estimate. MegaBot then compares all four results:

Strong Agreement: If all four models agree on the identification and their prices are within a tight range (less than 15 percent spread), MegaBot reports high confidence. This is the best outcome — you can be very confident in the estimate.

Moderate Agreement: If three models agree and one disagrees, MegaBot goes with the majority but flags the disagreement. The outlier model's reasoning is shown so you can evaluate it yourself.

Low Agreement: If the models disagree significantly, MegaBot highlights the differences and recommends additional photos or a professional appraisal. This usually happens with very unusual items.

How to Use MegaBot:

1. First, run the standard AI analysis (AnalyzeBot). MegaBot works best when it has the initial analysis to build on.

2. On the item page, find the MegaBot panel and click "Boost with MegaBot" (costs 5 credits).

3. A 9-step animation plays while the four models process your item in parallel. This takes about 15-30 seconds.

4. When complete, the panel shows each model's results side by side — their identification, price estimate, and confidence. An agreement bar at the top visualizes how closely the models aligned.

5. The consensus price is calculated and displayed prominently. This is the estimate we recommend using for your listing.

Tip: MegaBot is especially valuable for antiques, art, and unusual items where a single AI model might not have enough reference data. The consensus approach catches errors that any single model might make.`,
    lastUpdated: "2026-03-30",
  },
  {
    slug: "bot-tiers-and-credits",
    title: "Bot Access by Tier and Credit Costs",
    category: "AI & Bots",
    categoryIcon: "🤖",
    summary:
      "Which bots come with each subscription tier and how much each bot costs in credits.",
    content: `Your subscription tier determines which bots are included in your plan. You can also use credits to access bots that are not part of your tier on a pay-per-use basis. Here is the complete breakdown.

Free Tier ($0/month):
- AnalyzeBot: Included (3 analyses per month)
- PriceBot: Included (runs with every analysis)
- ShipBot: Included (basic shipping estimates)
- All other bots: Available with credits

Starter Tier ($10/month pre-launch, $20/month regular):
- AnalyzeBot: Included (25 analyses per month)
- PriceBot: Included
- ShipBot: Included (full carrier comparison)
- ListBot: Included (5 listings per month)
- All other bots: Available with credits

Plus Tier ($25/month pre-launch, $49/month regular):
- AnalyzeBot: Included (100 analyses per month)
- PriceBot: Included
- ShipBot: Included
- ListBot: Included (unlimited)
- PhotoBot: Included (50 enhancements per month)
- AntiqueBot: Included
- MegaBuying Bot: Included
- CollectiblesBot: Available with credits
- MegaBot, CarBot, ReconBot: Available with credits

Pro Tier ($75/month pre-launch, $99/month regular):
- All 11 bots included with generous monthly limits
- MegaBot: 20 analyses per month included
- ReconBot: Unlimited monitoring
- CarBot: 10 vehicle evaluations per month

Credit Costs for Pay-Per-Use:
- AnalyzeBot: 1 credit per analysis
- MegaBot: 5 credits per consensus
- PhotoBot (background removal): 2 credits per photo
- ListBot: 1 credit per platform listing
- ReconBot: 3 credits to activate (then runs free for 30 days)
- CarBot: 5 credits per vehicle evaluation
- CollectiblesBot: 3 credits per grading
- Professional Appraisal: 15 credits

Tip: If you find yourself buying credits for the same bot repeatedly, it might be cheaper to upgrade your tier. For example, if you use MegaBot 5 times a month (25 credits = $5), upgrading to Pro gives you 20 included uses plus access to every other bot.`,
    lastUpdated: "2026-03-30",
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
  {
    slug: "white-glove-tiers",
    title: "White-Glove Tiers: Essentials, Professional, and Legacy",
    category: "White-Glove",
    categoryIcon: "🏠",
    summary:
      "Compare the three White-Glove service levels — what is included, pricing, and which one is right for you.",
    content: `LegacyLoop offers three tiers of White-Glove estate service. Each tier is designed for a different scale of project. Here is a detailed comparison to help you choose the right one.

Essentials ($1,750):
This tier is perfect for smaller estates, single-room cleanouts, or curated collections of up to 50 items. Here is what is included:
- Professional photography of every item (up to 6 photos each)
- AI analysis and pricing for all items
- Listing on your LegacyLoop storefront
- Cross-posting to 3 marketplace platforms
- Buyer communication management for 30 days
- Basic shipping coordination
- A dedicated project page where you can track progress
- One revision round on pricing if you disagree with any estimates

Professional ($3,500):
The most popular tier, designed for full-home estates with up to 150 items. Everything in Essentials, plus:
- A dedicated project manager assigned to your estate
- On-site visit for photography and item assessment
- Antique and collectible specialist review for flagged items
- Listing on up to 7 marketplace platforms
- Buyer communication and negotiation for 60 days
- Full shipping management including packaging and carrier selection
- Professional appraisal requests for high-value items (up to 5)
- Weekly progress reports emailed to you
- Story capture for up to 10 sentimental items

Legacy ($7,000):
Our comprehensive service for large estates, multi-room properties, or high-value collections with unlimited items. Everything in Professional, plus:
- Unlimited items
- Full antique authentication with certified appraiser on-site
- Auction house coordination for items valued over $1,000
- Cross-posting to all 10 marketplace platforms
- 90-day buyer management with active outreach
- Premium packaging and white-glove shipping for fragile items
- Complete digital archive of all items with photos and stories
- USB keepsake with family history and item documentation
- Dedicated phone line for questions and updates

How to Get Started:

1. Visit the White-Glove section of the LegacyLoop website or talk to our team through the Help Widget (bottom-right corner of any page).

2. Tell us about your project — how many items, what type, your timeline, and your location.

3. We will provide a custom quote based on your specific needs. The prices above are starting points; complex estates may vary.

4. Once you approve the quote, your project manager reaches out to schedule the first visit.

Tip: If you are not sure which tier you need, start with a phone consultation. We can estimate the number of items and recommend the right tier before you commit.`,
    lastUpdated: "2026-03-30",
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
  {
    slug: "online-transaction-safety",
    title: "Staying Safe with Online Transactions",
    category: "Safety & Trust",
    categoryIcon: "🔒",
    summary:
      "How to avoid scams, verify buyers, and keep your personal information secure when selling online.",
    content: `Selling online is safe when you follow a few important guidelines. LegacyLoop builds in protections, but being aware of common risks keeps you even safer. Here is what you need to know.

Use LegacyLoop's Payment System: When a buyer purchases through LegacyLoop, payment is processed securely by Stripe and held in escrow until delivery is confirmed. This protects you from fake payments and protects the buyer from non-delivery. Never accept payment outside the platform for shipped items.

Watch for Common Scams:
- Overpayment scams: A buyer sends more than the asking price and asks you to refund the difference. This is always a scam. Decline and report the buyer.
- Fake payment confirmations: Someone sends a screenshot or email claiming they paid, but no payment appears in your LegacyLoop account. Always verify payment in your actual account dashboard before shipping.
- Shipping address changes: A buyer asks you to ship to a different address after payment. Contact LegacyLoop support before proceeding — this can be a sign of fraud.
- Too-good-to-be-true offers: A buyer immediately offers full price on a newly listed item without any questions. While this can be legitimate, proceed carefully.

Protect Your Personal Information:
- Never share your home address with buyers unless they are picking up locally and you are comfortable.
- Use LegacyLoop's messaging system for all communications. Avoid giving out your personal phone number or email.
- LegacyLoop shows buyers your city, not your exact address, on listings.

Verify Before You Ship:
1. Confirm payment has been received in your LegacyLoop account (not just an email notification).
2. Ship only to the address provided through the LegacyLoop system.
3. Always use tracked shipping so you have proof of delivery.
4. Take photos of the packaged item before shipping, including the label and the item inside the box.

Reporting Suspicious Activity: If something does not feel right, use the "Report" button on any conversation or buyer profile. LegacyLoop's trust and safety team reviews all reports within 24 hours.

Tip: Trust your instincts. If a buyer is pressuring you to act quickly, skip normal procedures, or communicate outside LegacyLoop, those are red flags. It is always better to lose a sale than to lose your item and money to a scam.`,
    lastUpdated: "2026-03-30",
  },
  {
    slug: "returns-and-refunds",
    title: "Returns, Refunds, and Buyer Protection",
    category: "Safety & Trust",
    categoryIcon: "🔒",
    summary:
      "How LegacyLoop handles return requests, the refund process, and protections for both buyers and sellers.",
    content: `LegacyLoop has a fair return and refund policy that protects both buyers and sellers. Here is how the process works.

Buyer Protection Window: After an item is marked as delivered, the buyer has 24 hours to inspect the item and report any issues. If the item matches the listing description, no further action is needed and your payout is released.

When a Buyer Can Request a Return:
- The item is significantly different from the listing description or photos
- The item is damaged during shipping (not pre-existing damage that was disclosed)
- The wrong item was shipped
- The item never arrived (despite tracking showing delivery)

When a Return is NOT Eligible:
- The buyer simply changed their mind
- The buyer found it cheaper elsewhere
- Minor variations in color due to screen differences
- Normal wear that was accurately described in the listing

The Return Process:

1. The buyer files a return request through LegacyLoop within the protection window.

2. LegacyLoop reviews the request and may ask the buyer for photos showing the issue.

3. If the return is approved, the buyer ships the item back to you using a prepaid return label provided by LegacyLoop.

4. Once you receive the returned item and confirm it is in the same condition as when you shipped it, the buyer receives a full refund.

5. If the item was damaged in shipping, LegacyLoop files a carrier insurance claim on your behalf. You are not out of pocket for shipping damage.

Seller Protection: LegacyLoop protects sellers from fraudulent return requests. If a buyer consistently files return requests or the evidence does not support their claim, LegacyLoop's trust team investigates and may deny the request.

For Local Pickup Sales: Returns are handled directly between buyer and seller. LegacyLoop does not mediate local pickup transactions, but we recommend agreeing on a return policy before the sale.

Tip: The best way to avoid returns is accurate listings. Photograph any flaws clearly, describe condition honestly, and set realistic expectations. Honest listings build trust and lead to happy buyers who come back for more.`,
    lastUpdated: "2026-03-30",
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
  {
    slug: "heroes-application",
    title: "How to Apply for the Heroes Discount",
    category: "Veterans & Heroes",
    categoryIcon: "🏅",
    summary:
      "Step-by-step instructions for verifying your military, law enforcement, or first responder status to get 25% off.",
    content: `The Heroes Discount gives military veterans, active-duty service members, law enforcement officers, firefighters, and EMTs a 25 percent discount on all LegacyLoop subscription plans and credit packages. Here is how to apply.

Who Qualifies:
- Active-duty military (all branches: Army, Navy, Air Force, Marines, Coast Guard, Space Force)
- Military veterans (honorably discharged)
- National Guard and Reserve members
- Law enforcement officers (federal, state, county, municipal)
- Firefighters (career and volunteer)
- Emergency Medical Technicians (EMTs) and paramedics

How to Apply:

1. Visit the /heroes page by clicking "Heroes" in the navigation bar (visible when logged out) or going directly to the URL.

2. Click "Verify Your Status" on the Heroes page.

3. You will be asked to select your service category (military, law enforcement, or fire/EMS).

4. Complete the verification through our partner service. This typically involves providing your name, branch of service or department, and one piece of documentation (such as a DD-214, department ID, or active-duty card).

5. Verification usually completes within minutes. For some cases, manual review may take 24-48 hours.

6. Once verified, the 25 percent discount is applied to your account permanently. You will see the discounted pricing on the /pricing page and at checkout.

Stacking Discounts: The Heroes Discount stacks with our founding member pre-launch pricing. If you are both a founding member (50 percent off) and a verified hero (25 percent off the remaining amount), you receive significant combined savings. For example, the Pro plan at $99/month becomes $49.50 as a founding member, then $37.13 with the Heroes Discount on top.

What the Discount Covers:
- All four subscription tiers (Starter, Plus, Pro, and any future tiers)
- All credit packages
- White-Glove service deposits (discount applies to the service fee)

The discount does not apply to third-party costs like shipping fees or professional appraisal fees charged by external appraisers.

Tip: If you have trouble with verification, reach out through the Help Widget (bottom-right corner of any page). Our support team can assist with manual verification.`,
    lastUpdated: "2026-03-30",
  },
  // ── Projects & Estate Sales ───────────────────────────────────────────────
  {
    slug: "creating-projects",
    title: "Creating Projects for Estate Sales and Garage Sales",
    category: "Projects & Estate Sales",
    categoryIcon: "📋",
    summary:
      "How to organize items into projects — estate sales, garage sales, and other group sales.",
    content: `Projects let you organize related items into a group — perfect for estate sales, garage sales, downsizing projects, or any situation where you are selling multiple items together. Here is how to create and manage projects.

What is a Project? A project is a container that groups items together under a common name. For example, "Grandma Dorothy Estate Sale" or "Spring Garage Cleanout." Projects give you a single place to track progress across all the items in that sale.

How to Create a Project:

1. Go to your Dashboard. You will see a "Projects" section below your items.

2. Click "+ New Project" to create a new one.

3. Give your project a name that describes the sale. This name will appear on your public sale page if you make it public.

4. Add a description with any relevant details — dates, location, backstory. For estate sales, a brief note about the person's life and the types of items being sold adds a personal touch that buyers appreciate.

5. Start adding items to the project. You can add existing items from your inventory or create new items directly within the project.

How Projects Help You:

Progress Tracking: The project page shows a progress bar — how many items have been analyzed, listed, sold, and completed out of the total. This gives you a clear picture of where you stand.

Bulk Actions: Projects let you perform actions on multiple items at once. Change all Draft items to Listed, run AI analysis on all unanalyzed items, or adjust pricing across the board.

Public Sale Pages: When you make a project public, it gets its own URL that you can share. Buyers can browse all the items in the project on one page, making it easy to find what they want.

Financial Summary: Each project page shows total estimated value, total sold so far, and projected revenue. This is especially helpful for estate executors who need to report to beneficiaries.

Tip: For estate sales, create the project first and add items as you photograph them room by room. This keeps everything organized and lets you track progress from the start.`,
    lastUpdated: "2026-03-30",
  },
  {
    slug: "public-sale-pages",
    title: "Public Sale Pages for Buyers",
    category: "Projects & Estate Sales",
    categoryIcon: "📋",
    summary:
      "How to create a public page for your estate sale or garage sale that buyers can browse and share.",
    content: `When you make a project public, it gets its own shareable web page where buyers can browse all the items in your sale. This is one of the most powerful features for estate sales and garage sales. Here is how it works.

Making Your Project Public:

1. Open your project from the Dashboard.

2. Look for the "Visibility" toggle and switch it to "Public."

3. A public URL is generated for your project. It looks something like legacyloop.com/store/your-id/project-name.

4. Share this URL anywhere — social media, email, community boards, flyers, or text messages.

What Buyers See: When someone visits your public sale page, they see:
- The project name and description
- All listed items with photos, titles, and prices
- Search and filter options to find specific items
- A contact form to ask questions or make offers
- Your general location (city, not exact address)

Buyers do not need a LegacyLoop account to browse your sale page. They can view items, see prices, and reach out to you directly through the contact form.

Optimizing Your Sale Page:

Write a compelling project description. For estate sales, share a brief story about the person and the types of items being sold. Buyers appreciate context and are more likely to engage when they understand the background.

Use high-quality primary photos. The first photo of each item is what shows in the grid view on the sale page. Make sure it is clear, well-lit, and shows the item at its best.

Keep items priced and in "Listed" status. Only items with a status of Listed, Analyzed, or Ready appear on public pages. Draft items are hidden.

Share strategically. Post your sale page link in local Facebook groups, neighborhood Nextdoor communities, relevant collector forums, and your personal social media. The more eyes on the page, the faster items sell.

Tip: Create your public sale page a few days before you want to start selling and share it as a "preview." Build anticipation by letting people browse before items go live. Then update statuses to Listed on sale day.`,
    lastUpdated: "2026-03-30",
  },
  {
    slug: "neighborhood-bundle",
    title: "Neighborhood Bundle: Multi-Family Sales",
    category: "Projects & Estate Sales",
    categoryIcon: "📋",
    summary:
      "How to organize a neighborhood-wide sale with 2-8 families using the Neighborhood Bundle discount.",
    content: `The Neighborhood Bundle is a special LegacyLoop offering that lets 2 to 8 families in the same neighborhood coordinate a group sale. You save money with discounted service pricing, and buyers love the convenience of shopping multiple families in one stop. Here is how it works.

What is a Neighborhood Bundle? Instead of each family running their own sale independently, you team up with neighbors. Each family creates their own items and project, but all the projects are linked under one Neighborhood Bundle. Buyers see a single sale page with items from all participating families, organized by household.

How to Set Up a Neighborhood Bundle:

1. Visit /services/neighborhood-bundle or find it through the services marketplace.

2. Enter the number of participating families (2 to 8). The pricing calculator shows you the per-family cost, which decreases as more families join.

3. One person acts as the bundle organizer. They create the bundle and invite the other families by email.

4. Each family creates their own LegacyLoop account (if they do not have one), uploads their items, and assigns them to the neighborhood bundle project.

5. LegacyLoop generates a shared public sale page that shows all items from all families, with clear labels showing which household each item belongs to.

Pricing: The Neighborhood Bundle includes discounted White-Glove or self-service rates:
- 2 families: 15 percent discount off regular pricing
- 3-4 families: 20 percent discount
- 5-6 families: 25 percent discount
- 7-8 families: 30 percent discount

Each family is billed individually for their share. The organizer does not need to collect money from neighbors.

Why Neighborhood Bundles Work:
- More items means more buyers. A 6-family sale attracts far more foot traffic (and online traffic) than a single-family sale.
- Shared promotion. One social media post or flyer advertises items from all families.
- Buyer convenience. Shoppers can browse a huge selection in one place.
- Community building. It is a fun neighborhood event that brings people together.

Tip: Start organizing your Neighborhood Bundle at least two weeks before the target sale date. This gives each family time to photograph and upload their items, and gives you time to promote the sale page in local community groups.`,
    lastUpdated: "2026-03-30",
  },
  // ── Marketplace & Services ────────────────────────────────────────────────
  {
    slug: "addon-marketplace",
    title: "The Add-On Marketplace and Credits Services",
    category: "Marketplace & Services",
    categoryIcon: "🛒",
    summary:
      "Browse and purchase add-on services with credits — from AI analysis to professional appraisals.",
    content: `The Add-On Marketplace is where you can browse and purchase extra services using your credits. Visit the /credits page and click the "Services" tab to see everything available. Here is a tour of what you will find.

AI-Powered Services:
- MegaBot 4-AI Consensus (5 credits): The gold standard for pricing. Four AI models analyze your item in parallel and produce a consensus estimate.
- Background Removal (2 credits): AI removes the photo background for a clean, professional look.
- Social Media Kit (3 credits): Generates optimized images and captions for Facebook, Instagram, and other platforms.
- Story Capture (5 credits): AI writes a narrative about your item's history, perfect for family archives and compelling listings.

Professional Services:
- Professional Appraisal (15 credits): A certified appraiser reviews your item remotely with photos and provides a formal written appraisal. Turnaround is 3-5 business days.
- Inventory Report (10 credits): A comprehensive spreadsheet-style report of all your items with descriptions, conditions, and values. Great for insurance or estate documentation.
- Market Research Report (8 credits): Deep analysis of the current market for your item category, including recent sales, pricing trends, and demand forecasts.

Priority Services:
- Priority Support (10 credits): Jump to the front of the support queue for time-sensitive questions.
- Express Analysis (3 credits): Skip the queue and get your AI analysis results within seconds instead of the standard processing time.

How to Purchase a Service:

1. Make sure you have enough credits. Check your balance in the navigation bar or on the Credits page.

2. Navigate to the service you want — either through the marketplace or through a service button on an item page.

3. Click the "Use Credits" button. Confirm the purchase.

4. The service runs immediately. Results appear on the relevant item page within seconds for AI services, or within the stated turnaround time for professional services.

5. Your credit balance updates in real time.

Tip: Check the marketplace regularly. We add new services often, and seasonal promotions sometimes offer double the service for the same credit cost.`,
    lastUpdated: "2026-03-30",
  },
  {
    slug: "story-capture-services",
    title: "Story Capture: Preserving Memories with Your Items",
    category: "Marketplace & Services",
    categoryIcon: "🛒",
    summary:
      "Text, audio, and video story capture options that document the history and memories behind your items.",
    content: `Every item has a story. Grandmother's rocking chair, Uncle Bill's fishing rod, the kitchen table where the family gathered for fifty Thanksgivings. LegacyLoop's Story Capture services help you preserve those memories, whether you are selling the item or keeping it in the family. Here is how each option works.

AI Text Story Capture (5 credits): Share a few details about the item — who owned it, how long they had it, any special memories — and our AI crafts a beautifully written narrative. The story is attached to the item's listing, making it more compelling to buyers who value provenance. It is also saved in your personal archive for family records.

How to Use Text Story Capture:
1. Go to the item page and click "Capture Story."
2. Type or dictate the memories and history you want to preserve. Even a few sentences is enough — the AI expands on it.
3. Review the AI-written narrative. You can edit it, add details, or request a rewrite.
4. The story is saved to the item and appears on the listing page.

Audio Story Recording: For items with rich family history, record yourself (or a family member) telling the story in their own voice. The recording is transcribed by AI and also preserved as an audio file. This is especially meaningful for estate items where the stories might otherwise be lost.

Video Story Capture: Record a short video showing the item and telling its story. Perfect for items with interesting features that are hard to describe in text, or for capturing a family member sharing memories on camera.

Digital Archive: All captured stories — text, audio, and video — are stored in your LegacyLoop archive. You can access them anytime from the /archives page. Stories can be exported as PDFs, included on a USB keepsake drive, or printed as a family history booklet.

Why Stories Matter for Selling: Listings with stories sell for 15-25 percent more than identical items without stories. Buyers, especially collectors and antique enthusiasts, value provenance — knowing where an item came from and what it meant to someone. A story transforms an object from "used dish set" into "a family heirloom from 1960s Maine."

Tip: If you are handling an estate sale, sit down with family members and record their memories about the most significant items before listing them. These stories are irreplaceable once the people who remember them are gone.`,
    lastUpdated: "2026-03-30",
  },
  {
    slug: "appraisal-and-reports",
    title: "Expert Appraisals and Inventory Reports",
    category: "Marketplace & Services",
    categoryIcon: "🛒",
    summary:
      "How to request professional appraisals, generate inventory reports, and use them for insurance or estates.",
    content: `Sometimes you need more than an AI estimate. LegacyLoop connects you with certified appraisers and generates professional reports for insurance, estates, donations, and legal purposes. Here is what is available.

Professional Appraisal (15 credits):

A certified appraiser reviews your item using the photos and AI analysis on file. They provide a formal written appraisal that includes:
- A detailed description of the item
- Condition assessment by an expert eye
- Fair market value based on current auction and dealer data
- Replacement value for insurance purposes
- The appraiser's credentials and signature

How to Request an Appraisal:
1. Go to the item page and click "Request Appraisal" (or find it in the Add-On Marketplace).
2. The request is sent to a certified appraiser in the relevant specialty (furniture, art, jewelry, etc.).
3. You will receive the written appraisal within 3-5 business days.
4. The appraisal is attached to the item and can be downloaded as a PDF.

When You Need an Appraisal:
- For insurance coverage on high-value items
- For estate settlement and probate (courts often require professional appraisals)
- For tax deductions on charitable donations over $5,000
- When the AI confidence score is low and you want expert confirmation
- Before consigning to an auction house

Inventory Report (10 credits):

This generates a comprehensive spreadsheet-style report of all your items (or a selected project) with:
- Item name, description, and condition
- AI-estimated value
- Photos
- Antique status and markers
- Current sale status

The report can be downloaded as a PDF or printed. It is perfect for estate executors who need to provide a complete inventory to beneficiaries, attorneys, or the court.

Tip: If you are settling an estate with items valued over $500 each, professional appraisals pay for themselves by ensuring accurate valuations for tax purposes and fair distribution among heirs.`,
    lastUpdated: "2026-03-30",
  },
  // ── Storefront & Messaging ────────────────────────────────────────────────
  {
    slug: "setting-up-storefront",
    title: "Setting Up Your Public Storefront",
    category: "Storefront & Messaging",
    categoryIcon: "🏪",
    summary:
      "How to create, customize, and share your public storefront where buyers browse your listings.",
    content: `Every LegacyLoop seller gets a free public storefront — a web page where all your listed items are displayed for buyers to browse. Here is how to set it up and make it look great.

Your Storefront URL: Your storefront is automatically created when you sign up. It lives at legacyloop.com/store/your-user-id. You can find the link by clicking "Public Storefront" in the navigation or visiting /store while logged in.

What Buyers See: Your storefront displays:
- All items you have set to Listed, Analyzed, Ready, or Interested status
- Item photos, titles, prices, and status badges
- Search and filter tools so buyers can find what they need
- A contact form so buyers can message you about any item
- Your general location (city/state)

Customizing Your Storefront:

While the storefront layout is standard to keep things simple and professional, you can personalize it in a few ways:
1. Add a store description in your profile settings. This appears at the top of your storefront and is a great place to introduce yourself and describe what you typically sell.
2. Choose quality primary photos for each item. The storefront grid shows the first photo of each item, so make sure it is clear and attractive.
3. Set accurate prices. Buyers can filter by price range, so well-priced items get more visibility.
4. Keep your inventory current. Remove sold items promptly and add new ones regularly to keep the page fresh.

Sharing Your Storefront:

- Copy the URL and share it on social media, in emails, or on business cards.
- Use the Share buttons on your storefront page to post directly to Facebook, Twitter, or other platforms.
- Include the link in your profiles on other selling platforms to build your brand.
- Generate a QR code that links to your storefront — great for printouts and flyers.

Buyer Experience: Buyers do not need a LegacyLoop account to browse your storefront. They can view all items, see prices, and send you messages through the contact form. If they want to make a purchase, they will be guided through the process.

Tip: Share your storefront link in local community groups when you add new items. A simple "Just listed 5 new items on my shop" with the link drives traffic and sales.`,
    lastUpdated: "2026-03-30",
  },
  {
    slug: "messaging-inbox",
    title: "Using the Message Center for Buyer Communications",
    category: "Storefront & Messaging",
    categoryIcon: "🏪",
    summary:
      "How to manage buyer conversations, use quick replies, and stay organized in the Message Center.",
    content: `The Message Center is where all your buyer conversations live. It is a two-column inbox with your conversation list on the left and the active thread on the right. Here is how to use it effectively.

Accessing the Message Center: Click "Messages" in the navigation bar or go to /messages directly. A badge on the Messages link shows how many unread conversations you have.

The Inbox Layout:

Left Column: Your conversation list, sorted by most recent activity. Each conversation shows the buyer's name, the item they are asking about, a preview of the last message, and the timestamp. Unread conversations are highlighted.

Right Column: Click any conversation to see the full message thread. All messages between you and the buyer are shown in chronological order with timestamps.

Sending Messages:

1. Click on a conversation to open it.
2. Type your message in the text field at the bottom.
3. Click "Send" or press Enter.

Quick Replies: LegacyLoop provides pre-written quick reply templates for common situations. Click the "Quick Replies" button to see options like:
- "Thanks for your interest! The item is still available."
- "I can do [price] — does that work for you?"
- "Happy to send more photos. What angles would you like?"
- "The item has been sold, but I have similar items available."

Click any template to insert it, then customize before sending.

Managing Conversations:

Mark as Read/Unread: Click the dot next to any conversation to toggle read status. Use this to mark conversations you need to come back to as unread so they stay highlighted.

Buyer Information: At the top of each thread, you can see which item the buyer is asking about (with a link to the item page) and how the buyer found you (which platform or direct storefront visit).

Notifications: You receive a notification (via the bell icon) whenever a new message arrives. Make sure notifications are enabled in your settings so you do not miss buyer inquiries.

Tip: Respond to messages within a few hours whenever possible. Fast response times dramatically increase your chance of making a sale. Buyers often message multiple sellers, and the first to respond usually wins.`,
    lastUpdated: "2026-03-30",
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
    name: "AI & Bots",
    icon: "🤖",
    description: "Your 11-bot AI team and how each one helps you sell",
    count: helpArticles.filter((a) => a.category === "AI & Bots").length,
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
    name: "Projects & Estate Sales",
    icon: "📋",
    description: "Organize estate sales, garage sales, and neighborhood bundles",
    count: helpArticles.filter((a) => a.category === "Projects & Estate Sales")
      .length,
  },
  {
    name: "Marketplace & Services",
    icon: "🛒",
    description: "Credits marketplace, appraisals, and story capture",
    count: helpArticles.filter(
      (a) => a.category === "Marketplace & Services"
    ).length,
  },
  {
    name: "Storefront & Messaging",
    icon: "🏪",
    description: "Your public storefront and buyer message center",
    count: helpArticles.filter(
      (a) => a.category === "Storefront & Messaging"
    ).length,
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
    count: helpArticles.filter((a) => a.category === "Account & Billing")
      .length,
  },
  {
    name: "Safety & Trust",
    icon: "🔒",
    description: "Stay safe with pickups, transactions, and returns",
    count: helpArticles.filter((a) => a.category === "Safety & Trust").length,
  },
  {
    name: "Veterans & Heroes",
    icon: "🏅",
    description: "Discounts for veterans and first responders",
    count: helpArticles.filter((a) => a.category === "Veterans & Heroes")
      .length,
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
