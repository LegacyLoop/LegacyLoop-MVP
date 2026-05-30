// CMD-W26-B · Detect Instagram Business account linked to a Facebook Page.
// Peg §5.2 · GET /{page-id}?fields=instagram_business_account
//
// Returns the IG Business Account id when linked, null when the Page has no
// linked IG Business account (and on any non-OK Graph response so the
// callback's success path is never blocked by an IG detect miss).

import { graphGet } from "@/lib/meta/graph";

const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || "v21.0";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

export interface IgDetectResult {
  igBusinessAccountId: string | null;
  ok: boolean;
  errorMessage?: string;
}

/**
 * Probe a Page for its linked IG Business account.
 * Caller passes the Page Access Token (not the user token).
 * Failures are non-fatal — return ok:false and the error message; never throw.
 */
export async function detectIgBusinessAccount(
  pageId: string,
  pageAccessToken: string,
): Promise<IgDetectResult> {
  const result = await graphGet(
    `${GRAPH_VERSION}/${encodeURIComponent(pageId)}`,
    {
      token: pageAccessToken,
      params: { fields: "instagram_business_account" },
    },
    (body) => {
      const rec = isRecord(body) ? body : {};
      const iba = isRecord(rec.instagram_business_account) ? rec.instagram_business_account : null;
      return { id: iba ? asString(iba.id) ?? null : null };
    },
  );

  if (!result.ok) {
    return { igBusinessAccountId: null, ok: false, errorMessage: result.error.message };
  }
  return { igBusinessAccountId: result.data.id, ok: true };
}
