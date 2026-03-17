import { prisma } from "@/lib/db";
import { notifyOfferExpired } from "@/lib/offers/notify";

/**
 * Process all expired offers:
 * - Set status to EXPIRED
 * - Return item to LISTED
 * - Create OfferEvent + EventLog
 * - Notify both parties
 */
export async function processExpiredOffers(): Promise<{ expired: number; errors: number }> {
  let expired = 0;
  let errors = 0;

  try {
    const now = new Date();

    // Find offers that are past expiresAt and still in an active status
    const staleOffers = await prisma.offer.findMany({
      where: {
        expiresAt: { lt: now },
        status: { in: ["PENDING", "COUNTERED"] },
      },
      include: {
        item: { select: { id: true, title: true, userId: true, status: true } },
      },
    });

    for (const offer of staleOffers) {
      try {
        // Update offer status
        await prisma.offer.update({
          where: { id: offer.id },
          data: { status: "EXPIRED" },
        });

        // Create OfferEvent
        await prisma.offerEvent.create({
          data: {
            offerId: offer.id,
            actorType: "SYSTEM" as any,
            action: "EXPIRED",
            price: offer.currentPrice,
            message: "Offer expired after 48 hours without response.",
          },
        });

        // Return item to LISTED if it's still OFFER_PENDING
        if (offer.item.status === "OFFER_PENDING") {
          await prisma.item.update({
            where: { id: offer.itemId },
            data: { status: "LISTED" },
          });
        }

        // Add conversation message
        if (offer.conversationId) {
          try {
            await prisma.message.create({
              data: {
                conversationId: offer.conversationId,
                sender: "system",
                content: `OFFER EXPIRED: The offer of $${(offer.currentPrice / 100).toFixed(2)} expired without a response.`,
              },
            });
          } catch { /* non-fatal */ }
        }

        // EventLog
        try {
          await prisma.eventLog.create({
            data: {
              itemId: offer.itemId,
              eventType: "offer_expired",
              payload: JSON.stringify({ offerId: offer.id, price: offer.currentPrice, round: offer.round }),
            },
          });
        } catch { /* non-fatal */ }

        // Notify
        try {
          await notifyOfferExpired({
            offer: { id: offer.id, currentPrice: offer.currentPrice, buyerEmail: offer.buyerEmail, buyerName: offer.buyerName },
            item: offer.item,
            sellerId: offer.sellerId,
          });
        } catch { /* non-fatal */ }

        expired++;
      } catch (e) {
        console.error(`[cron] Failed to expire offer ${offer.id}:`, e);
        errors++;
      }
    }
  } catch (e) {
    console.error("[cron] processExpiredOffers failed:", e);
    errors++;
  }

  return { expired, errors };
}
