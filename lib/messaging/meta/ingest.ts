// CMD-W25-META-L2 · Normalize Meta event → Conversation/Message persistence.
// Idempotent on Meta mid via deterministic Message.id ("fbmid_" + sha256 prefix).
// World-A only (Rule #11). No direct AI HTTP — auto-reply goes via lib/messaging/auto-reply.ts → LiteLLM.

import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { tryAutoReply } from "@/lib/messaging/auto-reply";
import { getOrCreateMetaInboxItem } from "./sentinel-item";
import type {
  MetaWebhookEnvelope,
  NormalizedMetaMessage,
  MetaPlatform,
} from "./types";

const ID_PREFIX = "fbmid_";

export interface IngestResult {
  accepted: number;
  duplicates: number;
  skipped: number;
  errors: number;
}

function deterministicMessageId(platform: MetaPlatform, mid: string): string {
  const hash = createHash("sha256").update(`${platform}|${mid}`).digest("hex").slice(0, 26);
  return ID_PREFIX + hash;
}

function platformFromObject(obj: string): MetaPlatform | null {
  if (obj === "page") return "facebook";
  if (obj === "instagram") return "instagram";
  return null;
}

function normalizeMessages(envelope: MetaWebhookEnvelope): NormalizedMetaMessage[] {
  const platform = platformFromObject(envelope.object);
  if (!platform) return [];
  const out: NormalizedMetaMessage[] = [];

  for (const entry of envelope.entry ?? []) {
    for (const ev of entry.messaging ?? []) {
      const m = ev.message;
      if (!m || m.is_echo) continue; // echo = our own send
      if (!m.mid) continue;
      const text = m.text ?? (m.attachments?.length ? "[attachment]" : "");
      if (!text) continue;
      out.push({
        platform,
        pageId: ev.recipient.id,
        senderId: ev.sender.id,
        mid: m.mid,
        text,
        timestamp: new Date((ev.timestamp ?? Date.now())),
        productRef: ev.referral?.product?.id ?? ev.referral?.ref,
      });
    }
  }
  return out;
}

/**
 * Resolve which Legacy-Loop user owns the inbound page/IG account.
 * Single-tenant MVP: META_PAGE_OWNER_USER_ID env var.
 * Future: lookup table (no schema → JSON-encoded UserEvent metadata).
 */
function resolvePageOwnerUserId(_pageId: string): string | null {
  return process.env.META_PAGE_OWNER_USER_ID || null;
}

/**
 * Idempotent persist: returns counts for observability.
 * Safe to re-invoke on Meta retry — duplicate Message.id collisions are caught.
 */
export async function ingestMetaWebhook(envelope: MetaWebhookEnvelope): Promise<IngestResult> {
  const result: IngestResult = { accepted: 0, duplicates: 0, skipped: 0, errors: 0 };
  const messages = normalizeMessages(envelope);

  for (const m of messages) {
    try {
      const userId = resolvePageOwnerUserId(m.pageId);
      if (!userId) {
        result.skipped++;
        continue;
      }

      const itemId = await getOrCreateMetaInboxItem(userId, m.platform);

      // find-or-create Conversation by (itemId sentinel, platform, buyerName=senderId)
      let conversation = await prisma.conversation.findFirst({
        where: { itemId, platform: m.platform, buyerName: m.senderId },
        select: { id: true },
      });
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            itemId,
            buyerName: m.senderId,
            platform: m.platform,
            botScore: 50,
          },
          select: { id: true },
        });
      }

      // Idempotent Message insert
      const messageId = deterministicMessageId(m.platform, m.mid);
      try {
        await prisma.message.create({
          data: {
            id: messageId,
            conversationId: conversation.id,
            sender: "buyer",
            content: m.text,
            createdAt: m.timestamp,
          },
        });
        result.accepted++;
        // Fire-and-forget auto-reply (uses LiteLLM path per BINDING #10)
        void tryAutoReply(conversation.id, userId);
      } catch (e: unknown) {
        // P2002 unique-id collision → duplicate (idempotent skip)
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("Unique constraint") || msg.includes("UNIQUE")) {
          result.duplicates++;
        } else {
          result.errors++;
          console.error("[meta-ingest] Message create error:", msg);
        }
      }
    } catch (e: unknown) {
      result.errors++;
      console.error("[meta-ingest] Event error:", e instanceof Error ? e.message : String(e));
    }
  }

  return result;
}
