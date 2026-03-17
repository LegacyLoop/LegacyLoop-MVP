/**
 * Email Templates — HTML strings for transactional emails
 * Light theme for email clients (white bg, dark text, teal accent buttons)
 */

const LOGO_URL = "https://legacyloop.com/images/logos/logo-horizontal.png";
const ACCENT = "#00bcd4";
const BTN_STYLE = `display:inline-block;padding:12px 32px;background:${ACCENT};color:#fff;text-decoration:none;font-weight:700;border-radius:8px;font-size:16px`;

function wrapper(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px">
  <tr><td style="padding:32px 32px 16px;text-align:center;border-bottom:1px solid #e5e5e5">
    <div style="font-size:24px;font-weight:800;color:${ACCENT}">LegacyLoop</div>
  </td></tr>
  <tr><td style="padding:32px">${content}</td></tr>
  <tr><td style="padding:24px 32px;background:#f9fafb;text-align:center;border-top:1px solid #e5e5e5">
    <div style="font-size:12px;color:#6b7280;line-height:1.6">
      <a href="https://legacyloop.com/privacy" style="color:${ACCENT};text-decoration:none">Privacy Policy</a> ·
      <a href="https://legacyloop.com/terms" style="color:${ACCENT};text-decoration:none">Terms of Service</a><br>
      LegacyLoop · (512) 758-0518 · legacyloopmaine@gmail.com<br>
      <a href="https://legacyloop.com/settings" style="color:${ACCENT};text-decoration:none">Manage Preferences</a>
    </div>
  </td></tr>
</table>
</body>
</html>`;
}

export function welcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: "Welcome to LegacyLoop! Let's get started",
    html: wrapper(`
      <h1 style="font-size:24px;font-weight:800;color:#1a1a1a;margin:0 0 16px">Welcome, ${name}!</h1>
      <p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 24px">
        You've just joined the smartest way to sell your belongings. Here's how to get started:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:12px 0;border-bottom:1px solid #f3f4f6">
          <strong style="color:${ACCENT}">Step 1:</strong> <span style="color:#374151">Upload a photo of any item</span>
        </td></tr>
        <tr><td style="padding:12px 0;border-bottom:1px solid #f3f4f6">
          <strong style="color:${ACCENT}">Step 2:</strong> <span style="color:#374151">Our AI instantly prices it for you</span>
        </td></tr>
        <tr><td style="padding:12px 0">
          <strong style="color:${ACCENT}">Step 3:</strong> <span style="color:#374151">List it and sell to real buyers</span>
        </td></tr>
      </table>
      <div style="text-align:center;margin:32px 0 16px">
        <a href="https://legacyloop.com/items/new" style="${BTN_STYLE}">Upload Your First Item</a>
      </div>
      <p style="font-size:14px;color:#6b7280;text-align:center">
        Questions? Reply to this email or call (512) 758-0518.
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
      <h1 style="font-size:24px;font-weight:800;color:#1a1a1a;margin:0 0 8px">Congratulations, ${sellerName}!</h1>
      <p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 24px">
        Your item has been purchased. Here's the breakdown:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px">
        <tr><td style="padding:8px 16px;font-size:14px;color:#6b7280">Item</td>
            <td style="padding:8px 16px;font-size:14px;color:#1a1a1a;font-weight:600;text-align:right">${itemTitle}</td></tr>
        <tr><td style="padding:8px 16px;font-size:14px;color:#6b7280">Sale Amount</td>
            <td style="padding:8px 16px;font-size:14px;color:#1a1a1a;font-weight:600;text-align:right">$${saleAmount.toFixed(2)}</td></tr>
        <tr><td style="padding:8px 16px;font-size:14px;color:#6b7280">Commission</td>
            <td style="padding:8px 16px;font-size:14px;color:#ef4444;font-weight:600;text-align:right">-$${commission.toFixed(2)}</td></tr>
        <tr style="border-top:2px solid #e5e5e5"><td style="padding:12px 16px;font-size:16px;color:#1a1a1a;font-weight:800">Your Earnings</td>
            <td style="padding:12px 16px;font-size:16px;color:${ACCENT};font-weight:800;text-align:right">$${netEarnings.toFixed(2)}</td></tr>
      </table>
      <div style="text-align:center;margin:32px 0 16px">
        <a href="https://legacyloop.com/items/${itemId}" style="${BTN_STYLE}">Ship Your Item</a>
      </div>
      <p style="font-size:13px;color:#6b7280;text-align:center">
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
      <h1 style="font-size:24px;font-weight:800;color:#1a1a1a;margin:0 0 8px">Order Confirmed!</h1>
      <p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 24px">
        Hi ${buyerName}, your purchase is confirmed. The seller has been notified.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px">
        <tr><td style="padding:8px 16px;font-size:14px;color:#6b7280">Item</td>
            <td style="padding:8px 16px;font-size:14px;color:#1a1a1a;font-weight:600;text-align:right">${itemTitle}</td></tr>
        <tr><td style="padding:8px 16px;font-size:14px;color:#6b7280">Price</td>
            <td style="padding:8px 16px;font-size:14px;color:#1a1a1a;text-align:right">$${itemPrice.toFixed(2)}</td></tr>
        ${shippingCost > 0 ? `<tr><td style="padding:8px 16px;font-size:14px;color:#6b7280">Shipping</td>
            <td style="padding:8px 16px;font-size:14px;color:#1a1a1a;text-align:right">$${shippingCost.toFixed(2)}</td></tr>` : ""}
        <tr><td style="padding:8px 16px;font-size:14px;color:#6b7280">Processing Fee (3.5%)</td>
            <td style="padding:8px 16px;font-size:14px;color:#6b7280;text-align:right">$${processingFee.toFixed(2)}</td></tr>
        <tr style="border-top:2px solid #e5e5e5"><td style="padding:12px 16px;font-size:16px;font-weight:800;color:#1a1a1a">Total</td>
            <td style="padding:12px 16px;font-size:16px;font-weight:800;color:${ACCENT};text-align:right">$${total.toFixed(2)}</td></tr>
      </table>
      <p style="font-size:14px;color:#374151;margin:24px 0 16px;line-height:1.6">
        Estimated delivery: <strong>3-7 business days</strong> after the seller ships.
        You'll receive tracking information once your item ships.
      </p>
      <div style="text-align:center;margin:24px 0 16px">
        <a href="https://legacyloop.com/dashboard" style="${BTN_STYLE}">View Dashboard</a>
      </div>
    `),
  };
}
