// CMD-W26-D · Meta data deletion job.
// Deletes all Meta-derived records for a Facebook app-scoped user_id.
// ZERO schema — operates only on existing models (§9 push-back honored):
//   - User.facebookId (the Meta linkage) → cleared
//   - ConnectedPlatform rows (facebook / instagram) → deleted
//   - Meta-inbox sentinel Items ("meta-inbox-<userId>-<platform>") + their
//     Conversations / Messages / Offers → deleted  (see lib/messaging/meta/*)
//
// Idempotent: a user_id with no local data still resolves successfully (nothing
// to delete). Never throws to the caller — returns a structured result.

import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";

const META_PLATFORMS = ["facebook", "instagram"] as const;

export interface DeletionResult {
  confirmationCode: string;
  status: "completed" | "nothing_to_delete" | "error";
  deleted: {
    users: number;
    connectedPlatforms: number;
    items: number;
    conversations: number;
    messages: number;
    offers: number;
  };
}

/** Stable, non-reversible confirmation code derived from the Meta user id. */
export function deletionConfirmationCode(userId: string): string {
  const salt = process.env.META_APP_SECRET || process.env.FACEBOOK_CLIENT_SECRET || "ll";
  return "del_" + createHash("sha256").update(`${userId}|${salt}`).digest("hex").slice(0, 24);
}

export async function runMetaDataDeletion(metaUserId: string): Promise<DeletionResult> {
  const confirmationCode = deletionConfirmationCode(metaUserId);
  const deleted = {
    users: 0,
    connectedPlatforms: 0,
    items: 0,
    conversations: 0,
    messages: 0,
    offers: 0,
  };

  try {
    const user = await prisma.user.findUnique({
      where: { facebookId: metaUserId },
      select: { id: true },
    });

    if (!user) {
      // Idempotent / unknown user — still a valid, successful deletion result.
      console.info(
        `[meta-deletion] code=${confirmationCode} metaUserId=${metaUserId} result=nothing_to_delete`,
      );
      return { confirmationCode, status: "nothing_to_delete", deleted };
    }

    // Meta-inbox sentinel items for this user (one per platform).
    const sentinelIds = META_PLATFORMS.map((p) => `meta-inbox-${user.id}-${p}`);
    const sentinelItems = await prisma.item.findMany({
      where: { id: { in: sentinelIds } },
      select: { id: true },
    });
    const itemIds = sentinelItems.map((i) => i.id);

    if (itemIds.length > 0) {
      const convos = await prisma.conversation.findMany({
        where: { itemId: { in: itemIds } },
        select: { id: true },
      });
      const convoIds = convos.map((c) => c.id);

      if (convoIds.length > 0) {
        const m = await prisma.message.deleteMany({ where: { conversationId: { in: convoIds } } });
        deleted.messages += m.count;
      }
      // Offers reference itemId (conversationId optional) — clear by sentinel item.
      const o = await prisma.offer.deleteMany({ where: { itemId: { in: itemIds } } });
      deleted.offers += o.count;

      const c = await prisma.conversation.deleteMany({ where: { itemId: { in: itemIds } } });
      deleted.conversations += c.count;

      const it = await prisma.item.deleteMany({ where: { id: { in: itemIds } } });
      deleted.items += it.count;
    }

    const cp = await prisma.connectedPlatform.deleteMany({
      where: { userId: user.id, platform: { in: [...META_PLATFORMS] } },
    });
    deleted.connectedPlatforms += cp.count;

    // Sever the Meta linkage on the user record (additive field clear, no row delete).
    await prisma.user.update({ where: { id: user.id }, data: { facebookId: null } });
    deleted.users = 1;

    console.info(
      `[meta-deletion] code=${confirmationCode} userId=${user.id} result=completed ${JSON.stringify(deleted)}`,
    );
    return { confirmationCode, status: "completed", deleted };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error(`[meta-deletion] code=${confirmationCode} ERROR: ${message}`);
    return { confirmationCode, status: "error", deleted };
  }
}
