// CMD-W26-C · Facebook Page posting service (Peg §5.5).
//
// Five post modes against a Page: text, photo, album (multi-photo), link, and
// scheduled. All calls use a Page access token (caller-supplied — sourced from
// ConnectedPlatform.settingsJson by the connect flow). World-A only (Rule #11).
// NOT an AI call — direct platform posting — BINDING #10 not applicable.
// Reference: https://developers.facebook.com/docs/pages-api/posts

import { classifyMetaError, type MetaErrorAction } from "@/lib/meta/messenger/error-codes";

const GRAPH_BASE = process.env.META_GRAPH_BASE_URL || "https://graph.facebook.com/v21.0";

export interface PostResult {
  ok: boolean;
  status: number;
  id?: string; // post id / photo id
  errorMessage?: string;
  errorAction?: MetaErrorAction;
}

interface PageAuth {
  pageId: string;
  pageAccessToken: string;
}

async function graphPost(path: string, params: Record<string, string>): Promise<PostResult> {
  const url = `${GRAPH_BASE}/${path}`;
  const form = new URLSearchParams(params);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const json = (await res.json().catch(() => ({}))) as {
      id?: string;
      post_id?: string;
      error?: { message?: string; code?: number; error_subcode?: number };
    };
    if (!res.ok) {
      const code = json.error?.code;
      return {
        ok: false,
        status: res.status,
        errorMessage: json.error?.message ?? `HTTP ${res.status}`,
        errorAction:
          typeof code === "number"
            ? classifyMetaError(code, json.error?.error_subcode ?? null).action
            : undefined,
      };
    }
    return { ok: true, status: res.status, id: json.post_id ?? json.id };
  } catch (e: unknown) {
    clearTimeout(timeout);
    return { ok: false, status: 0, errorMessage: e instanceof Error ? e.message : String(e) };
  }
}

/** Mode 1 — plain text status. */
export function postText(auth: PageAuth, message: string): Promise<PostResult> {
  return graphPost(`${auth.pageId}/feed`, { message, access_token: auth.pageAccessToken });
}

/** Mode 2 — link share (optional caption). */
export function postLink(auth: PageAuth, link: string, message?: string): Promise<PostResult> {
  const params: Record<string, string> = { link, access_token: auth.pageAccessToken };
  if (message) params.message = message;
  return graphPost(`${auth.pageId}/feed`, params);
}

/** Mode 3 — single photo (optional caption). published=true posts immediately. */
export function postPhoto(auth: PageAuth, imageUrl: string, caption?: string): Promise<PostResult> {
  const params: Record<string, string> = { url: imageUrl, access_token: auth.pageAccessToken };
  if (caption) params.caption = caption;
  return graphPost(`${auth.pageId}/photos`, params);
}

/**
 * Mode 4 — album: upload each photo unpublished, then a feed post that
 * attaches all of them. Returns the feed-post result (or the first failure).
 */
export async function postAlbum(
  auth: PageAuth,
  imageUrls: string[],
  message?: string,
): Promise<PostResult> {
  if (imageUrls.length === 0) {
    return { ok: false, status: 0, errorMessage: "album requires at least one image" };
  }
  const mediaFbids: string[] = [];
  for (const url of imageUrls) {
    const r = await graphPost(`${auth.pageId}/photos`, {
      url,
      published: "false",
      access_token: auth.pageAccessToken,
    });
    if (!r.ok || !r.id) return r; // bail on first failure
    mediaFbids.push(r.id);
  }
  const params: Record<string, string> = { access_token: auth.pageAccessToken };
  if (message) params.message = message;
  mediaFbids.forEach((id, i) => {
    params[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id });
  });
  return graphPost(`${auth.pageId}/feed`, params);
}

/**
 * Mode 5 — scheduled post. publishAtUnix must be 10 min–6 months out (Meta rule).
 */
export function schedulePost(
  auth: PageAuth,
  message: string,
  publishAtUnix: number,
): Promise<PostResult> {
  return graphPost(`${auth.pageId}/feed`, {
    message,
    published: "false",
    scheduled_publish_time: String(publishAtUnix),
    access_token: auth.pageAccessToken,
  });
}
