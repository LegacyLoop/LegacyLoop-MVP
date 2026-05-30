// CMD-W25-META-L1 · Meta Lead Ads · fetch lead from Graph + upsert BuyerLead
// World-A (official Meta channel · approved app · page access token).
// Idempotent on leadgenId (BuyerLead.leadgenId @unique).

import { prisma } from "@/lib/db";
import { sendLeadCapiEvent } from "@/lib/meta/capi";

const GRAPH_VERSION = process.env.META_GRAPH_VERSION ?? "v21.0";

type FetchInput = {
  readonly leadgenId: string;
  readonly formId?: string;
  readonly pageId?: string;
  readonly createdTime?: number;
};

export type PersistResult = {
  readonly ok: boolean;
  readonly leadId?: string;
  readonly duplicate?: boolean;
  readonly reason?: string;
};

type GraphLeadFieldData = {
  name: string;
  values: string[];
};

type GraphLeadResponse = {
  id: string;
  created_time?: string;
  ad_id?: string;
  form_id?: string;
  field_data?: GraphLeadFieldData[];
};

/**
 * Fetch a single lead by leadgen_id via Graph API and persist to BuyerLead.
 * Idempotent: returns existing row if already persisted (BuyerLead.leadgenId @unique).
 * Returns ok=false (with reason) instead of throwing for graceful webhook 200.
 */
export async function fetchAndPersistLead(input: FetchInput): Promise<PersistResult> {
  // Idempotency fast-path · skip Graph fetch if already stored
  const existing = await prisma.buyerLead.findUnique({
    where: { leadgenId: input.leadgenId },
    select: { id: true },
  });
  if (existing) {
    return { ok: true, leadId: existing.id, duplicate: true };
  }

  const pageToken = process.env.META_PAGE_ACCESS_TOKEN;
  if (!pageToken) {
    return { ok: false, reason: "META_PAGE_ACCESS_TOKEN not configured" };
  }

  // Fetch lead from Graph · scope: leads_retrieval permission on page token
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(input.leadgenId)}`);
  url.searchParams.set("access_token", pageToken);
  url.searchParams.set("fields", "id,created_time,ad_id,form_id,field_data");

  let lead: GraphLeadResponse;
  try {
    const res = await fetch(url.toString(), { method: "GET" });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, reason: `Graph fetch failed ${res.status}: ${body.slice(0, 200)}` };
    }
    lead = (await res.json()) as GraphLeadResponse;
  } catch (e) {
    return { ok: false, reason: `Graph fetch error: ${e instanceof Error ? e.message : String(e)}` };
  }

  const fields = mapFieldData(lead.field_data ?? []);
  const buyerName = pickName(fields) ?? "Unknown";
  const buyerEmail = fields["email"] ?? null;
  const buyerPhone = fields["phone_number"] ?? fields["phone"] ?? null;
  const location = fields["city"] ?? fields["state"] ?? null;
  const searchingFor = fields["searching_for"] ?? fields["looking_for"] ?? null;

  // Lead-Ads leads have no item context · placeholder itemId required by schema
  // until BuyerBot dashboard maps lead-ad leads to items via formId binding (banked).
  const itemId = process.env.META_LEAD_AD_DEFAULT_ITEM_ID ?? "unassigned";

  const created = await prisma.buyerLead.create({
    data: {
      botId: null,
      itemId,
      platform: "facebook",
      sourceType: "lead_ad",
      source: "lead_ad",
      leadgenId: input.leadgenId,
      formId: lead.form_id ?? input.formId ?? null,
      pageId: input.pageId ?? null,
      rawJson: JSON.stringify({ lead, fields }).slice(0, 8000),
      buyerName,
      buyerHandle: buyerPhone,
      buyerEmail,
      location,
      searchingFor,
      outreachStatus: "PENDING",
    },
  });

  // CAPI close-loop · fire-and-forget · failure does not block persistence
  try {
    await sendLeadCapiEvent({
      leadgenId: input.leadgenId,
      email: buyerEmail,
      phone: buyerPhone,
      eventTime: input.createdTime ?? Math.floor(Date.now() / 1000),
    });
  } catch (e) {
    console.error("[Meta Leads] CAPI fire failed (non-blocking):", e);
  }

  return { ok: true, leadId: created.id };
}

function mapFieldData(fd: GraphLeadFieldData[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of fd) {
    if (f.name && Array.isArray(f.values) && f.values.length > 0) {
      out[f.name] = String(f.values[0]);
    }
  }
  return out;
}

function pickName(fields: Record<string, string>): string | null {
  if (fields["full_name"]) return fields["full_name"];
  const first = fields["first_name"] ?? "";
  const last = fields["last_name"] ?? "";
  const composed = `${first} ${last}`.trim();
  return composed || null;
}
