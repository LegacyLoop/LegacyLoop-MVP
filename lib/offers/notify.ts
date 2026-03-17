import { sendEmail } from "@/lib/email/send";
import { prisma } from "@/lib/db";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function dollars(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function emailWrapper(body: string): string {
  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #111; color: #e5e5e5; padding: 32px; border-radius: 12px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <span style="font-size: 24px; font-weight: 700; color: #00bcd4;">LegacyLoop</span>
  </div>
  ${body}
  <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center; font-size: 12px; color: #888;">
    LegacyLoop — AI-Powered Estate Resale<br/>
    You received this email because of activity on LegacyLoop. If you believe this was sent in error, please ignore it.
  </div>
</div>`;
}

function ctaButton(text: string, url: string): string {
  return `<a href="${url}" style="display: inline-block; padding: 14px 28px; background: #00bcd4; color: #000; font-weight: 700; font-size: 16px; text-decoration: none; border-radius: 8px; margin: 16px 0;">${text}</a>`;
}

// ─── 1. Notify seller when buyer submits an offer ────────────────────────────

export async function notifySellerNewOffer(opts: {
  offer: { id: string; currentPrice: number };
  item: { id: string; title: string | null; userId: string };
  buyerName: string;
  buyerEmail: string;
  offerAmount: number;
}): Promise<void> {
  const { offer, item, buyerName, offerAmount } = opts;
  const itemTitle = item.title || "your item";

  // In-app notification
  try {
    await prisma.notification.create({
      data: {
        userId: item.userId,
        type: "OFFER",
        title: "New Offer Received!",
        message: `${buyerName} offered $${offerAmount.toFixed(2)} for ${itemTitle}`,
        link: `/items/${item.id}`,
      },
    });
  } catch (e) {
    console.warn("[offer-notify] Failed to create seller notification (non-fatal):", e);
  }

  // Email to seller
  try {
    const seller = await prisma.user.findUnique({ where: { id: item.userId }, select: { email: true, displayName: true } });
    if (seller?.email) {
      await sendEmail({
        to: seller.email,
        subject: `New offer on "${itemTitle}"`,
        html: emailWrapper(`
          <h2 style="color: #00bcd4; margin: 0 0 16px;">New Offer Received</h2>
          <p style="font-size: 16px; line-height: 1.6;"><strong>${buyerName}</strong> has submitted an offer for your item:</p>
          <div style="background: rgba(0,188,212,0.1); border: 1px solid rgba(0,188,212,0.3); border-radius: 8px; padding: 20px; text-align: center; margin: 16px 0;">
            <div style="font-size: 14px; color: #888; margin-bottom: 4px;">Offer Amount</div>
            <div style="font-size: 32px; font-weight: 700; color: #00bcd4;">$${offerAmount.toFixed(2)}</div>
            <div style="font-size: 14px; color: #aaa; margin-top: 8px;">for "${itemTitle}"</div>
          </div>
          <p style="font-size: 14px; color: #aaa;">You can accept, decline, or counter this offer from your dashboard. The offer expires in 48 hours.</p>
          <div style="text-align: center;">
            ${ctaButton("Review Offer", `${APP_URL}/items/${item.id}`)}
          </div>
        `),
      });
    }
  } catch (e) {
    console.warn("[offer-notify] Failed to email seller (non-fatal):", e);
  }
}

// ─── 2. Notify buyer when seller counters ────────────────────────────────────

export async function notifyBuyerCountered(opts: {
  offer: { id: string; buyerToken: string; currentPrice: number; originalPrice: number; round: number };
  item: { id: string; title: string | null };
  buyerName: string;
  buyerEmail: string;
  counterPrice: number;
}): Promise<void> {
  const { offer, item, buyerName, buyerEmail, counterPrice } = opts;
  const itemTitle = item.title || "the item";

  try {
    await sendEmail({
      to: buyerEmail,
      subject: `Your offer was countered — respond now`,
      html: emailWrapper(`
        <h2 style="color: #00bcd4; margin: 0 0 16px;">Counter Offer Received</h2>
        <p style="font-size: 16px; line-height: 1.6;">Hi ${buyerName},</p>
        <p style="font-size: 14px; line-height: 1.6; color: #ccc;">The seller has reviewed your offer for <strong>"${itemTitle}"</strong> and has countered with a different price:</p>
        <div style="background: rgba(0,188,212,0.1); border: 1px solid rgba(0,188,212,0.3); border-radius: 8px; padding: 20px; margin: 16px 0;">
          <div style="display: flex; justify-content: space-between; max-width: 300px; margin: 0 auto;">
            <div style="text-align: center;">
              <div style="font-size: 12px; color: #888;">Your Offer</div>
              <div style="font-size: 20px; color: #aaa; text-decoration: line-through;">$${dollars(offer.originalPrice)}</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 12px; color: #888;">Counter Offer</div>
              <div style="font-size: 28px; font-weight: 700; color: #00bcd4;">$${dollars(offer.currentPrice)}</div>
            </div>
          </div>
        </div>
        <p style="font-size: 14px; color: #f59e0b; text-align: center;">This offer expires in 48 hours.</p>
        <p style="font-size: 14px; color: #ccc;">You can accept this price, decline, or submit a counter offer of your own.</p>
        <div style="text-align: center;">
          ${ctaButton("Respond to Offer", `${APP_URL}/offers/${offer.buyerToken}`)}
        </div>
      `),
    });
  } catch (e) {
    console.warn("[offer-notify] Failed to email buyer counter (non-fatal):", e);
  }
}

// ─── 3. Notify buyer when seller accepts ─────────────────────────────────────

export async function notifyBuyerAccepted(opts: {
  offer: { id: string; currentPrice: number };
  item: { id: string; title: string | null };
  buyerName: string;
  buyerEmail: string;
  sellerId: string;
}): Promise<void> {
  const { offer, item, buyerName, buyerEmail, sellerId } = opts;
  const itemTitle = item.title || "the item";
  const priceInDollars = (offer.currentPrice / 100).toFixed(2);

  try {
    await sendEmail({
      to: buyerEmail,
      subject: `Your offer was accepted! — "${itemTitle}"`,
      html: emailWrapper(`
        <h2 style="color: #22c55e; margin: 0 0 16px;">Offer Accepted!</h2>
        <p style="font-size: 16px; line-height: 1.6;">Hi ${buyerName},</p>
        <p style="font-size: 14px; line-height: 1.6; color: #ccc;">Great news! The seller has accepted your offer for <strong>"${itemTitle}"</strong>.</p>
        <div style="background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); border-radius: 8px; padding: 20px; text-align: center; margin: 16px 0;">
          <div style="font-size: 14px; color: #888; margin-bottom: 4px;">Accepted Price</div>
          <div style="font-size: 32px; font-weight: 700; color: #22c55e;">$${priceInDollars}</div>
        </div>
        <p style="font-size: 14px; color: #ccc;">Complete your purchase to secure the item. Payment is processed securely through LegacyLoop.</p>
        <div style="text-align: center;">
          ${ctaButton("Complete Purchase", `${APP_URL}/store/${sellerId}/item/${item.id}?offeredPrice=${priceInDollars}`)}
        </div>
      `),
    });
  } catch (e) {
    console.warn("[offer-notify] Failed to email buyer accepted (non-fatal):", e);
  }
}

// ─── 4. Notify buyer when seller declines ────────────────────────────────────

export async function notifyBuyerDeclined(opts: {
  offer: { id: string; currentPrice: number };
  item: { id: string; title: string | null };
  buyerName: string;
  buyerEmail: string;
  sellerId: string;
}): Promise<void> {
  const { offer, item, buyerName, buyerEmail, sellerId } = opts;
  const itemTitle = item.title || "the item";

  try {
    await sendEmail({
      to: buyerEmail,
      subject: `Update on your offer for "${itemTitle}"`,
      html: emailWrapper(`
        <h2 style="color: #e5e5e5; margin: 0 0 16px;">Offer Update</h2>
        <p style="font-size: 16px; line-height: 1.6;">Hi ${buyerName},</p>
        <p style="font-size: 14px; line-height: 1.6; color: #ccc;">Thank you for your interest in <strong>"${itemTitle}"</strong>. Unfortunately, the seller has decided not to accept your offer of <strong>$${dollars(offer.currentPrice)}</strong> at this time.</p>
        <p style="font-size: 14px; line-height: 1.6; color: #ccc;">The item is still available — you are welcome to submit a new offer or browse other items in the seller's store.</p>
        <div style="text-align: center;">
          ${ctaButton("View Item", `${APP_URL}/store/${sellerId}/item/${item.id}`)}
        </div>
      `),
    });
  } catch (e) {
    console.warn("[offer-notify] Failed to email buyer declined (non-fatal):", e);
  }
}

// ─── 5. Notify seller when buyer counters via magic link ─────────────────────

export async function notifySellerBuyerResponded(opts: {
  offer: { id: string; currentPrice: number; round: number };
  item: { id: string; title: string | null; userId: string };
  buyerName: string;
  action: "ACCEPTED" | "DECLINED" | "COUNTERED";
  counterPrice?: number;
}): Promise<void> {
  const { offer, item, buyerName, action } = opts;
  const itemTitle = item.title || "the item";

  const titleMap = {
    ACCEPTED: "Buyer accepted your offer!",
    DECLINED: "Buyer declined the counter offer",
    COUNTERED: `Buyer countered your offer on "${itemTitle}"`,
  };
  const messageMap = {
    ACCEPTED: `${buyerName} accepted your offer of $${dollars(offer.currentPrice)} for ${itemTitle}. Sale pending!`,
    DECLINED: `${buyerName} declined your counter offer for ${itemTitle}. The item is back to listed.`,
    COUNTERED: `${buyerName} countered at $${dollars(offer.currentPrice)} for ${itemTitle} (round ${offer.round}).`,
  };

  // In-app notification
  try {
    await prisma.notification.create({
      data: {
        userId: item.userId,
        type: "OFFER",
        title: titleMap[action],
        message: messageMap[action],
        link: `/items/${item.id}`,
      },
    });
  } catch (e) {
    console.warn("[offer-notify] Failed to create seller notification for buyer response (non-fatal):", e);
  }

  // Email to seller
  try {
    const seller = await prisma.user.findUnique({ where: { id: item.userId }, select: { email: true } });
    if (seller?.email) {
      const colorMap = { ACCEPTED: "#22c55e", DECLINED: "#ef4444", COUNTERED: "#f59e0b" };
      const color = colorMap[action];

      await sendEmail({
        to: seller.email,
        subject: titleMap[action],
        html: emailWrapper(`
          <h2 style="color: ${color}; margin: 0 0 16px;">${titleMap[action]}</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #ccc;">${messageMap[action]}</p>
          ${action === "COUNTERED" ? `
          <div style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 8px; padding: 20px; text-align: center; margin: 16px 0;">
            <div style="font-size: 14px; color: #888;">Buyer's Counter Offer</div>
            <div style="font-size: 28px; font-weight: 700; color: #f59e0b;">$${dollars(offer.currentPrice)}</div>
            <div style="font-size: 12px; color: #888; margin-top: 4px;">Round ${offer.round}</div>
          </div>` : ""}
          <div style="text-align: center;">
            ${ctaButton("View in Dashboard", `${APP_URL}/items/${item.id}`)}
          </div>
        `),
      });
    }
  } catch (e) {
    console.warn("[offer-notify] Failed to email seller buyer response (non-fatal):", e);
  }
}

// ─── 6. Notify both parties when offer expires ───────────────────────────────

export async function notifyOfferExpired(opts: {
  offer: { id: string; currentPrice: number; buyerEmail: string; buyerName: string };
  item: { id: string; title: string | null; userId: string };
  sellerId: string;
}): Promise<void> {
  const { offer, item, sellerId } = opts;
  const itemTitle = item.title || "the item";

  // Seller: in-app notification
  try {
    await prisma.notification.create({
      data: {
        userId: item.userId,
        type: "OFFER",
        title: "Offer Expired",
        message: `The offer from ${offer.buyerName} for ${itemTitle} ($${dollars(offer.currentPrice)}) has expired.`,
        link: `/items/${item.id}`,
      },
    });
  } catch (e) {
    console.warn("[offer-notify] Failed to create expiry notification (non-fatal):", e);
  }

  // Seller email
  try {
    const seller = await prisma.user.findUnique({ where: { id: sellerId }, select: { email: true } });
    if (seller?.email) {
      await sendEmail({
        to: seller.email,
        subject: `Offer expired for "${itemTitle}"`,
        html: emailWrapper(`
          <h2 style="color: #888; margin: 0 0 16px;">Offer Expired</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #ccc;">The offer from <strong>${offer.buyerName}</strong> for <strong>"${itemTitle}"</strong> ($${dollars(offer.currentPrice)}) has expired without a response. Your item has been returned to listed status.</p>
        `),
      });
    }
  } catch (e) {
    console.warn("[offer-notify] Failed to email seller expiry (non-fatal):", e);
  }

  // Buyer email
  try {
    await sendEmail({
      to: offer.buyerEmail,
      subject: `Your offer for "${itemTitle}" has expired`,
      html: emailWrapper(`
        <h2 style="color: #888; margin: 0 0 16px;">Offer Expired</h2>
        <p style="font-size: 16px; line-height: 1.6;">Hi ${offer.buyerName},</p>
        <p style="font-size: 14px; line-height: 1.6; color: #ccc;">Your offer of <strong>$${dollars(offer.currentPrice)}</strong> for <strong>"${itemTitle}"</strong> has expired. The item is still available — you are welcome to submit a new offer.</p>
        <div style="text-align: center;">
          ${ctaButton("View Item", `${APP_URL}/store/${sellerId}/item/${item.id}`)}
        </div>
      `),
    });
  } catch (e) {
    console.warn("[offer-notify] Failed to email buyer expiry (non-fatal):", e);
  }
}
