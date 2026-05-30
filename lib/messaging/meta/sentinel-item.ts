// CMD-W25-META-L2 · Sentinel "Meta Inbox" Item per user.
//
// Conversation FK requires an Item. For Meta inbound messages not yet tied to a
// listed item, we attach the Conversation to a per-user sentinel placeholder Item
// with a deterministic id ("meta-inbox-<userId>-<platform>"). DRAFT status keeps
// it out of public catalog. ZERO schema (uses existing Item fields).

import { prisma } from "@/lib/db";
import type { MetaPlatform } from "./types";

export async function getOrCreateMetaInboxItem(
  userId: string,
  platform: MetaPlatform,
): Promise<string> {
  const id = `meta-inbox-${userId}-${platform}`;
  const existing = await prisma.item.findUnique({ where: { id }, select: { id: true } });
  if (existing) return existing.id;

  const title = platform === "facebook" ? "Messenger Inbox" : "Instagram Inbox";
  const created = await prisma.item.create({
    data: {
      id,
      userId,
      status: "DRAFT",
      title,
      description: "Placeholder for incoming Meta direct messages not tied to a listed item.",
    },
    select: { id: true },
  });
  return created.id;
}
