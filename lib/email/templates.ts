/**
 * Email Templates — Unified Dark Premium Theme
 * Matches the LegacyLoop app design system exactly.
 */

const ACCENT = "#00bcd4";
const BG_DARK = "#0d1117";
const BG_CARD = "#161b22";
const TEXT_PRIMARY = "#f0f6fc";
const TEXT_SECONDARY = "#8b949e";
const TEXT_MUTED = "#484f58";
const BORDER = "rgba(0,188,212,0.15)";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://legacy-loop.com";

function ctaButton(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;padding:14px 32px;background:${ACCENT};color:#fff;text-decoration:none;font-weight:700;border-radius:8px;font-size:16px">${text}</a>`;
}

function wrapper(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BG_DARK};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:20px auto;background:${BG_CARD};border-radius:12px;overflow:hidden;border:1px solid ${BORDER}">
  <tr><td style="padding:28px 32px 16px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06)">
    <div style="display:inline-flex;align-items:center;gap:10px">
      <div style="width:36px;height:36px;background:${ACCENT};border-radius:10px;display:inline-flex;align-items:center;justify-content:center;font-weight:900;color:#fff;font-size:16px">LL</div>
      <span style="font-size:22px;font-weight:800;color:${TEXT_PRIMARY};letter-spacing:-0.5px">LegacyLoop</span>
    </div>
  </td></tr>
  <tr><td style="padding:32px">${content}</td></tr>
  <tr><td style="padding:20px 32px;background:rgba(255,255,255,0.02);text-align:center;border-top:1px solid rgba(255,255,255,0.06)">
    <div style="font-size:12px;color:${TEXT_MUTED};line-height:1.8">
      <a href="${APP_URL}/privacy" style="color:${ACCENT};text-decoration:none">Privacy Policy</a> &middot;
      <a href="${APP_URL}/terms" style="color:${ACCENT};text-decoration:none">Terms of Service</a><br>
      LegacyLoop &middot; support@legacy-loop.com<br>
      <a href="${APP_URL}/settings" style="color:${ACCENT};text-decoration:none">Manage Preferences</a>
    </div>
  </td></tr>
