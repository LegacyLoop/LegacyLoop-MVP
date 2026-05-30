// CMD-W25-META-L2 · Meta Messenger + Instagram webhook event shapes.
// Reference: Messenger Platform Webhook + Instagram Messaging Webhook docs.
// Forward-compat: only fields we read are typed; unknown fields ignored.

export type MetaPlatform = "facebook" | "instagram";

export interface MetaWebhookEnvelope {
  object: "page" | "instagram";
  entry: MetaEntry[];
}

export interface MetaEntry {
  id: string; // page id (Messenger) OR IG business account id
  time?: number;
  messaging?: MetaMessagingEvent[];
}

export interface MetaMessagingEvent {
  sender: { id: string }; // PSID / IGSID
  recipient: { id: string }; // page id / IG biz id
  timestamp?: number;
  message?: MetaInboundMessage;
  postback?: MetaPostback;
  delivery?: { mids?: string[] };
  read?: { watermark?: number };
  reaction?: { mid?: string; action?: string; reaction?: string };
  referral?: MetaReferral;
}

export interface MetaInboundMessage {
  mid: string;
  text?: string;
  is_echo?: boolean;
  attachments?: { type: string; payload?: { url?: string } }[];
  reply_to?: { mid: string };
}

export interface MetaPostback {
  mid?: string;
  payload?: string;
  title?: string;
}

export interface MetaReferral {
  ref?: string;
  source?: string;
  type?: string;
  product?: { id?: string };
}

export interface NormalizedMetaMessage {
  platform: MetaPlatform;
  pageId: string;
  senderId: string;
  mid: string;
  text: string;
  timestamp: Date;
  productRef?: string;
}