</table>
</body>
</html>`;
}

// ─── Existing templates (same signatures) ─────────────────────────────────

export function welcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: "Welcome to LegacyLoop! Let's get started",
    html: wrapper(`
      <h1 style="font-size:24px;font-weight:800;color:${TEXT_PRIMARY};margin:0 0 16px">Welcome, ${name}!</h1>
      <p style="font-size:16px;color:${TEXT_SECONDARY};line-height:1.6;margin:0 0 24px">
        You've just joined the smartest way to sell your belongings. Here's how to get started:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
          <strong style="color:${ACCENT}">Step 1:</strong> <span style="color:${TEXT_SECONDARY}">Upload a photo of any item</span>
        </td></tr>
        <tr><td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
          <strong style="color:${ACCENT}">Step 2:</strong> <span style="color:${TEXT_SECONDARY}">Our AI instantly prices it for you</span>
        </td></tr>
        <tr><td style="padding:12px 0">
          <strong style="color:${ACCENT}">Step 3:</strong> <span style="color:${TEXT_SECONDARY}">List it and sell to real buyers</span>
        </td></tr>
      </table>
      <div style="text-align:center;margin:32px 0 16px">
        ${ctaButton("Upload Your First Item", `${APP_URL}/items/new`)}
      </div>
      <p style="font-size:14px;color:${TEXT_MUTED};text-align:center">
        Questions? Email <a href="mailto:support@legacy-loop.com" style="color:${ACCENT};text-decoration:none">support@legacy-loop.com</a>
      </p>
    `),
  };
}

export function itemSoldEmail(
  sellerName: string,
  itemTitle: string,
  saleAmount: number,
  commission: number,
  netEarnings: number,
  itemId: string
): { subject: string; html: string } {
  return {
    subject: `Your ${itemTitle} just sold for $${saleAmount.toFixed(2)}!`,
    html: wrapper(`
      <h1 style="font-size:24px;font-weight:800;color:${TEXT_PRIMARY};margin:0 0 8px">Congratulations, ${sellerName}!</h1>
      <p style="font-size:16px;color:${TEXT_SECONDARY};line-height:1.6;margin:0 0 24px">
        Your item has been purchased. Here's the breakdown:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid ${BORDER}">
        <tr><td style="padding:10px 16px;font-size:14px;color:${TEXT_SECONDARY}">Item</td>
            <td style="padding:10px 16px;font-size:14px;color:${TEXT_PRIMARY};font-weight:600;text-align:right">${itemTitle}</td></tr>
        <tr><td style="padding:10px 16px;font-size:14px;color:${TEXT_SECONDARY}">Sale Amount</td>
            <td style="padding:10px 16px;font-size:14px;color:${TEXT_PRIMARY};font-weight:600;text-align:right">$${saleAmount.toFixed(2)}</td></tr>
        <tr><td style="padding:10px 16px;font-size:14px;color:${TEXT_SECONDARY}">Commission</td>
            <td style="padding:10px 16px;font-size:14px;color:#ef4444;font-weight:600;text-align:right">-$${commission.toFixed(2)}</td></tr>
        <tr style="border-top:2px solid rgba(255,255,255,0.08)"><td style="padding:12px 16px;font-size:16px;color:${TEXT_PRIMARY};font-weight:800">Your Earnings</td>
            <td style="padding:12px 16px;font-size:16px;color:${ACCENT};font-weight:800;text-align:right">$${netEarnings.toFixed(2)}</td></tr>
      </table>
      <div style="text-align:center;margin:32px 0 16px">
        ${ctaButton("Ship Your Item", `${APP_URL}/items/${itemId}`)}
      </div>
      <p style="font-size:13px;color:${TEXT_MUTED};text-align:center">
        Earnings are available for payout after a 3-day hold period.
      </p>
    `),
  };
}

export function orderConfirmationEmail(
  buyerName: string,
  itemTitle: string,
  itemPrice: number,
  shippingCost: number,
  processingFee: number,
  total: number
): { subject: string; html: string } {
  return {
    subject: `Order confirmed — ${itemTitle}`,
    html: wrapper(`
      <h1 style="font-size:24px;font-weight:800;color:${TEXT_PRIMARY};margin:0 0 8px">Order Confirmed!</h1>
      <p style="font-size:16px;color:${TEXT_SECONDARY};line-height:1.6;margin:0 0 24px">
        Hi ${buyerName}, your purchase is confirmed. The seller has been notified.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid ${BORDER}">
        <tr><td style="padding:10px 16px;font-size:14px;color:${TEXT_SECONDARY}">Item</td>
            <td style="padding:10px 16px;font-size:14px;color:${TEXT_PRIMARY};font-weight:600;text-align:right">${itemTitle}</td></tr>
        <tr><td style="padding:10px 16px;font-size:14px;color:${TEXT_SECONDARY}">Price</td>
            <td style="padding:10px 16px;font-size:14px;color:${TEXT_PRIMARY};text-align:right">$${itemPrice.toFixed(2)}</td></tr>
        ${shippingCost > 0 ? `<tr><td style="padding:10px 16px;font-size:14px;color:${TEXT_SECONDARY}">Shipping</td>
            <td style="padding:10px 16px;font-size:14px;color:${TEXT_PRIMARY};text-align:right">$${shippingCost.toFixed(2)}</td></tr>` : ""}
        <tr><td style="padding:10px 16px;font-size:14px;color:${TEXT_SECONDARY}">Processing Fee (your share)</td>
            <td style="padding:10px 16px;font-size:14px;color:${TEXT_MUTED};text-align:right">$${processingFee.toFixed(2)}</td></tr>
        <tr style="border-top:2px solid rgba(255,255,255,0.08)"><td style="padding:12px 16px;font-size:16px;font-weight:800;color:${TEXT_PRIMARY}">Total</td>
            <td style="padding:12px 16px;font-size:16px;font-weight:800;color:${ACCENT};text-align:right">$${total.toFixed(2)}</td></tr>
      </table>
      <p style="font-size:14px;color:${TEXT_SECONDARY};margin:24px 0 16px;line-height:1.6">
        Estimated delivery: <strong style="color:${TEXT_PRIMARY}">3-7 business days</strong> after the seller ships.
        You'll receive tracking information once your item ships.
      </p>
      <div style="text-align:center;margin:24px 0 16px">
        ${ctaButton("View Dashboard", `${APP_URL}/dashboard`)}
      </div>
    `),
  };
}

// ─── New templates ────────────────────────────────────────────────────────

export function creditPurchaseEmail(
  name: string,
  creditAmount: number,
  newBalance: number,
  amountPaid: number
): { subject: string; html: string } {
  return {
    subject: `${creditAmount} credits added to your account!`,
    html: wrapper(`
      <h1 style="font-size:24px;font-weight:800;color:${TEXT_PRIMARY};margin:0 0 16px">Credits Added!</h1>
      <p style="font-size:16px;color:${TEXT_SECONDARY};line-height:1.6;margin:0 0 24px">
        Hi ${name}, your credit purchase is confirmed.
      </p>
      <div style="background:rgba(0,188,212,0.08);border:1px solid rgba(0,188,212,0.25);border-radius:12px;padding:24px;text-align:center;margin:0 0 24px">
        <div style="font-size:14px;color:${TEXT_MUTED};margin-bottom:4px">Credits Added</div>
        <div style="font-size:36px;font-weight:800;color:${ACCENT}">+${creditAmount}</div>
        <div style="font-size:14px;color:${TEXT_SECONDARY};margin-top:8px">New Balance: <strong style="color:${TEXT_PRIMARY}">${newBalance} credits</strong></div>
        <div style="font-size:13px;color:${TEXT_MUTED};margin-top:4px">Amount Paid: $${amountPaid.toFixed(2)}</div>
      </div>
      <div style="text-align:center;margin:24px 0 16px">
        ${ctaButton("Explore Add-Ons", `${APP_URL}/credits`)}
      </div>
    `),
  };
}

export function subscriptionUpgradeEmail(
  name: string,
  planName: string,
  amountPaid: number,
  billing: string
): { subject: string; html: string } {
  return {
    subject: `Welcome to ${planName}! Your upgrade is confirmed`,
    html: wrapper(`
      <h1 style="font-size:24px;font-weight:800;color:${TEXT_PRIMARY};margin:0 0 16px">Upgrade Confirmed!</h1>
      <p style="font-size:16px;color:${TEXT_SECONDARY};line-height:1.6;margin:0 0 24px">
        Hi ${name}, welcome to the <strong style="color:${TEXT_PRIMARY}">${planName}</strong> plan.
      </p>
      <div style="background:rgba(0,188,212,0.08);border:1px solid rgba(0,188,212,0.25);border-radius:12px;padding:24px;text-align:center;margin:0 0 24px">
        <div style="font-size:14px;color:${TEXT_MUTED};margin-bottom:4px">Your Plan</div>
        <div style="font-size:28px;font-weight:800;color:${ACCENT}">${planName}</div>
        <div style="font-size:14px;color:${TEXT_SECONDARY};margin-top:8px">$${amountPaid.toFixed(2)}/${billing === "annual" ? "year" : "month"}</div>
      </div>
      <p style="font-size:14px;color:${TEXT_SECONDARY};line-height:1.6;margin:0 0 24px">
        All features are unlocked immediately. Your subscription renews automatically.
      </p>
      <div style="text-align:center;margin:24px 0 16px">
        ${ctaButton("View Dashboard", `${APP_URL}/dashboard`)}
      </div>
    `),
  };
}

export function ltlQuoteRequestEmail(
  requesterEmail: string,
  itemId: string,
  originZip: string,
  destZip: string,
  weight: string,
  formatted: string
): { subject: string; html: string } {
  return {
    subject: `LTL Freight Quote Request — Item ${itemId}`,
    html: wrapper(`
      <h1 style="font-size:22px;font-weight:800;color:${TEXT_PRIMARY};margin:0 0 16px">LTL Freight Quote Request</h1>
      <p style="font-size:14px;color:${TEXT_SECONDARY};margin:0 0 24px">
        From: <strong style="color:${TEXT_PRIMARY}">${requesterEmail}</strong>
      </p>
      <div style="background:rgba(255,255,255,0.03);border:1px solid ${BORDER};border-radius:8px;padding:20px;margin:0 0 24px;font-family:monospace;font-size:13px;color:${TEXT_SECONDARY};white-space:pre-wrap;line-height:1.6">${formatted}</div>
      <div style="text-align:center;margin:24px 0 16px">
        ${ctaButton("View Item", `${APP_URL}/items/${itemId}`)}
      </div>
    `),
  };
}

// ─── Trade Notification Templates ────────────────────────────────────────

export function tradeAcceptedEmail(itemTitle: string, totalValue: number): string {
  return wrapper(`
    <h2 style="color:${TEXT_PRIMARY};font-size:22px;margin:0 0 8px">Trade Accepted! 🎉</h2>
    <p style="color:${TEXT_SECONDARY};font-size:15px;line-height:1.6;margin:0 0 20px">Your trade proposal for <strong style="color:${TEXT_PRIMARY}">${itemTitle}</strong> (valued at $${Math.round(totalValue)}) has been accepted by the seller.</p>
    <p style="color:${TEXT_SECONDARY};font-size:14px;line-height:1.5;margin:0 0 24px">Next steps: coordinate with the seller to arrange the exchange. Check your messages for details.</p>
    ${ctaButton("View Trade Details", `${APP_URL}/messages`)}
  `);
}

export function tradeDeclinedEmail(itemTitle: string): string {
  return wrapper(`
    <h2 style="color:${TEXT_PRIMARY};font-size:22px;margin:0 0 8px">Trade Proposal Declined</h2>
    <p style="color:${TEXT_SECONDARY};font-size:15px;line-height:1.6;margin:0 0 20px">Your trade proposal for <strong style="color:${TEXT_PRIMARY}">${itemTitle}</strong> was declined by the seller.</p>
    <p style="color:${TEXT_SECONDARY};font-size:14px;line-height:1.5;margin:0 0 24px">You can submit a new offer or browse other items on LegacyLoop.</p>
    ${ctaButton("Browse Items", `${APP_URL}/search`)}
  `);
}

export function tradeCounteredEmail(itemTitle: string, counterCash: number, counterNote: string | null): string {
  return wrapper(`
    <h2 style="color:${TEXT_PRIMARY};font-size:22px;margin:0 0 8px">Counter-Proposal Received 🔄</h2>
    <p style="color:${TEXT_SECONDARY};font-size:15px;line-height:1.6;margin:0 0 12px">The seller responded to your trade proposal for <strong style="color:${TEXT_PRIMARY}">${itemTitle}</strong> with a counter-offer.</p>
    ${counterCash > 0 ? `<p style="color:${ACCENT};font-size:16px;font-weight:700;margin:0 0 12px">Counter: $${Math.round(counterCash)} cash requested</p>` : ""}
    ${counterNote ? `<p style="color:${TEXT_MUTED};font-size:14px;font-style:italic;margin:0 0 20px">"${counterNote}"</p>` : ""}
    <p style="color:${TEXT_SECONDARY};font-size:14px;line-height:1.5;margin:0 0 24px">Review the counter-proposal and respond.</p>
    ${ctaButton("View Counter-Proposal", `${APP_URL}/messages`)}
  `);
}

// ─── Return/Refund Notification Templates ────────────────────────────────

export function returnRequestedSellerEmail(itemTitle: string, buyerEmail: string, reason: string, refundAmount: number, returnUrl: string): string {
  return wrapper(`
    <h2 style="color:${TEXT_PRIMARY};font-size:22px;margin:0 0 8px">Return Requested 📦</h2>
    <p style="color:${TEXT_SECONDARY};font-size:15px;line-height:1.6;margin:0 0 12px">A buyer has requested a return for <strong style="color:${TEXT_PRIMARY}">${itemTitle}</strong>.</p>
    <p style="color:${TEXT_SECONDARY};font-size:14px;margin:0 0 8px">Buyer: <strong style="color:${TEXT_PRIMARY}">${buyerEmail}</strong></p>
    <p style="color:${TEXT_SECONDARY};font-size:14px;margin:0 0 8px">Reason: <strong style="color:${TEXT_PRIMARY}">${reason}</strong></p>
    <p style="color:${TEXT_SECONDARY};font-size:14px;margin:0 0 20px">Refund amount: <strong style="color:${ACCENT}">$${Math.round(refundAmount)}</strong> (processing fee non-refundable)</p>
    <p style="color:${TEXT_MUTED};font-size:13px;margin:0 0 24px">Please review and respond within 48 hours.</p>
    ${ctaButton("Review Return Request", returnUrl)}
  `);
}

export function returnRequestedBuyerEmail(itemTitle: string, reason: string, refundAmount: number): string {
  return wrapper(`
    <h2 style="color:${TEXT_PRIMARY};font-size:22px;margin:0 0 8px">Return Request Submitted ✅</h2>
    <p style="color:${TEXT_SECONDARY};font-size:15px;line-height:1.6;margin:0 0 12px">Your return request for <strong style="color:${TEXT_PRIMARY}">${itemTitle}</strong> has been submitted.</p>
    <p style="color:${TEXT_SECONDARY};font-size:14px;margin:0 0 8px">Reason: ${reason}</p>
    <p style="color:${TEXT_SECONDARY};font-size:14px;margin:0 0 20px">If approved, you'll receive a refund of <strong style="color:${ACCENT}">$${Math.round(refundAmount)}</strong>.</p>
    <p style="color:${TEXT_MUTED};font-size:13px;margin:0 0 24px">The seller will review your request within 48 hours. Processing fee is non-refundable.</p>
  `);
}

export function returnApprovedBuyerEmail(itemTitle: string, refundAmount: number): string {
  return wrapper(`
    <h2 style="color:${TEXT_PRIMARY};font-size:22px;margin:0 0 8px">Return Approved 🎉</h2>
    <p style="color:${TEXT_SECONDARY};font-size:15px;line-height:1.6;margin:0 0 12px">Your return for <strong style="color:${TEXT_PRIMARY}">${itemTitle}</strong> has been approved!</p>
    <p style="color:${ACCENT};font-size:18px;font-weight:700;margin:0 0 12px">Refund: $${Math.round(refundAmount)}</p>
    <p style="color:${TEXT_SECONDARY};font-size:14px;line-height:1.5;margin:0 0 24px">Please ship the item back to the seller using a tracked shipping method within 7 days. Your refund will be processed once the seller confirms receipt.</p>
  `);
}

export function returnDeniedBuyerEmail(itemTitle: string, reason: string): string {
  return wrapper(`
    <h2 style="color:${TEXT_PRIMARY};font-size:22px;margin:0 0 8px">Return Request Update</h2>
    <p style="color:${TEXT_SECONDARY};font-size:15px;line-height:1.6;margin:0 0 12px">Your return request for <strong style="color:${TEXT_PRIMARY}">${itemTitle}</strong> was not approved.</p>
    ${reason ? `<p style="color:${TEXT_SECONDARY};font-size:14px;margin:0 0 20px">Reason: ${reason}</p>` : ""}
    <p style="color:${TEXT_MUTED};font-size:13px;margin:0 0 24px">If you believe this is an error, please contact our support team.</p>
    ${ctaButton("Contact Support", `${APP_URL}/messages`)}
  `);
}

// ─── Buyer Outreach ─────────────────────────────────────────────────────

export function buyerOutreachEmail(message: string, itemName: string, itemUrl: string): string {
  return wrapper(`
    <h2 style="color:${ACCENT};font-size:22px;margin:0 0 16px">About: ${itemName}</h2>
    <div style="font-size:15px;line-height:1.6;color:${TEXT_SECONDARY}">
      ${message.replace(/\n/g, "<br>")}
    </div>
    <div style="margin-top:24px;text-align:center">
      ${ctaButton("View Item Details", itemUrl)}
    </div>
    <p style="color:${TEXT_MUTED};font-size:12px;margin-top:20px">
      Sent via LegacyLoop — AI-powered estate resale platform
    </p>
  `);
}

// ─── Exports ──────────────────────────────────────────────────────────────

export { wrapper as emailWrapper, ctaButton, ACCENT, APP_URL, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, BG_DARK, BG_CARD, BORDER };
